/**
 * OTP Model Definition.
 */
import { type PaginateModel } from "mongoose";
import modelImports from "./imports";

import { type OTP } from "../config/types/otp";

const { mongoose } = modelImports;

const OTPSchema = new mongoose.Schema<OTP>({
  phoneNumber: { type: String },
  accountNumber: { type: Number },
  userRealm: { type: String },
  userCode: { type: String },
  otpCode: { type: String },
  billNo: { type: String },
  deviceUUID: { type: String },
  otpFor: {
    type: String,
    enum: [
      "presignup",
      "login",
      "pinset",
      "activateaccount",
      "transfer",
      "pinreset",
      "signup",
      "accountlink",
      "accountunlink",
      "createagent",
      "changephone",
      "changepin",
      "removeaccount",
      "detachphone",
      "attachphone",
      "activateaccount",
      "presignup"
    ],
  },
  status: { type: String, default: "REQUESTED" },
  expiresAt: { type: Date },
  createdAt: { type: Date },
  lastModified: { type: Date },
});

export default mongoose.model<OTP, PaginateModel<OTP>>("OTP", OTPSchema);
