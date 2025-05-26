import {
  type QueryOptions,
  type UpdateQuery,
  type FilterQuery,
  type Document,
  type Types,
  type ProjectionType,
  ObjectExpressionOperatorReturningObject,
} from "mongoose";

// import { type Permission } from './permission'
import { type PermissionGroup } from "./permission_group";

interface LinkedAccounts {
  accountNumber: string;
  linkedStatus: boolean;
  linkedDate: Date;
  lastLinkedStatus: boolean;
  andOrStatus: boolean;
  branchCode: string;
  CBSAccountData: object
}

interface Role {
  _id: Types.ObjectId;
  name: string;
  description: string;
  realm: string;
  permissions: Types.ObjectId[];
}

export interface IUser {
  _id: Types.ObjectId;
  userCode: string;
  fullName: string;
  motherName: string;
  nationality: string;

  gender: "male" | "female";
  birthDate: Date;
  phoneNumber: string;

  country?: string;
  region?: string;
  city?: string;
  subCity?: string;
  woreda?: string;
  houseNo?: string;
  documentFront?: string;
  documentBack?: string;
  photo?: string;
  signature?: string;
  role: Role;

  idNumber?: string;
  residentialStatus?: string;

  martialStatus: string;
  employmentStatus: string;
  occupation: string;
  employersName: string;
  monthlyIncome: string;

  avatar?: string;
  email?: string;
  userName: string;
  userBio: string;
  realm: string;

  documentImage?: string;
  userImage?: string;

  organizationID: string;
  organizationName: string;

  poolSource: "portal" | "app" | "merchant";
  merchantRole: "owner" | "agent"
  permissionGroup: PermissionGroup[];
  permissions?: Types.ObjectId[];

  isChecker?: boolean;
  isMaker?: boolean;

  linkedAccounts: LinkedAccounts[];
  andOrCustomerNumber: string[];
  mainAccount: string;
  teleBirrAccount: string;
  mpesaAccount: string;
  lastMainAccount: string;
  accountLinked: boolean;
  lastAccountLinked: boolean;
  accountStatus: string;
  accountType?: string;

  KYCStatus: "PENDING" | "APPROVED" | "REJECTED";

  KYCRejectReason: string;
  KYCRejectReasonField: array;

  KYCApproved: boolean;
  brachApproved: boolean;
  isVerified: boolean;

  isSelfRegistered: boolean;
  registerdBy: object;
  KYCActionBy: object[];
  BranchActionBy: object[];

  chatGroups: Types.ObjectId[];
  loginAttemptCount?: number;

  LDAPStatus: "AUTHORIZED" | "DENIED" | "PENDING" | "INITIATED";
  primaryAuthentication: "phoneNumber" | "email" | "emailAndPhone";
  loanScore: number;
  dateJoined: Date;
  lastModified: Date;
  lastLoginAttempt?: Date;
  nextLoginAttempt?: Date;
  lastLogin?: Date;
  lastOnlineDate?: Date;
  loginPIN?: string;
  firstPINSet: boolean
  deviceUUID?: string;
  devicePlatform?: "IOS", "ANDROID";
  deviceStatus?: "LINKED" | "UNLINKED";
  deviceLinkedDate: Date;
  sessionExpiresOn?: Date;
  accountBranchType: "CB" | "IFB";
  accountAuthorizationCode?: string;
  unlockAccountRequested: boolean;
  enabled?: boolean;
  isDeleted?: boolean;
  passwordChangedAt: Date;
  OTPStatus: string;
  OTPLastTriedAt: Date;
  OPTLastVerifiedAt: Date;
  OTPVerifyCount: number;
  PINHistory: string[];
  customerNumber: string;
  isAccountBlocked: boolean;
  APPInstallationDate: Date;
  pushToken: string;
  KYCLevel: string;
  virtualAccount: Boolean;
}

export type User = IUser & Document;

export interface UserFilter extends FilterQuery<User> {}

export interface UserProjection extends ProjectionType<User> {}

export interface UserOptions extends QueryOptions<User> {}

export interface UserUpdate extends UpdateQuery<User> {}

export type UserCallback = (
  err: any,
  user:
    | (FlattenMaps<User> & {
        _id: Types.ObjectId;
      })
    | null
) => void;

export type UserCollectionCallback = (
  err: any,
  user:
    | Array<
        FlattenMaps<User> & {
          _id: Types.ObjectId;
        }
      >
    | []
) => void;

export type UserPaginatedCallBack = (
  err: any,
  result?: PaginateResult<any>
) => void;
