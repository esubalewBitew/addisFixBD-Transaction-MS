/**
 * Load Module Dependencies.
 */
import { type PaginateModel } from 'mongoose'
import modelImports from './imports'

import { type Permission } from '../config/types/permission'

const { mongoose, paginator } = modelImports

mongoose.Promise = global.Promise

const Schema = mongoose.Schema

const PermissionSchema = new Schema<Permission>({
  permissionName: { type: String, required: true }
})

// add mongoose-troop middleware to support pagination
PermissionSchema.plugin(paginator)

// Expose the User Model
export default mongoose.model<Permission, PaginateModel<Permission>>(
  'Permission', PermissionSchema)
