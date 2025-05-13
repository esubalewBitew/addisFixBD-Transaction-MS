import mongoose from 'mongoose'
import moment from 'moment-timezone'
import paginator from 'mongoose-paginate-v2'

moment.tz.setDefault('Africa/Addis_Ababa')
mongoose.Promise = global.Promise

export type PaginateModel = mongoose.PaginateModel<any>

export default {
  mongoose,
  moment,
  paginator
}
