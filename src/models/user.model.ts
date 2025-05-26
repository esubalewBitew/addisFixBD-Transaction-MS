import modules from "./imports/index";
import { type PaginateModel } from "mongoose";
import { type User } from "../config/types/user";

const Schema = modules.mongoose.Schema;

const UserSchema = new Schema<User>({
  userCode: { type: String },
  fullName: { type: String },
  nationality: { type: String },
  birthDate: { type: Date },
  phoneNumber: { type: String },
  gender: { type: String, enum: ["male", "female"] },

  // martialStatus: {
  //   type: String,
  //   enum: ["single", "married", "divorced", "widowed"],
  // },
  // employmentStatus: {
  //   type: String,
  //   enum: [
  //     "full-time",
  //     "part-time",
  //     "self-employed",
  //     "unemployed",
  //     "student",
  //     "retired",
  //     "freelance",
  //     "intern",
  //     "contract",
  //     "other",
  //   ],
  // },
  occupation: { type: String },
  employersName: { type: String },
  monthlyIncome: { type: String },

  country: { type: String },
  region: { type: String },
  city: { type: String },
  woreda: { type: String },
  subCity: { type: String },
  houseNo: { type: String },
  documentFront: { type: String },
  documentBack: { type: String },
  photo: { type: String },
  signature: { type: String },
  // role: { type: Schema.Types.ObjectId, ref: "Role" },
  role: { type: String , enum: ["user", "admin", "superadmin"]},
  idNumber: { type: String },
  residentialStatus: { type: String },

  avatar: { type: String },
  email: { type: String },
  userName: { type: String },
  userBio: { type: String },

  documentImage: { type: String },
  userImage: { type: String },

  organizationID: { type: String },
  organizationName: { type: String },
  realm: { type: String, enum: ["portal", "client", "technical"] },
  poolSource: { type: String, enum: ["portal", "app", "agent"] },
  merchantRole: { type: String, enum: ["owner", "agent"] },
  permissionGroup: [{ type: Schema.Types.ObjectId, ref: "PermissionGroups" }],
  permissions: [{ type: Schema.Types.ObjectId, ref: "Permissions" }],
  isChecker: { type: Boolean },
  isMaker: { type: Boolean },
  mainAccount: { type: String },
  teleBirrAccount: { type: String },
  mpesaAccount: { type: String },
  // lastMainAccount: { type: String },
  // linkedAccounts: [
  //   {
  //     accountNumber: { type: String },
  //     linkedStatus: { type: Boolean },
  //     linkedDate: { type: Date },
  //     lastLinkedStatus: { type: Boolean },
  //     andOrStatus: { type: Boolean },
  //     branchCode: { type: String },
  //     CBSAccountData: { type: Object }
  //   },
  // ],
  //accountLinked: { type: Boolean, default: false },
  //lastAccountLinked: { type: Boolean },
  //andOrCustomerNumber: [{ type: String }],
  //accountType: { type: String, enum: ["NEW", "LINKED"] },
  accountStatus: { type: String, enum: ["ACTIVE", "INACTIVE"] },

  // KYCStatus: {
  //   type: String,
  //   enum: ["PENDING", "APPROVED", "REJECTED"],
  //   default: "PENDING",
  // },

  // KYCRejectReasonField: { type: Array },
  // KYCRejectReason: { type: String },

  // KYCApproved: { type: Boolean, default: false }, // branch extra layer ?
  // brachApproved: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },

  isSelfRegistered: { type: Boolean },
  registerdBy: { type: Object }, // if not self registerd
  // KYCActionBy: [{ type: Object }],
  // BranchActionBy: [{ type: Object }],

  // chatGroups: [{ type: Schema.Types.ObjectId, ref: "Groups" }],
  // loginAttemptCount: { type: Number, default: 0 },
  dateJoined: { type: Date },
  lastModified: { type: Date },
  lastLoginAttempt: { type: Date },
  nextLoginAttempt: { type: Date },
  lastOnlineDate: { type: Date },
  lastLogin: { type: Date },

  // LDAPStatus: {
  //   type: String,
  //   enum: ["AUTHORIZED", "DENIED", "PENDING", "INITIATED"],
  //   default: "INITIATED",
  // },

  loginPIN: { type: String },
  firstPINSet: { type: Boolean, default: false },
  deviceUUID: { type: String },
  loanScore: { type: Number, default: 0 },
  // deviceStatus: { type: String, enum: ["LINKED", "UNLINKED"] },
  deviceLinkedDate: { type: Date },
  sessionExpiresOn: { type: Date },
  // accountBranchType: { type: String, enum: ["CB", "IFB"] },
  // accountAuthorizationCode: { type: String },
  unlockAccountRequested: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  passwordChangedAt: Date,
  OTPStatus: { type: String, enum: ["verified", "denied"] },
  OTPLastTriedAt: { type: Date },
  OPTLastVerifiedAt: { type: Date },
  OTPVerifyCount: { type: Number },
  
	// primaryAuthentication: {
	// 	type: String,
	// 	enum: ["phoneNumber", "email", "emailAndPhone"],
	// 	default: "phoneNumber",
	// },

  PINHistory: [{ type: String }],
  customerNumber: { type: String },
  isAccountBlocked: { type: Boolean, default: false },
  devicePlatform: { type: String, enum: ["IOS", "ANDROID"]},
});

// add mongoose-troop middleware to support pagination
UserSchema.plugin(modules.paginator);

UserSchema.pre<User>("save", function preSaveMiddleware(next) {
  const now = modules.moment().toDate();

  this.dateJoined = now;
  this.lastModified = now;

  next();
});
// Pre-save middleware to update passwordChangedAt field
UserSchema.pre<User>("save", function preSaveMiddleware(next) {
  if (!this.isModified("loginPIN") || this.isNew) return next();

  this.passwordChangedAt = modules.moment().toDate();

  next();
});
const userModel = modules.mongoose.model<User, PaginateModel<User>>(
  "User",
  UserSchema
);

// Expose the User Model
export default userModel;
