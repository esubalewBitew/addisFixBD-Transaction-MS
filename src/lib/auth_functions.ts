import crypto from "crypto";
import jwt from "jsonwebtoken";

import moment from "moment";
import { type Types } from "mongoose";
import zlib from "zlib";
import util from "util";

// import utils from "../lib/utils.ts";
import utils from "../lib/utils";

import userDal from "../dal/user.dal";
import { type IUser } from "../config/types/user";

import sessionDal from "../dal/session.dal";
import { TopLevelConfig } from "../config/types/config.js";
const deflate = util.promisify(zlib.deflate);

const _valuemapping: any = {
  sms: "phoneNumber",
  email: "email",
  both: "emailAndPhone",
};

interface Permission {
  _id: Types.ObjectId;
  permissionName: string;
}

interface PermissionGroup {
  _id: Types.ObjectId;
  groupName: string;
  permissions: Permission[];
}

declare global {
  var _CONFIG: TopLevelConfig;
}

const handleSession = async (user: any): Promise<void> => {
  console.log("---- inside session for user ", user._id);
  try {
    const { statusCode: sessionDalStatusCode, body: sessionDalBody } =
      await sessionDal({
        method: "get",
        query: { userID: user._id },
      });

    console.log("       session status", sessionDalStatusCode);
    if (sessionDalStatusCode === 200) {
      console.log("----- update session----");
      const _sessionmin =
        user.realm === "member"
          ? global._CONFIG._VALS.APP_SESSIONEXPIREY
          : global._CONFIG._VALS.DASH_SESSIONEXPIREY;
      const _sessionexpiry = new Date(
        new Date().getTime() + _sessionmin * 60 * 1000
      ); //moment().add(_sessionmin, 'minutes')//
      sessionDal({
        method: "update",
        query: { userID: user._id },
        update: {
          lastActivity: new Date(),
          sessionExpiry: _sessionexpiry,
        },
      });
    } else {
      console.log("----- new session create----");
      sessionDal({
        method: "create",
        data: {
          userID: user._id,
          lastActivity: new Date(),
          sessionExpiry: new Date(
            new Date().getTime() +
              Number(
                String(global._CONFIG._VALS.APP_SESSIONEXPIREY).split("m")[0]
              ) *
                60 *
                1000
          ),
        },
      });
    }
  } catch (error:any) {
    console.log("----- error on session update----", error.message);
  }
};

const updateUser = async (
  user: any,
  token: string,
  sourceapp: string,
  deviceuuid: string,
  setpin: boolean,
  platform: string,
  fcmtoken: String | undefined
): Promise<void> => {
  let updatedata = {
    sessionExpiresOn: user.sessionexpiry,
    loginAttemptCount: 0,
    lastLogin: moment.utc().toISOString(),
    lastModified: moment.utc().toISOString(),
  } as any;

  if (user.userrealm === "merchant" && sourceapp === "agentapp")
    updatedata.deviceUUID = deviceuuid;
  if (user.userrealm === "member") {
    if (setpin) updatedata.devicePlatform = String(platform).toUpperCase();
    updatedata.pushToken = fcmtoken;
  }

  try {
    const { statusCode: userDalStatusCode, body: userDalBody } = await userDal({
      method: "update",
      query: { _id: user.userid },
      update: updatedata,
    });

    if (userDalStatusCode === 200) {
      // handleSession(userDalBody.data);
      console.log("----- user token updated----");
    } else {
      console.log("----- user token update failed----");
    }
  } catch (error:any) {
    console.log("----- error on ser token update----", error.message);
  }
};

export function verifyPassword({
  password,
  inputPassword,
}: {
  password: string;
  inputPassword: string;
}): boolean {
  const {
    PWDSecretKey,
    PWDiv,
    _JWTSECRET,
    _REFRESHSECRET,
    _JWTEXPIREY,
    _REFRESHEXPIREY,
  } = global._CONFIG._VALS;
  try {
    console.log("Verifying password", password, inputPassword);
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(PWDSecretKey),
      PWDiv
    );
    let decrypted = decipher.update(password, "hex", "utf8");

    decrypted += decipher.final("utf8");
    console.log("decrypted", decrypted);
    console.log("inputPassword", inputPassword);
    return decrypted === inputPassword;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function tokenMaker(
  user: IUser & { _id: Types.ObjectId },
  tokentype: string,
  sourceapp: string,
  publicKey: string,
  deviceuuid: string,
  setpin: boolean,
  platform: string,
  fcmtoken: String | undefined
): Promise<string> {
  const {
    PWDSecretKey,
    PWDiv,
    _JWTSECRET,
    _JWTEXPIREY,
    APP_JWTEXPIREY,
    DASH_JWTEXPIREY,
    APP_SESSIONEXPIREY,
  } = global._CONFIG._VALS;
  const _thissecret = _JWTSECRET;
  const _expiresin = String(sourceapp).includes("app")
    ? APP_JWTEXPIREY
    : DASH_JWTEXPIREY;

  const _permissions: string[] = [];

  user.permissionGroup?.map((_pgroup) => {
    _pgroup.permissions.map((_permission) => {
      console.log("permission ", _permission);
      _permissions.push(_permission.permissionName);
    });
  });
  console.log("tokenMaker user", user);
  console.log("permission ", _permissions);
  const _attribs: any = {
    userid: user._id,
    usercode: user.userCode,
    fullname: user.fullName,
    organizationid: user.organizationID,
    phonenumber: user.phoneNumber,
    useremail: user.email || "",
    userrealm: user.realm,
    userrole: user.merchantRole || "",
    ifbmember: user.accountBranchType
      ? String(user.accountBranchType).toLowerCase() === "ifb"
      : false,
    deviceuuid: user.deviceUUID,
    userDeviceLinkedDate: user.deviceLinkedDate,
    permissions: _permissions,
    primaryauth:
      user.realm === "member"
        ? Object.keys(_valuemapping).find(
            (key) => _valuemapping[key] === user.primaryAuthentication
          )
        : "",
    sessionexpiry: moment().add(APP_SESSIONEXPIREY, "minute").format(),

    publicKey: publicKey,
  };
  console.log("tokenMaker _attribs", _attribs);

  const jsonString = JSON.stringify(_attribs);

  const compressedBuffer = await deflate(jsonString);

  const encrypted = utils.localEncryptPassword(
    compressedBuffer.toString("base64")
  );
  let signedToken = jwt.sign({ data: encrypted }, _thissecret, {
    ...{ expiresIn: _expiresin },
    algorithm: "HS256",
  });

  updateUser(
    _attribs,
    signedToken,
    sourceapp,
    deviceuuid,
    setpin,
    platform,
    fcmtoken
  );
  return signedToken;
}

export function tempTokenMaker(
  user: IUser | any,
  permissions: string[],
  publicKey: string
): string {
  const { _JWTSECRET, _JWTEXPIREY } = global._CONFIG._VALS;
  const _thissecret = _JWTSECRET;
  const _expiresin = _JWTEXPIREY;

  const _attribs: any = {
    userid: user._id,
    usercode: user.userCode,
    fullname: user.fullName,
    phonenumber: user.phoneNumber,
    permissions: permissions, //["set pin", "pin login", "confirm login", "verify otp"],
    userrealm: Object.keys(user).length === 0 ? "client" : user.realm,
    fromlinkaccount: Object.keys(user).length === 0 ? true : false,
    deviceuuid: user.deviceUUID ?user.deviceUUID :'32423422342',
    sessionexpiry: moment()
      .add(global._CONFIG._VALS._TEMPSESSIONTIMEOUT, "minute")
      .toISOString(),
    publicKey: publicKey,
  };

  console.log("tempTokenMaker _attribs", _attribs);
  let signedToken = jwt.sign(
    { data: _attribs,},// utils.localEncryptPassword(JSON.stringify(_attribs)) },
    _thissecret,
    {
      ...{ expiresIn: _expiresin },
      algorithm: "HS256",
    }
  );
  // console.log("sigend token = ", signedToken);
  // handleSession(user);
  return signedToken;
}

export function verifyJwt (token: string, _refresh: boolean): any {
  const { _JWTSECRET } = global._CONFIG._VALS;
  try {
    const decoded = jwt.verify(token, _JWTSECRET)
    return decoded
  } catch (error) {
    return null
  }
};

export default { verifyPassword };
