import modules from "./imports/index";
import { type PaginateModel } from "mongoose";
import { type MerchantCategory } from "../config/types/merchantcategorycode";

const Schema = modules.mongoose.Schema;

const MerchantCategoryCodeSchema = new Schema<MerchantCategory>({
  mainCategoryRange: { type: String },
  mainCategoryName: { type: String },
  subCategories: { type: Object },
  createdAt: { type: Date },
  lastModified: { type: Date },
  enabled: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
});

MerchantCategoryCodeSchema.plugin(modules.paginator);

MerchantCategoryCodeSchema.pre<MerchantCategory>(
  "save",
  function preSaveMiddleware(next) {
    const now = modules.moment().toDate();

    this.createdAt = now;
    this.lastModified = now;

    next();
  }
);

const merchantCategoryCodeModel = modules.mongoose.model<
  MerchantCategory,
  PaginateModel<MerchantCategory>
>("MerchantCategoryCode", MerchantCategoryCodeSchema);

export default merchantCategoryCodeModel;
