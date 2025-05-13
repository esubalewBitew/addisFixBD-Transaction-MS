import { type LeanDocument, type MongooseBulkWriteOptions, type PaginateResult, type PopulateOptions } from 'mongoose'

import permissionModel from '../models/permission.model'
import CustomErrorFunc from '../lib/custom-error'
import { type PermissionUpdate, type IPermission, type PermissionFilter, type PermissionOptions, type BulkWritePermission } from '../config/types/permission'
import { type BulkWriteResult } from 'mongodb'

const whitelist = {
}

const population: PopulateOptions[] = []

interface PermissionDalParams {
  method: 'create' | 'get' | 'get collection' | 'get paginate' | 'update' | 'delete' | 'insert many'
  query?: PermissionFilter
  options?: PermissionOptions
  data?: IPermission
  arrayOfData?: IPermission[]
  update?: PermissionUpdate
  write?: BulkWritePermission
  bulkOptions?: MongooseBulkWriteOptions
}

interface PermissionReturn {
  statusCode: number
  body: { error: unknown
    data?: IPermission | IPermission[] | PaginateResult<any> | null | BulkWriteResult | LeanDocument<any> & Required<{ _id: unknown }>
  }
}

/**
 * PermissionDal function
 */
export async function permissionDal (props: PermissionDalParams): Promise<PermissionReturn> {
  switch (props.method) {
    case 'create': {
      const { data } = props

      if (data != null) {
        return await createPermission(data)
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

      return await getPermission(query ?? {}, options)
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
        return await updatePermission(query!, update!, options)
      }
      return {
        statusCode: 400,
        body: {
          error: 'query or update not provided'
        }
      }
    }

    case 'insert many': {
      const { arrayOfData } = props

      if (arrayOfData != null && arrayOfData.length > 0) {
        return await insertManyPermission(arrayOfData)
      } else {
        return {
          statusCode: 400,
          body: {
            error: 'no data provided'
          }
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

async function createPermission (data: IPermission): Promise<PermissionReturn> {
  try {
    const permission = await permissionModel.create(data)

    return {
      statusCode: 201,
      body: {
        error: null,
        data: permission
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

async function getPermission (query: PermissionFilter, options?: PermissionOptions): Promise<PermissionReturn> {
  try {
    const permission = await permissionModel.findOne(query, whitelist ?? options).lean().populate(population)

    if (permission != null) {
      return {
        statusCode: 200,
        body: { error: null, data: permission }
      }
    } else {
      return {
        statusCode: 400,
        body: { error: 'permission not found' }
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

async function getCollection (query: PermissionFilter, options?: PermissionOptions): Promise<PermissionReturn> {
  try {
    const permissions = await permissionModel.find(query, { ...whitelist, ...options })
      .populate(population)
      .lean()

    return {
      statusCode: 200,
      body: {
        error: null,
        data: permissions
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

async function getPaginate (query: PermissionFilter, options?: PermissionOptions): Promise<PermissionReturn> {
  const opts = {
    select: whitelist,
    sort: (options != null) ? options.sort : {},
    populate: population,
    lean: true,
    page: (options != null) ? Number(options.page) : 1,
    limit: (options != null) ? Number(options.limit) : 10
  }

  try {
    const paginatedPermissionList = await permissionModel.paginate(query, opts)

    return {
      statusCode: 200,
      body: {
        error: null,
        data: paginatedPermissionList
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

async function updatePermission (query: PermissionFilter, update: PermissionUpdate, options?: PermissionOptions): Promise<PermissionReturn> {
  const opts = {
    new: true,
    select: whitelist,
    ...options
  }

  try {
    const permission = await permissionModel
      .findOneAndUpdate(query, update, opts)
      .populate(population)
      .lean()

    if (permission != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: permission
        }
      }
    }
    return {
      statusCode: 400,
      body: { error: 'error updating permission' }
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

async function insertManyPermission (arrayOfPermissions: IPermission[]): Promise<PermissionReturn> {
  try {
    const insertManyResult = await permissionModel.insertMany(arrayOfPermissions)

    return {
      statusCode: 200,
      body: {
        error: null,
        data: insertManyResult
      }
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: {
        error: err
      }
    }
  }
}

export default permissionDal
