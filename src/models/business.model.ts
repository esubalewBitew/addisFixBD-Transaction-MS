import modules from "./imports/index";
import paginator from "mongoose-paginate-v2";
const Schema = modules.mongoose.Schema;

const businessSchema = new Schema(
  {
    TILLNumber: { type: String },
    businessName: { type: String },
    accountNumber: { type: String },
    accountHolderName: { type: String },
    phoneNumber: { type: String },
    branchCode: { type: String },
    checkeruser: { type: String },
    makeruser: { type: String },
    branchName: { type: String },
    districtCode: { type: String },
    districtName: { type: String },
    adminID: { type: Schema.Types.ObjectId, ref: "User" },
    email: { type: String },
    totalCollectedAmount: { type: Number, default: 0 },
    totalPulledAmount: { type: Number, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: "MerchantCategoryCode" },
    licenseNumber: { type: String },
    TIN: { type: String },
    KYCStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    businessLogo: { type: String },
    region: { type: String },
    city: { type: String },
    LDAPStatus: {
      type: String,
      enum: ["AUTHORIZED", "DENIED", "PENDING"],
      default: "PENDING",
    },
    LdapRejectedFields: [String],
    countryISO2: { type: String, default: "ET" },
    currency: { type: String, default: "230" }, //from body code
    IPSEnabled: { type: Boolean, default: false }, //from body update
    MCC: { type: String }, //from body not always but first
    formatIndictor: { type: String, default: "01" },
    CRC: { type: String }, //algorthim from my side
    GUID: { type: String },
    zone: { type: String, default: "00" },
    woreda: { type: String },
    kebele: { type: String },
    houseNumber: { type: String },
    enabled: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

businessSchema.plugin(paginator);

// const businessSchema = new Schema(
//   {
//     buisnessName: { type: String },
//     TILLNumber: { type: String },
//     accountNumber: { type: String },
//     accountHolderName: { type: String },
//     phoneNumber: { type: String },

//     adminID: { type: Schema.Types.ObjectId, ref: "User" },

//     branchCode: { type: String },
//     districtCode: { type: String },

//     totalCollectedAmount: { type: Number, default: 0 },
//     totalPulledAmount: { type: Number, default: 0 },

//     email: { type: String },
//     category: { type: String },
//     licenseNumber: { type: String },
//     TIN: { type: String },
//     buisnessLogo: { type: String },
//     region: { type: String },
//     city: { type: String },
//     zone: { type: String },
//     woreda: { type: String },
//     kebele: { type: String },
//     houseNumber: { type: String },

//     enabled: { type: Boolean, default: true },
//     isDeleted: { type: Boolean, default: false },
//   },
//   {
//     timestamps: true,
//   }
// );

const businessModel = modules.mongoose.model("Business", businessSchema);

export default businessModel;
