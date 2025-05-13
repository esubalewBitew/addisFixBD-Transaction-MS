import { type PaginateModel } from 'mongoose'

import modelImports from './imports'

import { type AccessList } from '../config/types/accesslist'

const { moment, mongoose, paginator } = modelImports

const AccessListSchema = new mongoose.Schema<AccessList>({
  accessList: { type: Object},
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lastModified: { type: Date }
});

AccessListSchema.plugin(paginator)

AccessListSchema.pre<AccessList>('save', function preSave (next) {
  const now = moment().toDate()

  this.lastModified = now

  next()
})

const accessListModel = mongoose.model<AccessList, PaginateModel<AccessList>>(
  'AccessList',
  AccessListSchema
)

export default accessListModel