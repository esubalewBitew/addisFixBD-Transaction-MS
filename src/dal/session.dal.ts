import { type PaginateResult, type PopulateOptions } from "mongoose";

import SessionModel from "../models/session.model";
import CustomErrorFunc from "../lib/custom-error";
import {
  type SessionUpdate,
  type ISession,
  type SessionFilter,
  type SessionOptions,
  type SessionProjection,
} from "../config/types/session";

const whitelist = {};

const population: PopulateOptions[] = [];

interface SessionDalParams {
  method:
    | "create"
    | "get"
    | "get collection"
    | "get paginate"
    | "update"
    | "delete";
  query?: SessionFilter;
  projection?: SessionProjection;
  options?: SessionOptions;
  data?: ISession;
  update?: SessionUpdate;
}

interface SessionReturn {
  statusCode: number;
  body: { error: unknown; data?: ISession | ISession[] | PaginateResult<any> };
}

export async function sessionDal(props: SessionDalParams): Promise<SessionReturn> {

  switch (props.method) {
    case "create": {
      const { data } = props;

      if (data != null) {
        return await createSession(data);
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
      return await getSession(query ?? {}, projection, options);
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
        return await updateSession(query!, update!, options);
      }
      return {
        statusCode: 400,
        body: {
          error: "query or update not provided",
        },
      };
    }

    case "delete": {
      const { query } = props;

      if (query !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await deleteSession(query);
      }
      return {
        statusCode: 400,
        body: {
          error: "query not provided",
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

async function createSession(data: ISession): Promise<SessionReturn> {
  try {
    const session = new SessionModel(data);
    const sessionSaved = await session.save();

    return {
      statusCode: 201,
      body: {
        error: null,
        data: sessionSaved.toObject(),
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

async function getSession(
  query: SessionFilter,
  projection?: SessionProjection,
  options?: SessionOptions
): Promise<SessionReturn> {
  try {
    const session = await SessionModel.findOne(
      query,
      projection ?? whitelist,
      options ?? {}
    )
      .lean()
      .populate(population);

    if (session != null) {
      return {
        statusCode: 200,
        body: { error: null, data: session },
      };
    } else {
      return {
        statusCode: 400,
        body: { error: "session not found" },
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
  query: SessionFilter,
  projection?: SessionProjection,
  options?: SessionOptions
): Promise<SessionReturn> {
  try {
    const sessions = await SessionModel.find(
      query,
      projection ?? whitelist,
      options ?? {}
    )
      .populate(population)
      .lean();

    return {
      statusCode: 200,
      body: {
        error: null,
        data: sessions,
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
  query: SessionFilter,
  options?: SessionOptions
): Promise<SessionReturn> {
  const sessions = {
    select: whitelist,
    sort: options != null ? options.sort : {},
    populate: population,
    lean: true,
    page: options != null ? Number(options.page) : 1,
    limit: options != null ? Number(options.limit) : 10,
  };

  try {
    const paginatedSessionList = await SessionModel.paginate(query, sessions);

    return {
      statusCode: 200,
      body: {
        error: null,
        data: paginatedSessionList,
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

async function updateSession(
  query: SessionFilter,
  update: SessionUpdate,
  options?: SessionOptions
): Promise<SessionReturn> {
  const sessions = {
    new: true,
    ...options,
  };

  try {
    const session = await SessionModel.findOneAndUpdate(query, update, sessions)
      .populate(population)
      .lean();

    if (session !== null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: session,
        },
      };
    }
    return {
      statusCode: 400,
      body: { error: "error updating session*" },
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

async function deleteSession(query: SessionFilter): Promise<SessionReturn> {
  try {
    const session = await SessionModel.findOneAndDelete(query).lean();

    if (session !== null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: session,
        },
      };
    }
    return {
      statusCode: 400,
      body: { error: "error deleting session" },
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

export default sessionDal;