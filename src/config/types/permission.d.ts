import { type AnyBulkWriteOperation } from 'mongodb'
import { type ProjectionType, type Types, type Document, type FilterQuery, type QueryOptions, type UpdateQuery, type FlattenMaps } from 'mongoose'

export interface IPermission {
  permissionName: string
}

export type Permission = Document & IPermission

export interface PermissionFilter extends FilterQuery<Permission> {}
export interface PermissionProjection extends ProjectionType<Permission> {}
export interface PermissionOptions extends QueryOptions<Permission> {}
export interface PermissionUpdate extends UpdateQuery<Permission> {}
export type PermissionCallBack = (err: any, permission: (FlattenMaps<Permission> & {
  _id: Types.ObjectId
}) | null) => void
export type PermissionCollectionCallBack = (err: any, permission: Array<FlattenMaps<Permission> & {
  _id: Types.ObjectId
}> | []) => void
export type PermissionpaginatedCallBack = (err: any, result?: PaginateResult<any>) => void

export type BulkWritePermission = Array<AnyBulkWriteOperation<Permission>>
