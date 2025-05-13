import { type LeanDocument, type MongooseBulkWriteOptions, type PaginateResult, type PopulateOptions } from 'mongoose'

import permissionGroupModel from '../models/permission_group.model'
import PermissionModel from '../models/permission.model'
import CustomErrorFunc from '../lib/custom-error'
import { type PermissionGroupUpdate, type IPermissionGroup, type PermissionGroupFilter, type PermissionGroupOptions, type PermissionGroupProjection } from '../config/types/permission_group'
import { type BulkWriteResult, type AnyBulkWriteOperation } from 'mongodb'

const whitelist = {
}

const population: PopulateOptions[] = [
  {
    path: 'permissions',
    model: PermissionModel,
    select: {
      _id: 1,
      permissionName: 1
    }
  }
]

interface PermissionGroupDalParams {
  method:
    | "create"
    | "get"
    | "get collection"
    | "get paginate"
    | "update"
    | "delete"
    | "get group collection"
    | "insert many";
  query?: PermissionGroupFilter;
  arrayOfData?: IPermissionGroup[];
  projection?: PermissionGroupProjection;
  options?: PermissionGroupOptions;
  data?: IPermissionGroup;
  update?: PermissionGroupUpdate;
  write?: Array<AnyBulkWriteOperation<any>>;
  bulkOptions?: MongooseBulkWriteOptions;
}

interface PermissionGroupReturn {
  statusCode: number
  body: { error: unknown
    data?: IPermissionGroup | IPermissionGroup[] | null | PaginateResult<any> | BulkWriteResult | Array<LeanDocument<any>> & Required<{ _id: unknown }>
  }
}
interface PermissionGroupReturns {
  status_code: number;
  return_body: {
    error: unknown;
    data?:
      | IPermissionGroup
      | IPermissionGroup[]
      | null
      | PaginateResult<any>
      | BulkWriteResult
      | (Array<LeanDocument<any>> & Required<{ _id: unknown }>);
  };
}

/**
 * PermissionGroupDal function
 */
export async function permissionGroupDal (props: PermissionGroupDalParams): Promise<any> /*Promise<PermissionGroupReturn | PermissionGroupReturns>*/ {
  switch (props.method) {
    case "create": {
      const { data } = props;

      if (data != null) {
        return await createPermissionGroup(data);
      } else {
        return {
          statusCode: 400,
          body: {
            error: "no data provided",
          },
        };
      }
    }

    case "get": {
      const { query, projection, options } = props;

      return await getPermissionGroup(query ?? {}, projection, options);
    }

    case "get collection": {
      const { query, projection, options } = props;

      return await getCollection(query ?? {}, projection, options);
    }

    case "get group collection": {
      const { query, projection, options } = props;

      return await getGroupCollection(query ?? {}, projection, options);
    }

    case "get paginate": {
      const { query, options } = props;

      return await getPaginate(query ?? {}, options);
    }

    case "update": {
      const { query, options, update } = props;

      if (query !== undefined || update !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await updatePermissionGroup(query!, update!, options);
      }
      return {
        statusCode: 400,
        body: {
          error: "query or update not provided",
        },
      };
    }
    case "insert many": {
      const { arrayOfData } = props;

      if (arrayOfData != null && arrayOfData.length > 0) {
        return await insertManyPermissionGroup(arrayOfData);
      } else {
        return {
          statusCode: 400,
          body: {
            error: "no data provided",
          },
        };
      }
    }

    default: {
      return {
        statusCode: 500,
        body: {
          error: "Unknown database action",
        },
      };
    }
  }
}

async function createPermissionGroup (data: IPermissionGroup): Promise<PermissionGroupReturn> {
  try {
    const permissionGroup = await permissionGroupModel.create(data)

    return {
      statusCode: 201,
      body: {
        error: null,
        data: permissionGroup
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

async function getPermissionGroup (query: PermissionGroupFilter, projection?: PermissionGroupProjection, options?: PermissionGroupOptions): Promise<PermissionGroupReturn> {
  try {
    const permissionGroup = await permissionGroupModel.findOne(query, projection ?? whitelist, options).lean().populate(population)

    if (permissionGroup != null) {
      return {
        statusCode: 200,
        body: { error: null, data: permissionGroup as unknown as IPermissionGroup }
      }
    } else {
      return {
        statusCode: 400,
        body: { error: 'permissionGroup not found' }
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

async function getCollection (query: PermissionGroupFilter, projection?: PermissionGroupProjection, options?: PermissionGroupOptions): Promise<PermissionGroupReturn> {
  try {
    const permissionGroups = await permissionGroupModel.find(query, projection ?? whitelist, options)
      .populate(population)
      .lean()

    return {
      statusCode: 200,
      body: {
        error: null,
        data: permissionGroups as unknown as IPermissionGroup[]
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
async function getGroupCollection(
  query: PermissionGroupFilter,
  projection?: PermissionGroupProjection,
  options?: PermissionGroupOptions
): Promise<PermissionGroupReturns> {
  try {
    const permissionGroups = await permissionGroupModel
      .find(query, projection ?? whitelist, options)
      .populate(population)
      .lean();

    return {
      status_code: 200,
      return_body: {
        error: null,
        data: permissionGroups as unknown as IPermissionGroup[],
      },
    };
  } catch (err: any) {
    return {
      status_code: 500,
      return_body: {
        error: err.message,
      },
    };
  }
}

async function getPaginate (query: PermissionGroupFilter, options?: PermissionGroupOptions): Promise<PermissionGroupReturn> {
  const opts = {
    select: whitelist,
    sort: (options != null) ? options.sort : {},
    populate: population,
    lean: true,
    page: (options != null) ? Number(options.page) : 1,
    limit: (options != null) ? Number(options.limit) : 10
  }

  try {
    const paginatedPermissionGroupList = await permissionGroupModel.paginate(query, opts)

    return {
      statusCode: 200,
      body: {
        error: null,
        data: paginatedPermissionGroupList
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

async function updatePermissionGroup (query: PermissionGroupFilter, update: PermissionGroupUpdate, options?: PermissionGroupOptions): Promise<PermissionGroupReturn> {
  const opts = {
    new: true,
    select: whitelist,
    ...options
  }

  try {
    const permissionGroup = await permissionGroupModel
      .findOneAndUpdate(query, update, opts)
      .populate(population)
      .lean()

    if (permissionGroup != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: permissionGroup as unknown as IPermissionGroup
        }
      }
    }
    return {
      statusCode: 400,
      body: { error: 'error updating permissionGroup' }
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


async function insertManyPermissionGroup(
  arrayOfPermissions: IPermissionGroup[]
): Promise<PermissionGroupReturn> {
  try {
    const insertManyResult = await permissionGroupModel.insertMany(
      arrayOfPermissions
    );

    return {
      statusCode: 200,
      body: {
        error: null,
        data: insertManyResult,
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: {
        error: err,
      },
    };
  }
}

export default permissionGroupDal
