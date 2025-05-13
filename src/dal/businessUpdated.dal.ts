import { type PaginateResult, type PopulateOptions } from "mongoose";

import businessModel from "../models/business.model";
import CustomErrorFunc from "../lib/custom-error";
import {
  type BusinessUpdateUpdate,
  type IBusinessUpdate,
  type BusinessUpdateFilter,
  type BusinessUpdateOptions,
} from "../config/types/businessUpdate";
import userModel from "../models/user.model";
import merchantCategoryCodeModel from "../models/MerchantCategoryCode.model";

const whitelist = {};

const population: PopulateOptions[] = [
  {
    path: "adminID",
    model: userModel,
    select: {
      _id: 1,
      fullName: 1,
      userName: 1,
      phoneNumber: 1,
      email: 1,
    },
  },
  {
    path: "category",
    model: merchantCategoryCodeModel,
    select: {},
  },
];

interface BusinessDalParams {
  method:
    | "create"
    | "get"
    | "get collection"
    | "get paginate"
    | "update"
    | "delete";
  query?: BusinessUpdateFilter;
  options?: BusinessUpdateOptions;
  data?: IBusinessUpdate;
  update?: BusinessUpdateUpdate;
}

interface BusinessUpdateReturn {
  statusCode: number;
  body: {
    error: unknown;
    data?:
      | IBusinessUpdate
      | Omit<IBusinessUpdate, "password" | "_cred">
      | IBusinessUpdate[]
      | PaginateResult<any>;
  };
}

/**
 * BusinessDal function
 */
export async function businessDal(
  props: BusinessDalParams
): Promise<BusinessUpdateReturn> {
  switch (props.method) {
    case "create": {
      const { data } = props;

      if (data != null) {
        return await createBusiness(data);
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
      const { query, options } = props;

      return await getBusiness(query ?? {}, options);
    }

    case "get collection": {
      const { query, options } = props;

      return await getCollection(query ?? {}, options);
    }

    case "get paginate": {
      const { query, options } = props;

      return await getPaginate(query ?? {}, options);
    }

    case "update": {
      const { query, options, update } = props;

      if (query !== undefined || update !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await updateBusiness(query!, update!, options);
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

async function createBusiness(
  data: IBusinessUpdate
): Promise<BusinessUpdateReturn> {
  try {
    const business: any = await businessModel.create(data);

    return {
      statusCode: 201,
      body: {
        error: null,
        data: business,
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

async function getBusiness(
  query: BusinessUpdateFilter,
  options?: BusinessUpdateOptions
): Promise<BusinessUpdateReturn> {
  try {
    const business: any = await businessModel
      .findOne(query, whitelist ?? options)
      .lean()
      .populate(population);

    if (business != null) {
      return {
        statusCode: 200,
        body: { error: null, data: business },
      };
    } else {
      return {
        statusCode: 400,
        body: { error: "business not found" },
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
  query: BusinessUpdateFilter,
  options?: BusinessUpdateOptions
): Promise<BusinessUpdateReturn> {
  try {
    const businesss: any = await businessModel
      .find(query, { ...whitelist, ...options })
      .populate(population)
      .lean();

    return {
      statusCode: 200,
      body: {
        error: null,
        data: businesss,
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
  query: BusinessUpdateFilter,
  options?: BusinessUpdateOptions
): Promise<BusinessUpdateReturn> {
  const opts = {
    select: whitelist,
    sort: options != null ? options.sort : {},
    populate: population,
    lean: true,
    page: options != null ? Number(options.page) : 1,
    limit: options != null ? Number(options.limit) : 10,
  };
  console.log("paginate .... ");
  console.log("query ", query);
  console.log("opts ", opts);

  try {
    const paginatedBusinessList: any = await businessModel.paginate(
      query,
      opts
    );
    console.log("paginated business ", paginatedBusinessList);

    return {
      statusCode: 200,
      body: {
        error: null,
        data: paginatedBusinessList,
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

async function updateBusiness(
  query: BusinessUpdateFilter,
  update: BusinessUpdateUpdate,
  options?: BusinessUpdateOptions
): Promise<BusinessUpdateReturn> {
  const opts = {
    new: true,
    select: whitelist,
    ...options,
  };

  try {
    const business: any = await businessModel
      .findOneAndUpdate(query, update, opts)
      .populate(population)
      .lean();

    if (business != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: business,
        },
      };
    }
    return {
      statusCode: 400,
      body: { error: "error updating business" },
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

export default businessDal;
