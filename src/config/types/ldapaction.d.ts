import {
  type Types,
  type Document,
  type FilterQuery,
  type QueryOptions,
  type UpdateQuery,
  type ProjectionType,
} from "mongoose";

interface ILDAPAction extends Document {
  checkeruser?: string;
  makeruser?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestAction:
    | "LINK_ACCOUNT"
    | "UNLINK_ACCOUNT"
    | "RESET_PIN"
    | "UNLINK_DEVICE"
    | "CHANGE_PHONE_NUMBER"
    | "CHANGE_NAME"
    | "REJECT_ACCOUNT"
    | "ADD_ACCOUNT";
  value: string;
  reason?: string;
  time: Date;
  realm:string;
  businessId:mongoose.Types.ObjectId;
  branchCode?: string;
  user: mongoose.Types.ObjectId;
  createdAt?: Date; // Automatically managed
  updatedAt?: Date; // Automatically managed
}

export type LDAPAction = Document & ILDAPAction;

export interface LDAPActionFilter extends FilterQuery<LDAPAction> {}

export interface LDAPActionProjection extends ProjectionType {}

export interface LDAPActionOptions extends QueryOptions<LDAPAction> {}

export interface LDAPActionUpdate extends UpdateQuery<LDAPAction> {}

export type LDAPActionReturn =
  | (Document<unknown, unknown, LDAPAction> &
      ILDAPAction &
      Document<any, any, any> & {
        _id: Types.ObjectId;
      })
  | null;

export type LDAPActionCallback = (
  err: any,
  LDAPAction:
    | (FlattenMaps<LDAPAction> & {
        _id: Types.ObjectId;
      })
    | null
) => void;

export type LDAPActionPaginatedCallBack = (
  err: any,
  result?: PaginateResult<any>
) => void;
