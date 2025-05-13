import {
  type QueryOptions,
  type UpdateQuery,
  type FilterQuery,
  type Document,
  type Types,
  type ProjectionType,
  ObjectExpressionOperatorReturningObject,
} from "mongoose";

import { type PermissionGroup } from "./permission_group";

export interface ISession {
  _id?: Types.ObjectId;
  userID: Types.ObjectId;
  lastActivity: Date;
  sessionExpiry: Date;
}

export type Session = ISession & Document;

export interface SessionFilter extends FilterQuery<Session> {}

export interface SessionProjection extends ProjectionType<Session> {}

export interface SessionOptions extends QueryOptions<Session> {}

export interface SessionUpdate extends UpdateQuery<Session> {}

export type SessionCallback = (
  err: any,
  session:
    | (FlattenMaps<Session> & {
        _id: Types.ObjectId;
      })
    | null
) => void;

export type SessionCollectionCallback = (
  err: any,
  session:
    | Array<
        FlattenMaps<Session> & {
          _id: Types.ObjectId;
        }
      >
    | []
) => void;

export type SessionPaginatedCallBack = (
  err: any,
  result?: PaginateResult<any>
) => void;