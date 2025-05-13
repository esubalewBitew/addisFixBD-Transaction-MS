import {
  type ProjectionType,
  type Types,
  type Document,
  type QueryOptions,
  type FilterQuery,
  type UpdateQuery,
} from "mongoose";

export interface ILogAcc {
  activity_type: string;
  activityDescription?: string;
  status_message?: string;
  collection_name?: string;
  document?: string;
  currentUser: Types.ObjectId;
  affectedUser?: Types.ObjectId;
  actionParts?: Record<string, unknown>;
  device_type?: string;
  source?: string;
  os?: string;
  userCode?: string;
  deviceuuid?: string;
  private_ip?: string;
  public_ip?: string;
  date_created?: Date;
  last_modified?: Date;
}
export interface ILog {
  activity_type: string;
  activityDescription: { type: [string] };
  status_message: string;
  collection_name: string;
  document: string;
  user: Types.ObjectId;
  actionParts: { type: Record<string, unknown> };
  device_type: string;
  source: string;
  os: string;
  private_ip: string;
  public_ip: string;
  date_created: Date;
  last_modified: Date;
}

export type Log = Document & ILog;

export interface LogFilter extends FilterQuery<Log> {}
export interface LogProjection extends ProjectionType<Log> {}
export interface LogOptions extends QueryOptions<Log> {}
export interface LogUpdate extends UpdateQuery<Log> {}
export type LogCallBack = (
  err: any,
  logs:
    | (FlattenMaps<Log> & {
        _id: Types.ObjectId;
      })
    | null
) => void;
export type LogCollectionCallBack = (
  err: any,
  logs:
    | Array<
        FlattenMaps<Log> & {
          _id: Types.ObjectId;
        }
      >
    | []
) => void;
export type LogpaginatedCallBack = (
  err: any,
  result?: PaginateResult<any>
) => void;
