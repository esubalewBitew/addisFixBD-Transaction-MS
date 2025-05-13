import {
  type QueryOptions,
  type UpdateQuery,
  type FilterQuery,
  type Document,
  type Types,
  type ProjectionType,
} from "mongoose";

export interface IBusinessUpdate {
  TillNumber: string;
  businessName: string;
  accountNumber: string;
  accountHolderName: string;
  phoneNumber: string;
  branchCode: string;
  checkeruser: string;
  makeruser: string;
  branchName: string;
  districtCode: string;
  districtName: string;
  adminID: string;
  email: string;
  totalCollectedAmount: number;
  totalPulledAmount: number;
  category: string;
  licenseNumber: string;
  TIN: string;
  KYCStatus: string;
  businessLogo: string;
  region: string;
  city: string;
  LDAPStatus: string;
  LdapRejectedFields: string;
  countryISO2: string;
  currency: string;
  IPSEnabled: string;
  MCC: string;
  formatIndictor: string;
  CRC: string;
  GUID: string;
  zone: string;
  woreda: string;
  kebele: string;
  houseNumber: string;
  enabled: boolean;
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export type BusinessUpdate = IBusinessUpdate & Document;

export interface BusinessUpdateFilter extends FilterQuery<BusinessUpdate> {}
export interface BusinessUpdateProjection
  extends ProjectionType<BusinessUpdate> {}
export interface BusinessUpdateOptions extends QueryOptions<BusinessUpdate> {}
export interface BusinessUpdateUpdate extends UpdateQuery<BusinessUpdate> {}
export type BusinessUpdateCallBack = (
  err: any,
  BusinessUpdate:
    | (FlattenMaps<BusinessUpdate> & {
        _id: Types.ObjectId;
      })
    | null
) => void;
export type BusinessUpdateCollectionCallBack = (
  err: any,
  BusinessUpdate:
    | Array<
        FlattenMaps<BusinessUpdate> & {
          _id: Types.ObjectId;
        }
      >
    | []
) => void;
export type BusinessUpdatepaginatedCallBack = (
  err: any,
  result?: PaginateResult<any>
) => void;
