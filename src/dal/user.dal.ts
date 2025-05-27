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
export async function jobDal(props: any): Promise<any> {
  console.log("jobDal: =====> Received Request  ", props);
  switch (props.method) {
    case "create": {
      const { data } = props;

      if (data != null) {
        return await createJob(data);
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
      return await getJobs(query ?? {}, projection, options);
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
        return await updateJobs(query!, update!, options);
      }
      return {
        statusCode: 400,
        body: {
          error: "query or update not provided",
        },
      };
    }

    case "delete": {
      console.log("Delete Job Payload In Dal Update Case ===>", props);
      const { query, options, update } = props;

      if (query !== undefined || update !== undefined) {
        console.log("Update Job Payload In Dal Update Case ===>", query, update);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await deleteJobs(query!, update!, options);
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

async function createJob(data: IUser): Promise<UserReturn> {
  console.log("createJob under dal: =====> Received Request");
  try {
    const job = (await Jobs.create(data)).toObject();
    console.log('Job Dal Response ===> ',job);
    return {
      statusCode: 201,
      body: { error: null, data: job },
    };
  } catch (err: any) {
    console.log("createJob under dal: =====> Error", err);
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function getJobs(
  query: any,
  projection?: any,
  options?: any
): Promise<any> {
  try {
    // const jobData = await Jobs
    //   .find(query, projection ?? {})
    //   .lean()
    //   .populate(population);
    const jobData = await Jobs
      .find(query, projection ?? {}) // Remove whitelist, use empty object or specific projection
      .lean()
      .populate([
        { path: 'jobCreatedBy', model: 'User', select: 'fullName phoneNumber email' },
        { path: 'jobAssignedTechnician', model: 'User', select: 'fullName phoneNumber email' }
      ]); 

    if (jobData === null) {
      return {
        statusCode: 400,
        body: { error: "user not found" },
      };
    } else {
      return {
        statusCode: 200,
        body: { error: null, data: jobData },
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

async function updateJobs(
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
    const job = await Jobs
      .findOneAndUpdate(query, update, opts)
      //.populate(population)
      .lean();

    if (job != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: job,
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

async function deleteJobs(
  query: any,
  update: any,
  options?: any
): Promise<any> {
  const opts = {
    new: true,
    select: whitelist,
    ...options,
  };

  console.log("Delete Job Payload In Dal ==----===>", { query, update, opts });

  try {
    const job = await Jobs
      .findOneAndDelete(query, opts)
      .lean();

    if (job != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: {
            message: "Job deleted successfully",
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

export default jobDal;