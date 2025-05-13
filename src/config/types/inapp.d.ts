import { type Types, type Document, type UpdateQuery, type QueryOptions, type FlattenMaps, type ProjectionType, type FilterQuery } from 'mongoose'

export interface IInApp {
  invoiceAmount: { type: number }
  currency: { type: string }
  creditID: { type: Schema.Types.ObjectId, ref: 'Credit' }
  planID: { type: Schema.Types.ObjectId, ref: 'Plan' }
  merchantID: { type: Schema.Types.ObjectId, ref: 'Merchant' }
  memberID: { type: Schema.Types.ObjectId, ref: 'User' }
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' }
  billNo: { type: string }
  billPeriod: { type: string }
  dueDate: { type: Date }
  paidDate: { type: Date }
  paidByMember: { type: boolean }
  paymentAtBank: { type: string }
  FTNumber: { type: string }
  status: { type: string, default: 'UNPAID' }
  PDFLink: { type: string }
  enabled: { type: boolean, default: true }
  isDeleted: { type: boolean, default: false }
  createdAt: { type: Date }
  lastModified: { type: Date }
}

export type InApp = Document & IInApp

export interface InAppFilter extends FilterQuery<InApp> {}
export interface InAppProjection extends ProjectionType<InApp> {}
export interface InAppOptions extends QueryOptions<InApp> {}
export interface InAppUpdate extends UpdateQuery<InApp> {}
export type InAppCallBack = (err: any, inapp: (FlattenMaps<InApp> & {
  _id: Types.ObjectId
}) | null) => void
export type InAppCollectionCallBack = (err: any, inapp: Array<FlattenMaps<InApp> & {
  _id: Types.ObjectId
}> | []) => void
export type InApppaginatedCallBack = (err: any, result?: PaginateResult<any>) => void
