import { type LeanDocument, type PaginateResult, type PopulateOptions } from 'mongoose'

import hqModel from '../models/hq.model'
import CustomErrorFunc from '../lib/custom-error'
import { type HQUpdate, type IHQ, type HQFilter, type HQOptions, type HQProjection } from '../config/types/hq'

const whitelist = {
}

const population: PopulateOptions[] = []

interface HQDalParams {
  method: 'create' | 'get' | 'get collection' | 'get paginate' | 'update' | 'delete'
  query?: HQFilter
  projection?: HQProjection
  options?: HQOptions
  data?: IHQ
  update?: HQUpdate
}

interface HQReturn {
  statusCode: number
  body: { error: unknown
    data?: IHQ | IHQ[] | PaginateResult<any> | LeanDocument<any> & Required<{ _id: unknown }>
  }
}

/**
 * HQDal function
 */
export async function hqDal (props: HQDalParams): Promise<HQReturn> {
  switch (props.method) {
    case 'create': {
      const { data } = props

      if (data != null) {
        return await createHQ(data)
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

      return await getHQ(query ?? {}, options)
    }

    case 'get collection': {
      const { query, projection, options } = props

      return await getCollection(query ?? {}, projection, options)
    }

    case 'get paginate': {
      const { query, options } = props

      return await getPaginate(query ?? {}, options)
    }

    case 'update': {
      const { query, options, update } = props

      if ((query !== undefined) || (update !== undefined)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await updateHQ(query!, update!, options)
      }
      return {
        statusCode: 400,
        body: {
          error: 'query or update not provided'
        }
      }
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

async function createHQ (data: IHQ): Promise<HQReturn> {
  try {
    const hq = await hqModel.create(data)

    return {
      statusCode: 201,
      body: {
        error: null,
        data: hq
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

async function getHQ (query: HQFilter, options?: HQOptions): Promise<HQReturn> {
  try {
    const hq = await hqModel.findOne(query, whitelist ?? options).lean().populate(population)

    if (hq != null) {
      return {
        statusCode: 200,
        body: { error: null, data: hq }
      }
    } else {
      return {
        statusCode: 400,
        body: { error: 'hq not found' }
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

async function getCollection (query: HQFilter, projection?: HQProjection, options?: HQOptions): Promise<HQReturn> {
  try {
    const hqs = await hqModel.find(query, projection ?? whitelist, options)
      .populate(population)
      .lean()

    return {
      statusCode: 200,
      body: {
        error: null,
        data: hqs
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

async function getPaginate (query: HQFilter, options?: HQOptions): Promise<HQReturn> {
  const opts = {
    select: whitelist,
    sort: (options != null) ? options.sort : {},
    populate: population,
    lean: true,
    page: (options != null) ? Number(options.page) : 1,
    limit: (options != null) ? Number(options.limit) : 10
  }

  try {
    const paginatedHQList = await hqModel.paginate(query, opts)

    return {
      statusCode: 200,
      body: {
        error: null,
        data: paginatedHQList
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

async function updateHQ (query: HQFilter, update: HQUpdate, options?: HQOptions): Promise<HQReturn> {
  const opts = {
    new: true,
    select: whitelist,
    ...options
  }

  try {
    const hq = await hqModel
      .findOneAndUpdate(query, update, opts)
      .populate(population)
      .lean()

    if (hq != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: hq
        }
      }
    }
    return {
      statusCode: 400,
      body: { error: 'error updating hq' }
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

export default hqDal
