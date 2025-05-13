import mongoose, { type FlattenMaps, type Types, type Document, type ProjectionType, type UpdateQuery, type FilterQuery, type QueryOptions, type AggregateOptions, type PipelineStage } from 'mongoose'

export interface IAccessList {
  accessList: object;
  user: mongoose.Schema.Types.ObjectId; // Reference to the User schema
  lastModified :Date
}

export type AccessList = Document & IAccessList

export interface AccessListFilter extends FilterQuery<AccessList> {}
export interface AccessListProjection extends ProjectionType<AccessList> {}
export interface AccessListOptions extends QueryOptions<AccessList> {}
export interface AccessListUpdate extends UpdateQuery<AccessList> {}
export interface AvailableAggregateOptions extends AggregateOptions<AccessList> {}
export type AccessListPipeline = PipelineStage<AccessList>
export type AccessListCallBack = (err: any, credit: (FlattenMaps<AccessList> & {
  _id: Types.ObjectId
}) | null) => void
export type AccessListCollectionCallBack = (err: any, credit: Array<FlattenMaps<AccessList> & {
  _id: Types.ObjectId
}> | []) => void
export type AccessListPaginatedCallBack = (err: any, result?: PaginateResult<any>) => void
