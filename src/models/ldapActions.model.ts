import mongoose, { Document, Schema } from "mongoose";
import { LDAPAction } from "../config/types/ldapaction";

// Define the Schema
const ldapActionsSchema = new Schema<LDAPAction>(
  {
    checkeruser: { type: String },
    makeruser: { type: String },
    reason: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    requestAction: {
      type: String,
      enum: [
        "LINK_ACCOUNT",
        "UNLINK_ACCOUNT",
        "RESET_PIN",
        "UNLINK_DEVICE",
        "CHANGE_NAME",
        "REJECT_ACCOUNT",
        "CHANGE_PHONE_NUMBER",
        "ADD_ACCOUNT",
      ],
    },
    branchCode: { type: [String] },
    value: { type: String }, // action details like account number, phone number, etc.
    time: { type: Date, default: Date.now },
    businessId:{type: Schema.Types.ObjectId, ref: "Business"},
    realm:{type:String},
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the User
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Create the Model
const ldapActionsModel = mongoose.model<LDAPAction>("LDAPActions", ldapActionsSchema);

// Export the LDAPActions model
export default ldapActionsModel;
