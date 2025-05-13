import { type PaginateModel } from 'mongoose'
import modelImports from './imports'

import { type ChatInfo } from '../config/types/chatinfo'

const { moment, mongoose, paginator } = modelImports

const ChatInfoSchema = new mongoose.Schema<ChatInfo>({
  memberID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  userCode: { type: String },
  phoneNumber: { type: String },
  blockedMembers: [{ type: String }], // user codes
  membersChatting: [{ type: String }], // user codes
  blockedByMembers: [{ type: String }], // user codes
  invitedNumbers: [{ type: String }], // phone numbers
  createdAt: { type: Date },
  lastModified: { type: Date }
})

ChatInfoSchema.plugin(paginator)

ChatInfoSchema.pre<ChatInfo>('save', function preSave (next) {
  const now = moment().toDate()

  this.createdAt = now
  this.lastModified = now

  next()
})

const chatInfoModel = mongoose.model<ChatInfo, PaginateModel<ChatInfo>>(
  'ChatInfo',
  ChatInfoSchema
)

export default chatInfoModel
