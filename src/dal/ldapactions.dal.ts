import {
  type LeanDocument,
  type PaginateResult,
  type PopulateOptions,
} from "mongoose";

import ldapActionsModel from "../models/ldapActions.model";

import {
  type LDAPActionUpdate,
  type ILDAPAction,
  type LDAPActionFilter,
  type LDAPActionOptions,
  type LDAPActionProjection,
} from "../config/types/ldapaction";

const whitelist = {};

const population: PopulateOptions[] = [];

interface LDAPActionDalParams {
  method:
    | "update multiple"
  query?: LDAPActionFilter;
  projection?: LDAPActionProjection;
  options?: LDAPActionOptions;
  data?: ILDAPAction;
  update?: LDAPActionUpdate;
}

interface LDAPActionReturn {
  statusCode: number;
  body: {
    error: unknown;
    data?:
      | ILDAPAction
      | ILDAPAction[]
      | PaginateResult<any>
      | (LeanDocument<any> & Required<{ _id: unknown }>)
      | any;
  };
}

export async function LDAPActionDal(props: LDAPActionDalParams): Promise<LDAPActionReturn> {
  switch (props.method) {
    case "update multiple": {
      const { query, options, update } = props;

      if (query !== undefined || update !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await updatemultipleLDAPActions(query!, update!, options);
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

async function updatemultipleLDAPActions(
  query: LDAPActionFilter,
  update: LDAPActionUpdate,
  options?: LDAPActionOptions
): Promise<LDAPActionReturn> {
  const opts = {
    new: true,
    ...options,
  };

  try {
    const LDAPActions = await ldapActionsModel.updateMany(query, update, opts).lean();
    if (LDAPActions != null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: LDAPActions,
        },
      };
    }

    return {
      statusCode: 400,
      body: { error: "error updating LDAP actions" },
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

export default LDAPActionDal;