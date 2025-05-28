import {
  type LeanDocument,
  type PaginateResult,
  type PopulateOptions,
} from "mongoose";

import userModel from "../models/user.model";
import PermissionModel from "../models/permission.model";
import PermissionGroupModel from "../models/permission_group.model";
import CustomErrorFunc from "../lib/custom-error";
import {
  type UserUpdate,
  type IUser,
  type UserFilter,
  type UserOptions,
  type UserProjection,
} from "../config/types/user";
import Jobs from "../models/jobs.model";
import Services from "../models/services.model";

// import utils from "../lib/utils";
// import { encryptPassword, verifyPassword } from "../lib/auth_functions";

const whitelist = {};

const population: PopulateOptions[] = [
  {
    path: "permissions",
    model: PermissionModel,
    select: {
      _id: 1,
      permissionName: 1,
    },
  },
  {
    path: "permissionGroup",
    model: PermissionGroupModel,
    select: {
      _id: 1,
      groupName: 1,
      permissions: 1,
    },
    populate: {
      path: "permissions",
      model: PermissionModel,
      select: {
        _id: 1,
        permissionName: 1,
      },
    },
  },
];

interface UserDalParams {
  method:
    | "create"
    | "get"
    | "get collection"
    | "get paginate"
    | "update"
    | "delete";
  query?: UserFilter;
  projection?: UserProjection;
  options?: UserOptions;
  data?: IUser;
  update?: UserUpdate;
}

interface UserReturn {
  statusCode: number;
  body: {
    error: unknown;
    data?:
      | IUser
      | IUser[]
      | PaginateResult<any>
      | (LeanDocument<any> & Required<{ _id: unknown }>);
  };
}

/**
 * JobDal function
/**
 * UserDal function
 */
  export async function serviceDal(props: any): Promise<any> {
  console.log("serviceDal: =====> Received Request  ", props);
  switch (props.method) {
    case "create": {
      const { data } = props;

      if (data != null) {
        return await createService(data);
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
      return await getServices(query ?? {}, projection, options);
    }

    case "get collection": {
      const { query, projection, options } = props;

      return await getCollection(query ?? {}, projection, options);
    }

    case "get paginate": {
      const { query, options } = props;

      return await getPaginate(query ?? {}, options);
    }

    case "update": {
      console.log("Update Job Payload In Dal Update Case ===>", props);
      const { query, options, update } = props;

      if (query !== undefined || update !== undefined) {
        console.log("Update Job Payload In Dal Update Case ===>", query, update);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await updateServices(query!, update!, options);
      }
      return {
        statusCode: 400,
        body: {
          error: "query or update not provided",
        },
      };
    }

    case "delete": {
      console.log("Delete Service Payload In Dal Update Case ===>", props);
      const { query, options, update } = props;

      if (query !== undefined || update !== undefined) {
        console.log("Update Service Payload In Dal Update Case ===>", query, update);
        return await deleteServices(query!, update!, options);
      }
      return {
        statusCode: 400,
        body: {
          error: "query or update not provided",
        },
      };
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

async function createService(data: IUser): Promise<UserReturn> {
  console.log("createService under dal: =====> Received Request");
  try {
    const service = (await Services.create(data)).toObject();
    console.log('Service Dal Response ===> ',service);
    return {
      statusCode: 201,
      body: { error: null, data: service },
    };
  } catch (err: any) {
    console.log("createService under dal: =====> Error", err);
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function getServices(
  query: any,
  projection?: any,
  options?: any
): Promise<any> {
  try {
    const serviceData = await Services
      .find(query, projection ?? {}) // Remove whitelist, use empty object or specific projection
      .lean()
      .populate([
        { path: 'serviceCreatedBy', model: 'User', select: 'fullName phoneNumber email' },
        { path: 'serviceUpdatedBy', model: 'User', select: 'fullName phoneNumber email' }
      ]); 

    if (serviceData === null) {
      return {
        statusCode: 400,
        body: { error: "Service not found" },
      };
    } else {
      return {
        statusCode: 200,
        body: { error: null, data: serviceData },
      };
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: new CustomErrorFunc(err.message),
      },
    };
  }
}

async function getCollection(
  query: UserFilter,
  projection?: UserProjection,
  options?: UserOptions
): Promise<UserReturn> {
  try {
    const users = await userModel
      .find(query, projection ?? whitelist, options)
      .populate(population)
      .lean();

    return {
      statusCode: 200,
      body: {
        error: null,
        data: users,
      },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function getPaginate(
  query: UserFilter,
  options?: UserOptions
): Promise<UserReturn> {
  const opts = {
    select: whitelist,
    sort: options != null ? options.sort : {},
    populate: population,
    lean: true,
    page: options != null ? Number(options.page) : 1,
    limit: options != null ? Number(options.limit) : 10,
  };

  try {
    const paginatedUserList = await userModel.paginate(query, opts);

    return {
      statusCode: 200,
      body: {
        error: null,
        data: paginatedUserList,
      },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function updateServices(
  query: any,
  update: any,
  options?: any
): Promise<any> {
  const opts = {
    new: true,
    select: whitelist,
    ...options,
  };

  console.log("Update Job Payload In Dal ==----===>", { query, update, opts });

  try {
    const service = await Services
      .findOneAndUpdate(query, update, opts)
      .populate([
        { path: 'serviceCreatedBy', model: 'User', select: 'fullName phoneNumber email role' },
        { path: 'serviceUpdatedBy', model: 'User', select: 'fullName phoneNumber email role' }
      ])
      .lean();

    if (service != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: service,
        },
      };
    }

    return {
      statusCode: 400,
      body: { error: "error updating service" },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function deleteServices(
  query: any,
  update: any,
  options?: any
): Promise<any> {
  const opts = {
    new: true,
    select: whitelist,
    ...options,
  };

  console.log("Delete Service Payload In Dal ==----===>", { query, update, opts });

  try {
    const service = await Services
      .findOneAndDelete(query, opts)
      .lean();

    if (service != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: {
            message: "Service deleted successfully",
          },
        },
      };
    }

    return {
      statusCode: 400,
      body: { error: "error updating job" },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

export default serviceDal;