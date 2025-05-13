import {
  type QueryOptions,
  type UpdateQuery,
  type FilterQuery,
  type Document,
  type Types,
  type ProjectionType,
  FlattenMaps,
  PaginateResult,
} from "mongoose";

export interface IMerchantCategory {
  _id: Types.ObjectId;
  mainCategoryRange: string;
  mainCategoryName: string;
  subCategories: object;
  enabled: boolean;
  isDeleted: boolean;
  createdAt: Date;
  lastModified: Date;
}

export type MerchantCategory = IMerchantCategory & Document;
export type MerchantCategoryFilter = FilterQuery<MerchantCategory>;
export type MerchantCategoryProjection = ProjectionType<MerchantCategory>;
export type MerchantCategoryOptions = QueryOptions<MerchantCategory>;
export type MerchantCategoryUpdate = UpdateQuery<MerchantCategory>;
export type MerchantCategoryCallBack = (
  err: any,
  MerchantCategory:
    | (FlattenMaps<MerchantCategory> & {
        _id: Types.ObjectId;
      })
    | null
) => void;
export type MerchantCategoryCollectionCallBack = (
  err: any,
  MerchantCategory:
    | Array<
        FlattenMaps<MerchantCategory> & {
          _id: Types.ObjectId;
        }
      >
    | []
) => void;
export type MerchantCategorypaginatedCallBack = (
  err: any,
  result?: PaginateResult<any>
) => void;
