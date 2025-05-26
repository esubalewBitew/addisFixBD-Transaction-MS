// src/models/role.model.ts
import modules from "./imports/index";
import { type PaginateModel } from "mongoose";

const Schema = modules.mongoose.Schema;

const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  realm: { type: String, enum: ["portal", "client", "technical"], required: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: "Permissions" }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const roleModel = modules.mongoose.model("Role", RoleSchema);
export default roleModel;