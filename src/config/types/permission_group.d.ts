import { type Types, type Document, type FilterQuery, type ProjectionType, type QueryOptions, type UpdateQuery } from 'mongoose'
import { type IPermission } from './permission'

export interface IPermissionGroup {
  _id?: Types.ObjectId
  groupName: string
  permissions: IPermission[]
  realm?: string
  enabled: boolean
  isDeleted: boolean
  createdAt: Date
  lastModified: Date
}

export type PermissionGroup = Document & IPermissionGroup

export interface PermissionGroupFilter extends FilterQuery<PermissionGroup> {}

export interface PermissionGroupProjection extends ProjectionType<PermissionGroup> {}

export interface PermissionGroupOptions extends QueryOptions<PermissionGroup> {}

export interface PermissionGroupUpdate extends UpdateQuery<PermissionGroup> {}

export type PermissionGroupCollectionCallback = (err: any, pgroup: Array<FlattenMaps<ELST> & {
  _id: Types.ObjectId
}> | []) => void

export type PermissionGroupCallback = (err: any, pgroup: (FlattenMaps<ELST> & {
  _id: Types.ObjectId
}) | null) => void

export type PermissionGroupPaginatedCallBack = (err: any, result?: PaginateResult<any>) => void
