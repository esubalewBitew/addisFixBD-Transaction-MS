import { type Types, type Document, type FilterQuery, type QueryOptions, type UpdateQuery, type FlattenMaps, type PaginateResult, type ProjectionType } from 'mongoose'
export interface IHQ {
  name: string
  address?: string
  phoneNumber?: string
  email?: string
  linkedAccounts?: object[]
  users?: Types.ObjectId[]
  enabled: boolean
  isDeleted: boolean
  createdAt: Date
  lastModified: Date
  latestiOSVersion: string
  latestAndroidVersion: string
}

export type HQ = IHQ & Document

export interface HQFilter extends FilterQuery<HQ> {}
export interface HQProjection extends ProjectionType<HQ> {}
export interface HQOptions extends QueryOptions<HQ> {}
export interface HQUpdate extends UpdateQuery<HQ> {}
export type HQCallBack = (err: any, hq: (FlattenMaps<HQ> & {
  _id: Types.ObjectId
}) | null) => void
export type HQCollectionCallBack = (err: any, hq: Array<FlattenMaps<HQ> & {
  _id: Types.ObjectId
}> | []) => void
export type HQpaginatedCallBack = (err: any, result?: PaginateResult<any>) => void
