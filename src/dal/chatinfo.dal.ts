import { type PaginateResult, type PopulateOptions } from 'mongoose'

import chatInfoModel from '../models/chatinfo'
import CustomErrorFunc from '../lib/custom-error'
import { type ChatInfoUpdate, type IChatInfo, type ChatInfoFilter, type ChatInfoOptions } from '../config/types/chatinfo'
import { type DeleteResult } from 'mongodb'

const whitelist = {}

const population: PopulateOptions[] = []

interface ChatInfoDalParams {
  method: 'create' | 'get' | 'get collection' | 'get paginate' | 'update' | 'delete'
  query?: ChatInfoFilter
  options?: ChatInfoOptions
  data?: IChatInfo
  update?: ChatInfoUpdate
}

interface ChatInfoReturn {
  statusCode: number
  body: { error: unknown
    data?: IChatInfo | Omit<IChatInfo, 'password' | '_cred' > | IChatInfo[] | PaginateResult<any> | DeleteResult
  }
}

export async function chatInfoDal (props: ChatInfoDalParams): Promise<ChatInfoReturn> {
  switch (props.method) {
    case 'create': {
      const { data } = props

      if (data != null) {
        return await createChatInfo(data)
      } else {
        return {
          statusCode: 400,
          body: {
            error: 'no data provided'
          }
        }
      }
    }

    case 'get': {
      const { query, options } = props

      return await getChatInfo(query ?? {}, options)
    }

    case 'get collection': {
      const { query, options } = props

      return await getCollection(query ?? {}, options)
    }

    case 'get paginate': {
      const { query, options } = props

      return await getPaginate(query ?? {}, options)
    }

    case 'update': {
      const { query, options, update } = props

      if ((query !== undefined) || (update !== undefined)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await updateChat(query!, update!, options)
      }
      return {
        statusCode: 400,
        body: {
          error: 'query or update not provided'
        }
      }
    }

    case 'delete': {
      const { query } = props

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return await deleteChatInfos(query!)
    }

    default: {
      return {
        statusCode: 500,
        body: {
          error: 'Unknown database action'
        }
      }
    }
  }
}

async function createChatInfo (data: IChatInfo): Promise<ChatInfoReturn> {
  try {
    const chat = await chatInfoModel.create(data)

    return {
      statusCode: 201,
      body: {
        error: null,
        data: chat
      }
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message
      }
    }
  }
}

async function getChatInfo (query: ChatInfoFilter, options?: ChatInfoOptions): Promise<ChatInfoReturn> {
  try {
    const chatinfo = await chatInfoModel.findOne(query, whitelist ?? options).lean().populate(population)

    if (chatinfo != null) {
      return {
        statusCode: 200,
        body: { error: null, data: chatinfo }
      }
    } else {
      return {
        statusCode: 400,
        body: { error: 'chat not found' }
      }
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: new CustomErrorFunc(err.message)
      }
    }
  }
}

async function getCollection (query: ChatInfoFilter, options?: ChatInfoOptions): Promise<ChatInfoReturn> {
  try {
    const chatinfos = await chatInfoModel.find(query, { ...whitelist, ...options })
      .populate(population)
      .lean()

    return {
      statusCode: 200,
      body: {
        error: null,
        data: chatinfos
      }
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message
      }
    }
  }
}

async function getPaginate (query: ChatInfoFilter, options?: ChatInfoOptions): Promise<ChatInfoReturn> {
  const opts = {
    select: whitelist,
    sort: (options != null) ? options.sort : {},
    populate: population,
    lean: true,
    page: (options != null) ? Number(options.page) : 1,
    limit: (options != null) ? Number(options.limit) : 10
  }

  try {
    const paginatedChatInfoList = await chatInfoModel.paginate(query, opts)

    return {
      statusCode: 200,
      body: {
        error: null,
        data: paginatedChatInfoList
      }
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message
      }
    }
  }
}

async function updateChat (query: ChatInfoFilter, update: ChatInfoUpdate, options?: ChatInfoOptions): Promise<ChatInfoReturn> {
  const opts = {
    new: true,
    select: whitelist,
    ...options
  }

  try {
    const chatinfo = await chatInfoModel
      .findOneAndUpdate(query, update, opts)
      .populate(population)
      .lean()

    if (chatinfo != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: chatinfo
        }
      }
    }
    return {
      statusCode: 400,
      body: { error: 'error updating chatinfo' }
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message
      }
    }
  }
}

async function deleteChatInfos (query: ChatInfoFilter): Promise<ChatInfoReturn> {
  try {
    const result = await chatInfoModel.deleteMany(query)

    return { statusCode: 200, body: { error: null, data: result } }
  } catch (err:any) {
    return { statusCode: 500, body: { error: err.message } }
  }
}

export default chatInfoDal
