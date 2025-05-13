import {
  type Types,
  type Document,
  type FilterQuery,
  type QueryOptions,
  type UpdateQuery,
  type ProjectionType,
} from "mongoose";

export interface IOTP {
  _id?: Types.ObjectId;
  phoneNumber: string;
  accountNumber: number;
  userRealm: string;
  userCode: string;
  otpCode: string;
  billNo?: string;
  deviceUUID?: string;
  otpFor: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  lastModified: Date;
}

export type OTP = Document & IOTP;

export interface OTPFilter extends FilterQuery<OTP> {}

export interface OTPProjection extends ProjectionType {}

export interface OTPOptions extends QueryOptions<OTP> {}

export interface OTPUpdate extends UpdateQuery<OTP> {}

export type OTPReturn =
  | (Document<unknown, unknown, OTP> &
      IOTP &
      Document<any, any, any> & {
        _id: Types.ObjectId;
      })
  | null;

export type OTPCallback = (
  err: any,
  otp:
    | (FlattenMaps<OTP> & {
        _id: Types.ObjectId;
      })
    | null
) => void;

export type OTPPaginatedCallBack = (
  err: any,
  result?: PaginateResult<any>
) => void;
