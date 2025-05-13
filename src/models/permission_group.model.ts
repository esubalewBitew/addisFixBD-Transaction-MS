/**
 * PermissionGroup Model Definition.
 */
import { type PaginateModel } from 'mongoose'
import modelImports from './imports'

import { type PermissionGroup } from '../config/types/permission_group'

const { moment, mongoose, paginator } = modelImports

const PermissionGroupSchema = new mongoose.Schema<PermissionGroup>({
  groupName: { type: String, required: true },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  realm: { type: String, enum: ['elst', 'bank', 'district', 'branch', 'merchant', 'company', 'member'] },
  enabled: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date },
  lastModified: { type: Date }
})

// add mongoose-troop middleware to support pagination
PermissionGroupSchema.plugin(paginator)

PermissionGroupSchema.pre<PermissionGroup>('save', function preSaveMiddleware (next) {
  const now = moment().toDate()

  this.createdAt = now
  this.lastModified = now

  next()
})

const permissionGroupModel = mongoose.model<PermissionGroup, PaginateModel<PermissionGroup>>(
  'PermissionGroup',
  PermissionGroupSchema
)

// Expose the PermissionGroup Model
export default permissionGroupModel
