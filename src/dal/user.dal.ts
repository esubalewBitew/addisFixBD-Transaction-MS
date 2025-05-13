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
 * UserDal function
 */
export async function userDal(props: UserDalParams): Promise<UserReturn> {
  switch (props.method) {
    case "create": {
      const { data } = props;

      if (data != null) {
        return await createUser(data);
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

      // console.log("#----- user query props ----", props);

      return await getUser(query ?? {}, projection, options);
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
      const { query, options, update } = props;

      if (query !== undefined || update !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await updateUser(query!, update!, options);
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

async function createUser(data: IUser): Promise<UserReturn> {
  try {
    const user = (await userModel.create(data)).toObject();

    return {
      statusCode: 201,
      body: { error: null, data: user },
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

async function getUser(
  query: UserFilter,
  projection?: UserProjection,
  options?: UserOptions
): Promise<UserReturn> {
  try {
    const user = await userModel
      .findOne(query, projection ?? whitelist, options)
      .lean()
      .populate(population);

    if (user === null) {
      return {
        statusCode: 400,
        body: { error: "user not found" },
      };
    } else {
      return {
        statusCode: 200,
        body: { error: null, data: user },
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

async function updateUser(
  query: UserFilter,
  update: UserUpdate,
  options?: UserOptions
): Promise<UserReturn> {
  const opts = {
    new: true,
    select: whitelist,
    ...options,
  };

  try {
    const user = await userModel
      .findOneAndUpdate(query, update, opts)
      .populate(population)
      .lean();

    if (user != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: user,
        },
      };
    }

    return {
      statusCode: 400,
      body: { error: "error updating user" },
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

export default userDal;