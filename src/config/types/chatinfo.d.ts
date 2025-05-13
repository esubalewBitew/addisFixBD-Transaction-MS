import { type FlattenMaps, type Types, type Document, type ProjectionType, type UpdateQuery, type FilterQuery, type QueryOptions, type AggregateOptions, type PipelineStage } from 'mongoose'

export interface IChatInfo {
  _id?: string
  memberID: Types.ObjectId
  userCode: string
  phoneNumber: string
  blockedMembers: string[]
  membersChatting: string[]
  blockedByMembers: string[]
  invitedNumbers: string[]
  createdAt: Date
  lastModified: Date
}

export type ChatInfo = Document & IChatInfo

export interface ChatInfoFilter extends FilterQuery<ChatInfo> {}
export interface ChatInfoProjection extends ProjectionType<ChatInfo> {}
export interface ChatInfoOptions extends QueryOptions<ChatInfo> {}
export interface ChatInfoUpdate extends UpdateQuery<ChatInfo> {}
export interface AvailableAggregateOptions extends AggregateOptions<ChatInfo> {}
export type ChatInfoPipeline = PipelineStage<ChatInfo>
export type ChatInfoCallBack = (err: any, credit: (FlattenMaps<ChatInfo> & {
  _id: Types.ObjectId
}) | null) => void
export type ChatInfoCollectionCallBack = (err: any, credit: Array<FlattenMaps<ChatInfo> & {
  _id: Types.ObjectId
}> | []) => void
export type ChatInfoPaginatedCallBack = (err: any, result?: PaginateResult<any>) => void
