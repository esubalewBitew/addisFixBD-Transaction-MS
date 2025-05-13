import modules from './imports/index'
import { type PaginateModel } from 'mongoose'
import { type HQ } from '../config/types/hq'

const Schema = modules.mongoose.Schema

const HQSchema = new Schema<HQ>({
  name: { type: String },
  address: { type: String },
  phoneNumber: { type: String },
  email: { type: String },
  linkedAccounts: [{ 
    accountNumber: { type: String }, 
    linkedStatus: { type: Boolean },
    linkedDate: { type: Date }
  }],
  latestiOSVersion: { type: String },
  latestAndroidVersion: { type: String },
  enabled: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date },
  lastModified: { type: Date }
})

// add mongoose-troop middleware to support pagination
HQSchema.plugin(modules.paginator)

/**
 * Pre save middleware.
 *
 * Sets the date_created and last_modified attributes prior to save
 */
HQSchema.pre<HQ>('save', function preSave (next) {
  const now = modules.moment().toDate()

  this.createdAt = now
  this.lastModified = now

  next()
})

const HQModel = modules.mongoose.model<HQ, PaginateModel<HQ>>('HQ', HQSchema)

export default HQModel
