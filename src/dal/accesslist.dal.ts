import { type PaginateResult, type PopulateOptions } from 'mongoose'

import acccessListModel from '../models/accesslist.model'
import CustomErrorFunc from '../lib/custom-error'
import { type AccessListUpdate, type IAccessList, type AccessListFilter, type AccessListOptions } from '../config/types/accesslist'
import { type DeleteResult } from 'mongodb'

const whitelist = {}

const population: PopulateOptions[] = []

interface AccessListDalParams {
  method: 'create' | 'get' | 'get collection' | 'get paginate' | 'update' | 'delete'
  query?: AccessListFilter
  options?: AccessListOptions
  data?: IAccessList
  update?: AccessListUpdate
}

interface AccessListReturn {
  statusCode: number
  body: { error: unknown
    data?: IAccessList | Omit<IAccessList, 'password' | '_cred' > | IAccessList[] | PaginateResult<any> | DeleteResult
  }
}

export async function accessListDal (props: AccessListDalParams): Promise<AccessListReturn> {
  switch (props.method) {
    case 'get': {
      const { query, options } = props

      return await getAccessList(query ?? {}, options)
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

async function getAccessList (query: AccessListFilter, options?: AccessListOptions): Promise<AccessListReturn> {
  try {
    const accesslist = await acccessListModel.findOne(query, whitelist ?? options).lean().populate(population)

    if (accesslist != null) {
      return {
        statusCode: 200,
        body: { error: null, data: accesslist }
      }
    } else {
      return {
        statusCode: 400,
        body: { error: 'access list not found' }
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

export default accessListDal
