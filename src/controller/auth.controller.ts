import { type Request, type Response } from "express";
import { EventEmitter } from "events";
import { Types } from "mongoose";

import logger from "../logger";

import jwt from "jsonwebtoken";
import axios from "axios";

import CustomErrorFunc from "../lib/custom-error";

import userDal from "../dal/user.dal";
import { type IUser } from "../config/types/user";

import accessListDal from "../dal/accesslist.dal";
import { IAccessList } from "../config/types/accesslist";
import chatInfoDal from "../dal/chatinfo.dal";

import LDAPActionDal from "../dal/ldapactions.dal";

import OTPDal from "../dal/otp.dal";
import { type IOTP } from "../config/types/otp";

import HQDal from "../dal/hq.dal";
import { type IHQ } from "../config/types/hq";

import sessionDal from "../dal/session.dal";

import { tokenMaker, tempTokenMaker } from "../lib/auth_functions";

const _valuemapping: any = {
  sms: "phoneNumber",
  email: "email",
  both: "emailAndPhone",
};

import moment from "moment";

import permissionGroupDal from "../dal/permission_group.dal";

import _CONFIG from "../config/index";

import Joi from "joi";

import utils from "../lib/utils";

import { getPublicKey } from "../lib/keyManager";
import { phoneNumberValidation } from "../config/schema/user.schema";
import axiosSendSms from "../lib/axios_sendSms";
import businessDal from "../dal/businessUpdated.dal";
const sendSMS = async (message: any, phonenumber: string) => {
  // kafkaProducer("sendSMS", {
  //   recipient: phonenumber,
  //   messageBody: message,
  // });
  await axiosSendSms(phonenumber, message);
};

const _collectionName = "auth";

export async function setUnlinkUpdateData(member: IUser): Promise<any> {
  const _linkstatusupdates = {} as any
  if(member.accountLinked) {
    _linkstatusupdates.lastMainAccount = member.mainAccount
    _linkstatusupdates.mainAccount = ''

    member.linkedAccounts.map((_account) => {
      if(_linkstatusupdates.linkedAccounts){
        _linkstatusupdates.linkedAccounts.push({
          ..._account,
          lastLinkedStatus: _account.linkedStatus,
          linkedStatus: false
        })
      } else {
        _linkstatusupdates.linkedAccounts = [{
          ..._account,
          lastLinkedStatus: _account.linkedStatus,
          linkedStatus: false
        }]
      }
    })

    _linkstatusupdates.lastAccountLinked = member.accountLinked
    _linkstatusupdates.accountLinked = false
  }

  return _linkstatusupdates
} 

async function fetchAccessList(
  userid: string
): Promise<{ info: any; statusCode: number }> {
  console.log("     ** check access list...", userid);

  try {
    const userquery = {
      user: userid,
    } as any;

    const { statusCode: accessListDalStatusCode, body: accessListDalBody } =
      await accessListDal({
        method: "get",
        query: userquery,
      });

    if (accessListDalStatusCode === 200) {
      let _accesslist = JSON.parse(
        JSON.stringify(accessListDalBody.data as IAccessList)
      );

      if (_accesslist._id) delete _accesslist._id;
      if (_accesslist.user) delete _accesslist.user;
      if (_accesslist.__v) delete _accesslist.__v;
      if (_accesslist.lastModified) delete _accesslist.lastModified;

      return {
        statusCode: 200,
        info: _accesslist,
      };
    } else if (accessListDalStatusCode === 400) {
      return {
        statusCode: 400,
        info: new CustomErrorFunc({
          name: "USER_NOT_FOUND",
          message: "access list not found!",
        }),
      };
    } else {
      return {
        statusCode: 500,
        info: {
          message: accessListDalBody.error,
        },
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      info: {
        error: "SERVER_ERROR",
        message: new CustomErrorFunc({
          name: "SERVER_ERROR",
          message: err as string,
        }),
      },
    };
  }
}

const otpAdd = async (
  adddata: any
): Promise<{ status: number; otpdata: any }> => {
  try {
    // console.log("this otp add datd: ", adddata);

    const { statusCode: otpDalStatusCode, body: otpDalBody } = await OTPDal({
      method: "create",
      data: adddata,
    });

    if (otpDalStatusCode === 201) {
      return {
        status: 201,
        otpdata: otpDalBody.data,
      };
    } else {
      return {
        status: 500,
        otpdata: {},
      };
    }
  } catch (error) {
    return { status: 400, otpdata: {} };
  }
};

export async function validatePhoneNumberLookUPData(
  payload: any
): Promise<{ info: any; statusCode: number }> {
  payload.phonenumber = utils.formatPhoneNumber(payload.phonenumber); //inputConverter.updatePhoneNumber(payload.phonenumber);

  try {
    const userquery = {
      phoneNumber: payload.phonenumber,
      realm: payload.userrealm,
    };

    console.log("this phone number lookup query [user]: ", userquery);

    const { statusCode: userDalStatusCode, body: userDalBody } = await userDal({
      method: "get",
      query: userquery,
    });

    if (userDalStatusCode === 200) {
      return {
        statusCode: 200,
        info: { data: userDalBody.data, deviceuuid: payload.deviceuuid },
      };
    } else if (userDalStatusCode === 400) {
      return {
        statusCode: 200,
        info: { data: {}, deviceuuid: payload.deviceuuid },
      };
    } else {
      return {
        statusCode: 500,
        info: {
          name: "LOGIN_ERROR",
          message: userDalBody.error,
        },
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      info: {
        message:  new CustomErrorFunc({
          name: "SERVER_ERROR",
          message: "internal error",
        }),
      },
    };
  }
}

export async function validateDeviceLookUPData(
  payload: any
): Promise<{ info: any; statusCode: number }> {
  try {
    const userquery = {
      deviceUUID: payload.deviceuuid,
      realm: payload.userrealm,
    };

    // console.log("this device lookup query [user]: ", userquery);

    const { statusCode: userDalStatusCode, body: userDalBody } = await userDal({
      method: "get",
      query: userquery,
    });

    if (userDalStatusCode === 200) {
      return {
        statusCode: 200,
        info: { data: userDalBody.data, deviceuuid: payload.deviceuuid },
      };
    } else if (userDalStatusCode === 400) {
      return {
        statusCode: 200,
        info: { data: {}, deviceuuid: payload.deviceuuid },
      };
    } else {
      return {
        statusCode: 500,
        info: {
          name: "LOGIN_ERROR",
          message: userDalBody.error,
        },
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      info: {
        message: new CustomErrorFunc({
          name: "SERVER_ERROR",
          message: "internal error",
        }),
      },
    };
  }
}

export async function returnuser(
  user: IUser & { _id: Types.ObjectId },
  token: any
): Promise<{ info: any; statusCode: number }> {
  try {
    let usertoreturn: any = {
      userid: user._id,
      usercode: user.userCode,
      fullname: user.fullName,
      phonenumber: user.phoneNumber,
      userphoto: user.avatar,
      email: user.email,
      username: user.userName,
      organizationid: user.organizationID,
      userrealm: user.realm,
      userrole: String(user.permissionGroup[0]?.groupName).toLowerCase() || "",
      registereddate: user.dateJoined,
      accesstoken: token,
      accessToken: token,
      mainaccountnumber: user.mainAccount,
      accountlinked: user.accountLinked,
      linkedaccounts: [] as string[],
      customernumber: "" as string,
      account_blocked: user.isAccountBlocked,
    };

    if (user.realm === "member") {
      if (user.linkedAccounts.length > 0) {
        usertoreturn.customernumber = user.customerNumber;
        user.linkedAccounts.map((_account) => {
          if (_account?.linkedStatus)
            usertoreturn.linkedaccounts.push(_account.accountNumber);
        });
      }
      usertoreturn.kyclevel = user?.KYCLevel;
      usertoreturn.virtualAccount = user?.virtualAccount;
      usertoreturn.ifbmember = String(user.accountBranchType) === "IFB";
      const fetchedAccesslist = await (
        await fetchAccessList(String(user._id))
      ).info;
      usertoreturn.serviceaccesslist = fetchedAccesslist.accessList; // Object.fromEntries(Object.entries(accesslist).map(([_key, _value]) => [_key.replace(/[_\s]/g, '').toLowerCase(), _value]))
      usertoreturn.primaryauth = Object.keys(_valuemapping).find(
        (key) => _valuemapping[key] === user.primaryAuthentication
      );
    }

    return {
      statusCode: 200,
      info: {
        data: usertoreturn,
      },
    };
  } catch (err:any) {
    return {
      statusCode: 500,
      info: {
        message: err.message,
      },
    };
  }
}

const fetch_merchant_info = async (orgid: string) => {
  const { statusCode, body } = await businessDal({
    method: "get",
    query: { _id: orgid, isDeleted: false },
  });

  if (statusCode == 200) {
    return { status: true, statusCode, message: "", data: body.data };
  }

  return { status: false, statusCode, message: body.error };
};

const isValidLength = async (pin: string): Promise<boolean> => {
  return pin.length === 6;
};

const maintainPINHistory = async (
  newpin: string,
  pinhistory: string[]
): Promise<string[]> => {
  if (!pinhistory.includes(newpin) && newpin !== "") pinhistory.push(newpin);

  if (pinhistory.length > 4) pinhistory.shift();

  return pinhistory;
};

const hasTooManyRedundantNumbers = async (pin: string): Promise<boolean> => {
  const _redundentlength = 4;

  const frequency: { [key: string]: number } = {};

  for (const digit of pin) {
    frequency[digit] = (frequency[digit] || 0) + 1;
  }

  return Object.values(frequency).some((count) => count > _redundentlength);
};

const hasSequentialNumbers = async (pin: string): Promise<boolean> => {
  for (let i = 0; i < pin.length - 3; i++) {
    const current = Number(pin[i]);
    if (
      Number(pin[i + 1]) === current + 1 &&
      Number(pin[i + 2]) === current + 2 &&
      Number(pin[i + 3]) === current + 3
    ) {
      return true;
    }

    // Reverse pattern check
    if (
      Number(pin[i + 1]) === current - 1 &&
      Number(pin[i + 2]) === current - 2 &&
      Number(pin[i + 3]) === current - 3
    ) {
      return true;
    }
  }

  return false;
};

const invalidateSession = async (user: IUser): Promise<boolean> => {
  console.log("   -- session invalidate: ", user.phoneNumber, user.realm);

  let _expiredsession = moment.utc().subtract("2", "hours").toISOString();

  const { statusCode: sessionStatusCode, body: sessionBody } = await sessionDal(
    {
      method: "update",
      query: { userID: user._id },
      update: {
        lastActivity: _expiredsession,
        sessionExpiry: _expiredsession,
      },
    }
  );

  // console.log('   ==-- session invalidate', sessionStatusCode, sessionBody)

  return true;
};

const validatePin = async (pin: string): Promise<boolean> => {
  if (!(await isValidLength(pin))) {
    console.log("PIN must be exactly 6 digits.");
    return false;
  }

  if (await hasTooManyRedundantNumbers(pin)) {
    console.log("PIN cannot contain more than 4 redundant numbers.");
    return false;
  }

  if (await hasSequentialNumbers(pin)) {
    console.log("PIN cannot contain 4 or more sequential numbers.");
    return false;
  }

  return true;
};

const fetchPermissionGroup = async (
  query: any
): Promise<{ status: number; groupdata: any }> => {
  try {
    // console.log("this user exists query: ", query);

    const { statusCode: pgroupDalStatusCode, body: pGroupDalBody } =
      await permissionGroupDal({
        method: "get",
        query: query,
      });

    if (pgroupDalStatusCode === 200) {
      return {
        status: 200,
        groupdata: pGroupDalBody.data,
      };
    } else {
      return {
        status: 500,
        groupdata: {},
      };
    }
  } catch (error) {
    console.log(error);
    return { status: 400, groupdata: {} };
  }
};

const userExists = async (
  query: any
): Promise<{ status: number; userdata: any }> => {
  try {
    // console.log("this user exists query: ", query);

    const { statusCode: userDalStatusCode, body: userDalBody } = await userDal({
      method: "get",
      query: query,
    });

    if (userDalStatusCode === 200) {
      return {
        status: 200,
        userdata: userDalBody.data,
      };
    } else {
      return {
        status: 500,
        userdata: {},
      };
    }
  } catch (error) {
    console.log(error);
    return { status: 400, userdata: {} };
  }
};

const updateUser = async (
  query: any,
  updatedata: any
): Promise<{ status: number; userdata: any }> => {
  // console.log('this incoming query: ', query)

  try {
    const { statusCode: userDalStatusCode, body: userDalBody } = await userDal({
      method: "update",
      query: query,
      update: updatedata,
    });

    if (userDalStatusCode === 200) {
      return {
        status: 200,
        userdata: userDalBody.data,
      };
    } else {
      return {
        status: 500,
        userdata: {},
      };
    }
  } catch (error) {
    console.log(error);
    return { status: 400, userdata: {} };
  }
};

const dropLDAPActions = async (
  query: any,
  updatedata: any
): Promise<{ status: number; userdata: any }> => {
  console.log(
    " ** drop all ldap actions: ",
    query,
    "   *** with data: ",
    updatedata
  );

  try {
    const { statusCode: LDAPActionDalStatusCode, body: LDAPActionDalBody } =
      await LDAPActionDal({
        method: "update multiple",
        query: query,
        update: updatedata,
      });

    if (LDAPActionDalStatusCode === 200) {
      return {
        status: 200,
        userdata: LDAPActionDalBody.data,
      };
    } else {
      return {
        status: 500,
        userdata: {},
      };
    }
  } catch (error) {
    return { status: 400, userdata: {} };
  }
};

const dropOTPs = async (
  phonenumber: string,
  realm: string
): Promise<{ status: number; otpdata: any }> => {
  console.log(" ** drop all otps: ", phonenumber, realm);

  try {
    const { statusCode: OTPDalStatusCode, body: OTPDalBody } = await OTPDal({
      method: "delete",
      query: {
        phoneNumber: phonenumber,
        userRealm: realm,
      },
    });

    if (OTPDalStatusCode === 200) {
      return {
        status: 200,
        otpdata: OTPDalBody.data,
      };
    } else {
      return {
        status: 500,
        otpdata: {},
      };
    }
  } catch (error) {
    return { status: 400, otpdata: {} };
  }
};

export const unlinkDevice = async (
  member: IUser,
  installationdate: number
): Promise<{ status: number; unlinkdata: any }> => {
  console.log(" ** unlink device...");
  console.log("   *** installation date ", installationdate);

  try {
    const _linkstatusupdates = await setUnlinkUpdateData(member)

    const userquery = {
      _id: member._id,
    };

    let updatedata = {
      $set: {
        loginPIN: "",
        deviceUUID: "",
        deviceStatus: "UNLINKED",
        // PINHistory: []
        PINHistory: await maintainPINHistory(
          String(member.loginPIN),
          member.PINHistory
        ),
        OTPVerifyCount: 0,
      },
      lastModified: moment.utc().toISOString(),
    } as any;

    if(Object.keys(_linkstatusupdates).length > 0) Object.assign(updatedata.$set, _linkstatusupdates)

    if (installationdate > 0)
      updatedata.$set["APPInstallationDate"] = new Date(installationdate);

    const unsubscribeduser = await updateUser(userquery, updatedata);
    const dropallldapactions = await dropLDAPActions(
      { user: member._id, status: "PENDING" },
      { $set: { status: "REJECTED" } }
    );
    const dropallotps = await dropOTPs(member.phoneNumber, member.realm);

    console.log("user update result: ", unsubscribeduser.status);
    console.log("drop all ldap result: ", dropallldapactions.status);
    console.log("drop otp result: ", dropallotps.status);

    if (unsubscribeduser.status === 200) {
      return {
        status: 200,
        unlinkdata: {
          unsubscribestatus: unsubscribeduser.status,
          dropldapactionstatus: dropallldapactions.status,
          dropotpstatus: dropallotps.status,
        },
      };
    } else
      return {
        status: 400,
        unlinkdata: {
          unsubscribestatus: unsubscribeduser.status,
          dropldapactionstatus: dropallldapactions.status,
          dropotpstatus: dropallotps.status,
        },
      };
  } catch (error) {
    return {
      status: 400,
      unlinkdata: {},
    };
  }
};

const createUser = async (
  adddata: any
): Promise<{ status: number; userdata: any }> => {
  try {
    const { statusCode: userDalStatusCode, body: userDalBody } = await userDal({
      method: "create",
      data: adddata,
    });

    if (userDalStatusCode === 201) {
      return {
        status: 201,
        userdata: userDalBody.data,
      };
    } else {
      return {
        status: 500,
        userdata: {},
      };
    }
  } catch (error) {
    console.log(error);
    return { status: 400, userdata: {} };
  }
};

const otpExists = async (
  query: any
): Promise<{ status: number; otpdata: any }> => {
  try {
    console.log("this otp exists query: ", query);

    const { statusCode: otpDalStatusCode, body: otpDalBody } = await OTPDal({
      method: "get",
      query: query,
    });

    if (otpDalStatusCode === 200) {
      return {
        status: 200,
        otpdata: otpDalBody.data,
      };
    } else {
      return {
        status: 500,
        otpdata: {},
      };
    }
  } catch (error) {
    console.log(error);
    return { status: 400, otpdata: {} };
  }
};

const otpRemove = async (
  query: any
): Promise<{ status: number; otpdata: any }> => {
  try {
    const { statusCode: otpDalStatusCode, body: otpDalBody } = await OTPDal({
      method: "delete",
      query: query,
    });

    if (otpDalStatusCode === 200) {
      return {
        status: 200,
        otpdata: otpDalBody.data,
      };
    } else {
      return {
        status: 500,
        otpdata: {},
      };
    }
  } catch (error) {
    return { status: 400, otpdata: {} };
  }
};

async function toProperTime(_secs: number): Promise<{ message: string }> {
  let timeMessage = `${_secs} seconds`;
  // if (_secs >= 60) {
  //   const minutes = Math.floor(_secs / 60);
  //   timeMessage = `${minutes} minutes`;
  // } else timeMessage = `${_secs} seconds`

  console.log("=-=-=-=-==", timeMessage);
  return { message: timeMessage };
}

export async function incorrectTriesHandler(
  user: IUser,
  res: Response
): Promise<Response> {
  let __now = moment.utc();

  const _maxtries = 6;
  const _1stlevel_wait = 1; //15
  const _2ndlevel_wait = 2; //30

  const _nexttry = moment
    .utc(user.nextLoginAttempt)
    .diff(moment.utc(__now), "s");

  const _loginattemptcount = user.loginAttemptCount as number;
  const _attemptupdatecount = (_loginattemptcount as number) + 1;

  const triesLeft = _maxtries - _attemptupdatecount;

  let _lockaccount = false;

  let _errmsg = `incorrect PIN. ${triesLeft} tries left.`;

  const _wrongtrieschanges_ = async (
    _attemptcount: number,
    userid: string,
    nexttryrin: number
  ): Promise<any> => {
    const userquery = {
      _id: userid,
    };

    let _date =
      nexttryrin > 0
        ? moment.utc(__now).add(nexttryrin, "minutes").toISOString()
        : moment.utc(__now).toISOString();

    let updatedata = {
      loginAttemptCount: _attemptcount,
      lastLoginAttempt: moment.utc(__now).toISOString(),
      nextLoginAttempt: _date,
      enabled: !_lockaccount,
    };
    // console.log('     ',_attemptcount, nexttryrin, _date)

    const _userresp = await updateUser(userquery, updatedata);
    console.log("user wrong tries count update: ", _userresp.status);

    if (_attemptcount === 3 || _attemptcount === 5)
      _errmsg = `too many wrong login attempts. try again in ${
        (await toProperTime(_nexttry)).message
      }`;

    logger.logAXIOS(
      `Response sent [authentication service]: ${JSON.stringify({
        deviceid: user.deviceUUID,
        user: `${user.fullName} - ${user.phoneNumber}`,
        message: `wrong login attempts: ${_attemptcount}`,
      })}`,
      "error"
    );
    logger.error(
      `Response sent [authentication service]: ${JSON.stringify({
        deviceid: user.deviceUUID,
        user: `${user.fullName} - ${user.phoneNumber}`,
        message: `wrong login attempts: ${_attemptcount}`,
      })}`
    );

    return updatedata;
  };

  const _lockaccount_ = async (userid: string) => {
    _errmsg =
      "maximum tries exhausted: account locked. please visit your neareset branch to activate your account";
    const _userresp = await updateUser(
      { _id: userid },
      { enabled: false, lastModified: moment.utc(__now).toISOString() }
    );
  };

  // console.log(_attemptupdatecount, _loginattemptcount,  _loginattemptcount >= 3 ? _loginattemptcount === 3 ? _1stlevel_wait : _2ndlevel_wait : 0)
  if (_loginattemptcount > _maxtries) {
    logger.logAXIOS(
      `Response sent [authentication service]: ${JSON.stringify({
        deviceid: user.deviceUUID,
        user: `${user.fullName} - ${user.phoneNumber}`,
        wrongattemptscount: _loginattemptcount,
        message: "max wrong login attempts: account locked",
      })}`,
      "error"
    );
    logger.error(
      `Response sent [authentication service]: ${JSON.stringify({
        deviceid: user.deviceUUID,
        user: `${user.fullName} - ${user.phoneNumber}`,
        wrongattemptscount: _loginattemptcount,
        message: "max wrong login attempts: account locked",
      })}`
    );
    // if (user.realm === "merchant") {
    //   return res.status(400).json({
    //     message: "Your account is locked. Please use forget pin.",
    //   });
    // } else {
    //   _lockaccount_(String(user._id));
    // }
    _lockaccount_(String(user._id));
  } else if (_attemptupdatecount >= 3) {
    // console.log('   ',moment.utc(__now).isAfter(user.nextLoginAttempt), _nexttry, _loginattemptcount === 3 ? _1stlevel_wait : _2ndlevel_wait)
    if (
      moment.utc(__now).isAfter(user.nextLoginAttempt) ||
      _attemptupdatecount === 3 ||
      _attemptupdatecount === 5
    ) {
      console.log("     * level 1 incorrect PIN caught");
      const _updatedata = await _wrongtrieschanges_(
        _attemptupdatecount,
        String(user._id),
        _attemptupdatecount === 3 ? _1stlevel_wait : _2ndlevel_wait
      );
      const _diff = moment
        .utc(_updatedata.nextLoginAttempt)
        .diff(moment.utc(__now), "s");

      if (_updatedata.loginAttemptCount >= _maxtries) {
        logger.logAXIOS(
          `Response sent [authentication service]: ${JSON.stringify({
            deviceid: user.deviceUUID,
            user: `${user.fullName} - ${user.phoneNumber}`,
            message: "max wrong login attempts: account locked",
          })}`,
          "error"
        );
        logger.error(
          `Response sent [authentication service]: ${JSON.stringify({
            deviceid: user.deviceUUID,
            user: `${user.fullName} - ${user.phoneNumber}`,
            message: "max wrong login attempts: account locked",
          })}`
        );
        _lockaccount_(String(user._id));
        // if (user.realm === "merchant") {
        //   return res.status(400).json({
        //     message: "Your account is locked. Please use forget pin.",
        //   });
        // } else {
        //   _lockaccount_(String(user._id));
        // }
      } else {
        if (_loginattemptcount !== 3 && _loginattemptcount !== 5) {
          logger.logAXIOS(
            `Response sent [authentication service]: ${JSON.stringify({
              deviceid: user.deviceUUID,
              user: `${user.fullName} - ${user.phoneNumber}`,
              message: `wrong login attempts: try again in ${
                (await toProperTime(_diff)).message
              }`,
            })}`,
            "error"
          );
          logger.error(
            `Response sent [authentication service]: ${JSON.stringify({
              deviceid: user.deviceUUID,
              user: `${user.fullName} - ${user.phoneNumber}`,
              message: `wrong login attempts: try again in ${
                (await toProperTime(_diff)).message
              }`,
            })}`
          );
          _errmsg = `too many wrong login attempts. try again in ${
            (await toProperTime(_diff)).message
          }`;
        }
      }
    } else {
      console.log("     ** level 2 incorrect PIN caught");
      logger.logAXIOS(
        `Response sent [authentication service]: ${JSON.stringify({
          deviceid: user.deviceUUID,
          user: `${user.fullName} - ${user.phoneNumber}`,
          message: `wrong login attempts: try again in ${
            (await toProperTime(_nexttry)).message
          }`,
        })}`,
        "error"
      );
      logger.error(
        `Response sent [authentication service]: ${JSON.stringify({
          deviceid: user.deviceUUID,
          user: `${user.fullName} - ${user.phoneNumber}`,
          message: `wrong login attempts: try again in ${
            (await toProperTime(_nexttry)).message
          }`,
        })}`
      );
      _errmsg = `too many wrong login attempts. try again in ${
        (await toProperTime(_nexttry)).message
      }`;
    }
  } else {
    console.log("     *** level 3 incorrect PIN caught");
    await _wrongtrieschanges_(
      _attemptupdatecount,
      String(user._id),
      _loginattemptcount >= 2
        ? _loginattemptcount === 2
          ? _1stlevel_wait
          : _2ndlevel_wait
        : 0
    );
  }

  return await new Promise(async (resolve) => {
    resolve(
      res.status(400).json({
        status: false,
        message: _errmsg,
      })
    );
  });
}

const accountLookUP = async (
  user: IUser | {},
  accountnumber: string
): Promise<any> => {
  console.log(`${global._CONFIG._VALS.BANK_URL}/accountenquiry`);

  const data = {
    _user: {
      permissions: ["check account"],
      userCode: "000000",
      fullName: "API User",
      phoneNumber: "+251000000000",
      userrealm: "system",
      email: "api@user.com",
    },
  };

  const _accestoken = jwt.sign(data, global._CONFIG._VALS._JWTSECRET);
  return await axios.post(
    `${global._CONFIG._VALS.BANK_URL}/accountenquiry`,
    {
      account_number: accountnumber,
    },
    {
      headers: {
        Authorization: `Bearer ${_accestoken}`,
      },
    }
  );
};

// export function healthCheck(req: Request, res: Response): void {
//    res.status(200).json({
//     status: 200,
//     message: "Auth service is active",
//   });
// }

export function healthCheck(req: Request, res: Response): void {
  res.status(200).json({
    status: 200,
    message: "Auth service is active",
  });
}

export function login(req: Request, res: Response): void {
  res.status(200).json({
    status: 200,
    message: "Hello Welcome to Addis Fix Login Route",
  });

  // app.get('/login', (req: Request, res: Response) => {
//     res.send('Hello Welcome to Addis Fix Route')
//   });
}

export async function deviceLookUP(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("DEVICE LOOKUP...");

  const _platform: String | undefined = req.headers.platform as String;
  const _appversion: String | undefined = req.headers.appversion as String;
  const _deviceuuid: String | undefined = req.headers.deviceuuid as String;
  const _sourceapp: String | undefined = req.headers.sourceapp as String;
  const _installationdate: String | undefined = req.headers
    .installationdate as String;
  const serverPublicKey = await getPublicKey();
  const isnewDevice = req.get("x-csg-cvd") === "yes";
  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
    agentapp: ["merchant"],
  };

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    let returndata = {
      status: false,
      user: {
        fullname: "",
        phonenumber: "",
        userphoto: "",
        devicestatus: "",
        accountlinkstatus: "",
        acountactivestatus: "",
        changepin: false,
      },
      isLatest: false,
    };

    // console.log("returnData", returndata);

    workflow.on("fetchHQ", () => {
      const elstquery: any = {};

      void (async () => {
        const { body, statusCode } = await HQDal({
          method: "get",
          query: elstquery,
        });
        // console.log("HQDAL", body, statusCode);
        if (statusCode === 200) {
          const _hqdata = body.data as IHQ;

          returndata.isLatest =
            _platform === "android"
              ? Number(_appversion) > Number(_hqdata.latestAndroidVersion)
              : Number(_appversion) > Number(_hqdata.latestiOSVersion);

          workflow.emit("fetchuser");
        } else {
          resolve(
            res.status(statusCode).json({ message: "please try again later" })
          );
        }
      })();
    });

    workflow.on("fetchuser", () => {
      let lookupdata = {
        deviceuuid: _deviceuuid,
        userrealm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
      };

      validateDeviceLookUPData(lookupdata)
        .then(async ({ info, statusCode }) => {
          if (statusCode === 200) {
            if (Object.keys(info.data).length > 0) {
              // console.log('length < 6:', utils.localDecryptPassword(info.data.loginPIN).length < 6, ' pwd changed days: ', moment().diff(info.data.passwordChangedAt, 'days'))

              returndata.status = true;
              returndata.user.fullname = info.data.fullName;
              returndata.user.phonenumber = info.data.phoneNumber;
              returndata.user.userphoto = info.data.avatar;
              returndata.user.accountlinkstatus = info.data.linkedAccounts.some(
                (_account: any) => _account.linkedStatus as boolean
              );
              (returndata.user.acountactivestatus =
                info.data.enabled && info.data.isDeleted),
                (returndata.user.changepin =
                  moment().diff(info.data.passwordChangedAt, "days") >=
                  global._CONFIG._VALS.PINEXPIRYDATE
                    ? true
                    : false);

              // check for app installation date
              // console.log('-=-=-=-=-=-',info.data?.APPInstallationDate && new Date(info.data.APPInstallationDate).getTime() !==  Number(_installationdate))
              if (
                info.data?.APPInstallationDate &&
                new Date(info.data.APPInstallationDate).getTime() !==
                  Number(_installationdate)
              ) {
                console.log("    *** new installation date: unlink device");
                returndata.status = false;
                const unlinkdevice = await unlinkDevice(
                  info.data,
                  Number(_installationdate)
                );
                if (
                  unlinkdevice.status === 200 &&
                  unlinkdevice.unlinkdata.unsubscribestatus === 200
                ) {
                  console.log(
                    "unlink statuses: ",
                    unlinkdevice.status,
                    unlinkdevice.unlinkdata
                  );
                  returndata.user.devicestatus = "UNLINKED";
                }
              } else {
                returndata.user.devicestatus = info.data.deviceStatus;

                if (
                  !info.data?.APPInstallationDate ||
                  new Date(info.data.APPInstallationDate).getTime() !==
                    Number(_installationdate)
                ) {
                  returndata.status = false;
                  const _query = {
                    _id: info.data._id,
                  };

                  const _updatedata = {
                    $set: {
                      APPInstallationDate: new Date(Number(_installationdate)),
                    },
                    lastModified: new Date(),
                  };

                  updateUser(_query, _updatedata);
                }
              }
            }
          }
          logger.logAXIOS(
            `Response sent [authentication service]: ${JSON.stringify({
              returndata,
            })}`,
            "info"
          );
          resolve(
            res.json({
              ...returndata,
              [isnewDevice ? "rf" : "publicKey"]: serverPublicKey,
            })
          );
        })
        .catch((err) => {
          console.log(err);
          resolve(res.status(500).json(err));
        });
    });

    if (
      _installationdate === undefined ||
      _installationdate === "" ||
      isNaN(Number(_installationdate))
    )
      resolve(
        res
          .status(401)
          .json({ message: "untrusted installation: forbidden access" })
      );
    else workflow.emit("fetchHQ");
  });
}

export async function phoneNumberLookUP(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("PHONE NUMBER LOOKUP...");

  const _deviceuuid: String | undefined = req.headers.deviceuuid as String;
  const _sourceapp: String | undefined = req.headers.sourceapp as String;

  // let _phonenumber: String | undefined = req.headers.phonenumber as String;
  let _phonenumber: String | undefined = req.path.includes("_v2")
    ? (req.body.phonenumber as string)
    : (req.headers.phonenumber as String);

  const _fromlink: Boolean | undefined = req.headers
    .fromlinkaccount as unknown as boolean;
  console.log("====", _fromlink);
  const serverPublicKey = await getPublicKey();
  const isnewDevice = req.get("x-csg-cvd") === "yes";

  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
    agentapp: ["merchant"],
  };

  return await new Promise(async (resolve) => {
    const workflow = new EventEmitter();

    _phonenumber = utils.formatPhoneNumber(_phonenumber as string);

    let returndata = {
      status: false,
      pinset: false,
      activeotp: false,
      firstpinset: false,
      waitotp: "",
      user: {
        fullname: "",
        phonenumber: "",
        userphoto: "",
        devicestatus: "",
      },
      accesstoken: "",
    };

    let lookupdata = {
      phonenumber: _phonenumber,
      userrealm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
    };
    /**
     * pinset check otp
     */
    const activeotp = await otpExists({
      phoneNumber: _phonenumber,
      otpFor: "pinset",
    });

    validatePhoneNumberLookUPData(lookupdata)
      .then(({ info, statusCode }) => {
        if (statusCode === 200) {
          if (Object.keys(info.data).length > 0) {
            returndata.status = true;
            returndata.user.fullname = info.data.fullName;
            returndata.user.phonenumber = info.data.phoneNumber;
            returndata.user.userphoto = info.data.avatar;
            returndata.user.devicestatus = info.data.deviceStatus;

            returndata.firstpinset =
              info.data.firstPINSet !== undefined
                ? !info.data.firstPINSet
                : true;
            returndata.activeotp =
              activeotp.status === 200 &&
              moment().isBefore(activeotp.otpdata.expiresAt) &&
              activeotp.otpdata.status === "REQUESTED"
                ? true
                : false;
            returndata.waitotp = returndata.activeotp
              ? String(moment(activeotp.otpdata.expiresAt).diff(moment(), "m"))
              : "";
            if (info.data.loginPIN && info.data.loginPIN !== "")
              returndata.pinset = true;
          }
        }

        if (_fromlink)
          returndata.accesstoken = tempTokenMaker(
            info.data,
            ["query account number"],
            serverPublicKey
          );
        resolve(
          res.json({
            ...returndata,
            [isnewDevice ? "rf" : "publicKey"]: serverPublicKey,
          })
        );
      })
      .catch((err) => {
        resolve(res.status(500).json(err));
      });
  });
}

export async function memberSelfSignupV2(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("MEMBER SELF-REGISTER V2...");

  const _payload = req.body;

  const allowedsources = ["memberapp"];

  const _deviceuuid: string | undefined = req.headers.deviceuuid as string;

  const _sourceapp = req.headers.sourceapp || "";

  let _LINKED = false;

  const workflow = new EventEmitter();
  const serverPublicKey = await getPublicKey();

  return await new Promise((resolve) => {
    workflow.on("validatepayload", () => {
      const schema = Joi.object({
        phonenumber: phoneNumberValidation,
        fullname: Joi.string().required(),
        gender: Joi.string().valid("male", "female").required(),
        dob: Joi.date().required(),
        city: Joi.string().required(),
        email: Joi.string().email().allow("", null),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      workflow.emit("memberexists");
    });

    workflow.on("accountlookup", async () => {
      try {
        // let userquery = {
        //   realm: 'elst',
        //   enabled: true
        // }

        // let _userresp = await userExists(userquery)
        // if (_userresp.status !== 200) {
        //   resolve(
        //     res.status(400).json({ status: 400, message: "something went wrong: plesae try again later" })
        //   );
        // } else {
        const _account = await accountLookUP({}, _payload.accountnumber);
        console.log("___----___ACCOUNT", _account);
        if (_account) workflow.emit("memberexists", _account.data.data);
        else
          resolve(
            res.status(400).json({ status: 400, message: "account not found" })
          );
        // }
      } catch (error) {
        logger.logAXIOS(
          `Request sent [authentication service]: ${
            "account does not exists"
          }`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: ${
            // error?.response.data.message || "account does not exists"
              "account does not exists"
          }`
        );
        resolve(
          res.status(500).json({
            status: 500,
            message: "account does not exists"
          })
        );
      }
    });

    workflow.on("memberexists", async () => {
      let memberquery = {
        $or: [
          { phoneNumber: utils.formatPhoneNumber(_payload.phonenumber) },
          { deviceUUID: _deviceuuid },
          // { customerNumber: _account.customer_number },
        ],
        realm: "member",
        poolSource: "app",
      } as any;

      if (
        _payload.accountnumber !== undefined &&
        _payload.accountnumber !== ""
      ) {
        _LINKED = true;
        // memberquery.$or.push({ mainAccount: _payload.accountnumber})
        memberquery.$or.push({
          $and: [
            { mainAccount: _payload.accountnumber },
            { "linkedAccount.accountNumber": _payload.accountnumber },
            {
              $or: [
                { "linkedAccount.andOrStatus": false },
                { "linkedAccount.andOrStatus": { $exists: false } },
              ],
            },
          ],
        });
        // memberquery.$or.push({ 'linkedAccount.accountNumber': _payload.accountnumber})
      }

      let _memberresp = await userExists(memberquery);
      if (_memberresp.status === 200) {
        logger.logAXIOS(
          `Request sent [authentication service]: member already exists: please use a different phone number or device`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: member already exists: please use a different phone number or device`
        );
        resolve(
          res.status(400).json({
            status: 400,
            message:
              "member already exists: please use a different phone number or device",
          })
        );
      } else workflow.emit("prepareData");
    });

    workflow.on("prepareData", async (_account: any) => {
      let memberAddData: any = {
        userCode: String(performance.now()).split(".").join(""),
        fullName: _payload.fullname,
        gender: _payload.gender,
        city: _payload.city,
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        avatar: "",
        // birthDate: moment(_payload.dob).toISOString(),
        email:
          _payload.email !== undefined && _payload.email !== null
            ? String(_payload.email).toLowerCase()
            : "",
        userName: "",
        userBio: "",
        realm: "member",
        poolSource: "app",
        permissions: [],
        linkedAccounts: [],
        mainAccount: "",
        dateJoined: moment.utc().toISOString(),
        lastModified: new Date(),
        deviceUUID: _deviceuuid,
        deviceStatus: "UNLINKED",
        accountType: _LINKED ? "LINKED" : "NEW",
        // branchCode: _account.account_branchcode,
        primaryAuthentication: "phoneNumber",
      };

      // if (_payload.accountnumber && _payload.accountnumber !== "")
      //   memberAddData.linkedAccounts.push({
      //     accountNumber: _payload.accountnumber,
      //     linkedStatus: false,
      //     CBSAccountData: _account,
      //   });

      try {
        const _pgroupresp = await fetchPermissionGroup({ groupName: "member" });
        if (_pgroupresp.status === 200)
          console.log(
            "fethced permission for ",
            _pgroupresp.groupdata.groupName,
            String(_pgroupresp.groupdata._id)
          );
        else
          console.log(
            "error on permission group fetch. registering with [] permissions..."
          );

        memberAddData = {
          ...memberAddData,
          permissionGroup: _pgroupresp.groupdata._id,
        };

        console.log("THIS REGISTER DATA: ", memberAddData);
        workflow.emit("registerMember", memberAddData);
      } catch (err:any) {
        console.log(
          "     **** error on permission group fetch (catch): ",
          err.message,
          ". registering with [] permissions..."
        );
        workflow.emit("registerMember", memberAddData);
      }
    });

    workflow.on("registerMember", async (userAddData: any) => {
      let _memberresp = await createUser(userAddData);
      if (_memberresp.status === 201) {
        let member = _memberresp.userdata as IUser;

        const _welcomemsg = `Dear ${String(
          member.fullName
        ).toLowerCase()}, welcome to Dashen SuperAPP.

Your User ID is: ${member.userCode}. Thank you for choosing SuperAPP.

Dashen Bank – always one step ahead.`;

        sendSMS(_welcomemsg, member.phoneNumber);

        workflow.emit("addchatinfo", member);
      } else {
        logger.logAXIOS(
          `Request sent [authentication service]: member registration failed`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: member registration failed`
        );
        resolve(
          res
            .status(400)
            .json({ status: 400, message: "please try again later" })
        );
      }
    });

    workflow.on("addchatinfo", async (_member: IUser) => {
      const chatinfodata = {
        memberID: _member._id,
        userCode: _member.userCode,
        phoneNumber: _member.phoneNumber,
        blockedMembers: [],
        membersChatting: [],
        blockedByMembers: [],
        invitedNumbers: [],
        createdAt: new Date(),
        lastModified: new Date(),
      };

      void (async () => {
        const { body, statusCode } = await chatInfoDal({
          method: "create",
          data: chatinfodata,
        });

        if (statusCode === 201) {
          console.log("successfully added new chatinfo data");
        } else {
          console.log("failed to create new chatinfo data");
        }

        workflow.emit("respond", _member);
      })();
    });

    workflow.on(
      "respond",
      (user: IUser & { _id: Types.ObjectId }, _token: string) => {
        let _accesstoken = tempTokenMaker(
          user,
          ["set pin", "reset pin", "change pin"],
          serverPublicKey
        );

        returnuser(user, _accesstoken)
          .then(({ info, statusCode }) => {
            if (statusCode === 200) {
              logger.logAXIOS(
                `Request sent [authentication service]: ${JSON.stringify(
                  info.data
                )}`,
                "info"
              );
              logger.info(
                `Request sent [authentication service]: ${JSON.stringify(
                  info.data
                )}`
              );

              resolve(res.status(200).json(info.data));
            } else {
              logger.logAXIOS(
                `Request sent [authentication service]: ${JSON.stringify(
                  info
                )}`,
                "error"
              );
              logger.error(
                `Request sent [authentication service]: ${JSON.stringify(info)}`
              );
              resolve(res.status(400).json(info));
            }
          })
          .catch((err) => {
            resolve(res.status(500).json(err));
          });
      }
    );

    workflow.emit("validatepayload");
  });
}
export async function memberSelfSignup(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("MEMBER SELF-REGISTER...");

  const _payload = req.body;
  const _fromvirtual = req.path.includes("virtual");

  const allowedsources = ["memberapp"];

  const _deviceuuid: string | undefined = req.headers.deviceuuid as string;

  const _sourceapp = req.headers.sourceapp || "";

  let _LINKED = false;

  const workflow = new EventEmitter();
  const serverPublicKey = await getPublicKey();

  return await new Promise((resolve) => {
    workflow.on("validatepayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string().required(),
        accountnumber: Joi.string().optional().allow(""),
        fullname: Joi.string().optional().allow(""),
        // fullname: Joi.string().required(),
        // gender: Joi.string().valid('male', 'female').required(),
        // dob: Joi.date().required(),
        // city: Joi.string().required(),
        // email: Joi.string().email().allow('', null)
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      if (!_fromvirtual) workflow.emit("accountlookup");
      else workflow.emit("memberexists", null);
    });

    workflow.on("accountlookup", async () => {
      try {
        // let userquery = {
        //   realm: 'elst',
        //   enabled: true
        // }

        // let _userresp = await userExists(userquery)
        // if (_userresp.status !== 200) {
        //   resolve(
        //     res.status(400).json({ status: 400, message: "something went wrong: plesae try again later" })
        //   );
        // } else {
        const _account = await accountLookUP({}, _payload.accountnumber);
        if (_account) workflow.emit("memberexists", _account.data.data);
        else
          resolve(
            res.status(400).json({ status: 400, message: "account not found" })
          );
        // }
      } catch (error) {
        logger.logAXIOS(
          `Request sent [authentication service]: ${
            "account does not exists"
          }`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: ${
             "account does not exists"
          }`
        );
        resolve(
          res.status(500).json({
            status: 500,
            message: "account does not exists"
          })
        );
      }
    });

    workflow.on("memberexists", async (_account: any) => {
      let memberquery = {
        $or: [
          { phoneNumber: utils.formatPhoneNumber(_payload.phonenumber) },
          { deviceUUID: _deviceuuid },
          // { customerNumber: _account.customer_number },
        ],
        realm: "member",
        poolSource: "app",
      } as any;

      if (!_fromvirtual)
        memberquery.$or.push({ customerNumber: _account.customer_number });
      if (
        _payload.accountnumber !== undefined &&
        _payload.accountnumber !== ""
      ) {
        _LINKED = true;
        // memberquery.$or.push({ mainAccount: _payload.accountnumber})
        memberquery.$or.push({
          $and: [
            { mainAccount: _payload.accountnumber },
            { "linkedAccount.accountNumber": _payload.accountnumber },
            {
              $or: [
                { "linkedAccount.andOrStatus": false },
                { "linkedAccount.andOrStatus": { $exists: false } },
              ],
            },
          ],
        });
        // memberquery.$or.push({ 'linkedAccount.accountNumber': _payload.accountnumber})
      }

      let _memberresp = await userExists(memberquery);
      if (_memberresp.status === 200) {
        logger.logAXIOS(
          `Request sent [authentication service]: member already exists: please use a different phone number or device`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: member already exists: please use a different phone number or device`
        );
        resolve(
          res.status(400).json({
            status: 400,
            message:
              "member already exists: please use a different phone number or device",
          })
        );
      } else workflow.emit("prepareData", _account);
    });

    workflow.on("prepareData", async (_account: any) => {
      let memberAddData: any = {
        userCode: String(performance.now()).split(".").join(""),
        fullName: !_fromvirtual ? _account.customer_name : _payload.fullname,
        // gender: _payload.gender,
        // city: _payload.city,
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        avatar: "",
        // birthDate: moment(_payload.dob).toISOString(),
        email:
          _payload.email !== undefined && _payload.email !== null
            ? String(_payload.email).toLowerCase()
            : "",
        userName: "",
        userBio: "",
        realm: "member",
        poolSource: "app",
        permissions: [],
        linkedAccounts: [],
        mainAccount: "",
        dateJoined: moment.utc().toISOString(),
        lastModified: new Date(),
        deviceStatus: "UNLINKED",
        accountType: _LINKED ? "LINKED" : "NEW",
        branchCode: !_fromvirtual ? _account.account_branchcode : "",
        primaryAuthentication: "phoneNumber",
      };

      if (_fromvirtual) {
        memberAddData.KYCLevel = "0";
        memberAddData.virtualAccount = true;
        memberAddData.accountType = "NEW";
      }

      if (_payload.accountnumber && _payload.accountnumber !== "")
        memberAddData.linkedAccounts.push({
          accountNumber: _payload.accountnumber,
          linkedStatus: false,
          CBSAccountData: _account,
        });

      try {
        const _pgroupresp = await fetchPermissionGroup({ groupName: "member" });
        if (_pgroupresp.status === 200)
          console.log(
            "fethced permission for ",
            _pgroupresp.groupdata.groupName,
            String(_pgroupresp.groupdata._id)
          );
        else
          console.log(
            "error on permission group fetch. registering with [] permissions..."
          );

        memberAddData = {
          ...memberAddData,
          permissionGroup: _pgroupresp.groupdata._id,
        };

        console.log("THIS REGISTER DATA: ", memberAddData);
        workflow.emit("registerMember", memberAddData);
      } catch (err:any) {
        console.log(
          "     **** error on permission group fetch (catch): ",
          err.message,
          ". registering with [] permissions..."
        );
        workflow.emit("registerMember", memberAddData);
      }
    });

    workflow.on("registerMember", async (userAddData: any) => {
      let _memberresp = await createUser(userAddData);
      if (_memberresp.status === 201) {
        let member = _memberresp.userdata as IUser;

        const _welcomemsg = `Dear ${String(
          member.fullName
        ).toLowerCase()}, welcome to Dashen SuperAPP.

Your User ID is: ${member.userCode}. Thank you for choosing SuperAPP.

Dashen Bank – always one step ahead.`;

        sendSMS(_welcomemsg, member.phoneNumber);

        workflow.emit("addchatinfo", member);
      } else {
        logger.logAXIOS(
          `Request sent [authentication service]: member registration failed`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: member registration failed`
        );
        resolve(
          res
            .status(400)
            .json({ status: 400, message: "please try again later" })
        );
      }
    });

    workflow.on("addchatinfo", async (_member: IUser) => {
      const chatinfodata = {
        memberID: _member._id,
        userCode: _member.userCode,
        phoneNumber: _member.phoneNumber,
        blockedMembers: [],
        membersChatting: [],
        blockedByMembers: [],
        invitedNumbers: [],
        createdAt: new Date(),
        lastModified: new Date(),
      };

      void (async () => {
        const { body, statusCode } = await chatInfoDal({
          method: "create",
          data: chatinfodata,
        });

        if (statusCode === 201) {
          console.log("successfully added new chatinfo data");
        } else {
          console.log("failed to create new chatinfo data");
        }

        workflow.emit("respond", _member);
      })();
    });

    workflow.on(
      "respond",
      (user: IUser & { _id: Types.ObjectId }, _token: string) => {
        let _accesstoken = tempTokenMaker(
          user,
          ["set pin", "reset pin", "change pin"],
          serverPublicKey
        );

        returnuser(user, _accesstoken)
          .then(({ info, statusCode }) => {
            if (statusCode === 200) {
              logger.logAXIOS(
                `Request sent [authentication service]: ${JSON.stringify(
                  info.data
                )}`,
                "info"
              );
              logger.info(
                `Request sent [authentication service]: ${JSON.stringify(
                  info.data
                )}`
              );

              resolve(res.status(200).json(info.data));
            } else {
              logger.logAXIOS(
                `Request sent [authentication service]: ${JSON.stringify(
                  info
                )}`,
                "error"
              );
              logger.error(
                `Request sent [authentication service]: ${JSON.stringify(info)}`
              );
              resolve(res.status(400).json(info));
            }
          })
          .catch((err) => {
            resolve(res.status(500).json(err));
          });
      }
    );

    workflow.emit("validatepayload");
  });
}

export async function userRegister(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("DASHBOARD USERREGISTER...");

  const _payload = req.body;

  const user = (req as any)._user;

  const allowedsources = ["dashportal"];

  const _sourceapp = req.headers.sourceapp || "";

  const workflow = new EventEmitter();

  return await new Promise((resolve) => {
    workflow.on("validatepayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string().required(),
        fullname: Joi.string().required(),
        email: Joi.string().email().allow("", null),
        role: Joi.string().required(),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      workflow.emit("userexists");
    });

    workflow.on("userexists", async () => {
      let userquery = {
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        realm: { $in: ["elst", "bank"] },
        poolSource: "portal",
        isDeleted: false,
      };

      let _userresp = await userExists(userquery);
      if (_userresp.status === 200) {
        logger.logAXIOS(
          `Request sent [authentication service]: user already exists`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: user already exists`
        );
        resolve(
          res.status(400).json({
            status: 400,
            message: "user already exists: please use a different phone number",
          })
        );
      } else workflow.emit("prepareData");
    });

    workflow.on("prepareData", async () => {
      let userAddData: any = {
        userCode: String(performance.now()).split(".").join(""),
        fullName: _payload.fullname,
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        avatar: "",
        email:
          _payload.email !== undefined && _payload.email !== null
            ? String(_payload.email).toLowerCase()
            : "",
        realm: "",
        organizationID: user.organizationID,
        poolSource: "portal",
        permissions: [],
        dateJoined: moment.utc().toISOString(),
        lastModified: new Date(),
      };

      try {
        const _pgroupresp = await fetchPermissionGroup({ _id: _payload.role });
        if (_pgroupresp.status === 200) {
          console.log(
            "fethced permission for ",
            _pgroupresp.groupdata.groupName,
            String(_pgroupresp.groupdata._id)
          );
          userAddData = {
            ...userAddData,
            permissionGroup: _pgroupresp.groupdata._id,
            realm: _pgroupresp.groupdata.realm,
          };
        } else
          console.log(
            "error on permission group fetch. registering with [] permissions..."
          );

        console.log("THIS REGISTER DATA: ", userAddData);
        workflow.emit("registerUser", userAddData);
      } catch (err:any) {
        console.log(
          "     **** error on permission group fetch (catch): ",
          err.message,
          ". registering with [] permissions..."
        );
        workflow.emit("registerUser", userAddData);
      }
    });

    workflow.on("registerUser", async (userAddData: any) => {
      let _userresp = await createUser(userAddData);
      if (_userresp.status === 201) {
        let user = _userresp.userdata as IUser;
        workflow.emit("respond", user);
      } else {
        logger.logAXIOS(
          `Request sent [authentication service]: user registration failed`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: user registration failed`
        );
        resolve(
          res
            .status(400)
            .json({ status: 400, message: "please try again later" })
        );
      }
    });

    workflow.on(
      "respond",
      (user: IUser & { _id: Types.ObjectId }, _token: string) => {
        returnuser(user, _token)
          .then(({ info, statusCode }) => {
            if (statusCode === 200) {
              logger.logAXIOS(
                `Request sent [authentication service]: ${JSON.stringify(
                  info.data
                )}`,
                "info"
              );
              logger.info(
                `Request sent [authentication service]: ${JSON.stringify(
                  info.data
                )}`
              );
              resolve(res.status(200).json(info.data));
            } else {
              logger.logAXIOS(
                `Request sent [authentication service]: ${JSON.stringify(
                  info
                )}`,
                "error"
              );
              logger.error(
                `Request sent [authentication service]: ${JSON.stringify(info)}`
              );
              resolve(res.status(400).json(info));
            }
          })
          .catch((err) => {
            logger.logAXIOS(
              `Request sent [authentication service]: ${JSON.stringify(err)}`,
              "error"
            );
            logger.error(
              `Request sent [authentication service]: ${JSON.stringify(err)}`
            );
            resolve(res.status(500).json(err));
          });
      }
    );

    workflow.emit("validatepayload");
  });
}

export async function PINSetReSetOTPCheck(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("PIN RE/SET OTP CHECK...");

  const _sourceapp: String | undefined = req.headers.sourceapp as String;
  const _otpfor: String | undefined = req.headers.otpfor as String;

  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
    agentapp: ["merchant"],
  };

  let _otpfound = false;

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    const _payload = {
      // phonenumber: utils.formatPhoneNumber(req.headers.phonenumber as string),
      phonenumber: utils.formatPhoneNumber(
        req.path.includes("_v2")
          ? (req.body.phonenumber as string)
          : (req.headers.phonenumber as string)
      ),
    };

    let returndata = {
      status: false,
      otprequested: false,
      phonenumber: "",
      message: "",
    } as any;

    workflow.on("validatepayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string().required(),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        returndata.message = error.details[0].message;
        resolve(res.json(returndata));
      } else {
        // returndata.phonenumber = _payload.phonenumber as string
        workflow.emit("fetchOTP");
      }
    });

    workflow.on("fetchOTP", async () => {
      const otpquery: any = {
        phoneNumber: _payload.phonenumber,
        userRealm: allowedsources[_sourceapp as string],
        otpFor: _otpfor,
        // {
        //   $in: ['pinset', 'pinreset', 'activateaccount']
        // }
      };

      console.log(otpquery);

      let _otpresp = await otpExists(otpquery);
      if (_otpresp.status === 200) {
        _otpfound = true;
        const OTP = _otpresp.otpdata as IOTP;

        if (
          moment.utc().isAfter(OTP.expiresAt) ||
          String(OTP.status).toLowerCase() === "confirmed"
        ) {
          returndata.message =
            "please request a Verification Code from your nearest branch";
          // resolve(
          //   res.json({...returndata, message: "please request a Verification Code from your nearest branch"})
          // );
        } else {
          returndata.otprequested = true;
        }
      } else {
        returndata.message =
          "please visit your nearest branch for Verification Code";
        // resolve(
        //   res.status(200).json({ ...returndata, message: "please visit your nearest branch for Verification Code" })
        // );
      }

      workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        phoneNumber: _payload.phonenumber,
        realm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
      };

      let _userresp = await userExists(userquery);
      if (_userresp.status === 200) {
        returndata.status = true;
        returndata.phonenumber = _userresp.userdata.phoneNumber;
        // resolve(
        //   res.json({...returndata, status: true, phonenumber: _userresp.userdata.phoneNumber})
        // );
      } else {
        returndata.message =
          "please register on the Super APP and visit your nearest branch for Verification Code";
        // resolve(
        //   res.json({ ...returndata, message: "please register on the Super APP and visit your nearest branch for Verification Code" })
        // );
      }

      /**
       * default otp added for phone number +251991014552, +251991014553, +251973007357
       * APP Store  usage
       * temporary!
       */
      if (
        _otpfound === false &&
        [
          "+251991014552",
          "+251991014553",
          "+251973007357",
          "+251918627182",
        ].includes(_userresp.userdata.phoneNumber)
      ) {
        returndata.otprequested = true;
        returndata.message = "";
        returndata.otpcode = "000000";

        workflow.emit("createotp", _userresp.userdata);
      } else resolve(res.json(returndata));
    });

    workflow.on("createotp", async (user: IUser) => {
      console.log("   ****** ------ SET PINSET OTP: APPSTORE +++++ ****");
      const adddata = {
        phoneNumber: user.phoneNumber,
        accountNumber: user.mainAccount,
        userRealm: user.realm,
        userCode: user.userCode,
        otpCode: utils.localEncryptPassword("000000"),
        otpFor: "activateaccount",
        expiresAt: moment()
          .add(global._CONFIG._VALS._OTP_SESSIONTIMEOUT, "minutes")
          .toISOString(),
        enabled: true,
        status: "REQUESTED",
        createdAt: moment().toISOString(),
        lastModified: moment().toISOString(),
      };

      let _otpresp = await otpAdd(adddata);
      if (_otpresp.status === 201)
        console.log(
          "   *** **** OTP CREATED :APPSTORE-TEST-CASE:",
          _otpresp.status
        );
      else
        console.log(
          "   *** **** OTP CREATE FAILED:APPSTORE-TEST-CASE:",
          _otpresp.status
        );
    });

    workflow.emit("validatepayload");
  });
}

export async function setLoginPIN(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("SET LOGIN PIN...");

  const _user = (req as any)._user;

  const _deviceuuid: String | undefined = req.headers.deviceuuid as String;
  const _deviceplatform: String | undefined = req.headers.platform as String;
  const _sourceapp: String | undefined = req.headers.sourceapp as String;
  const _fcmtoken: String | undefined = req.headers.fcmtoken as String;

  const _payload = req.body;
  const _installationdate: String | undefined = req.headers
    .installationdate as String;

  let _encryptedpin = "" as string;

  // console.log('===== incoming payload: ', _payload)
  // console.log('===== incoming device uuid: ', _deviceuuid)
  // console.log('===== incoming source: ', _sourceapp)

  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
    agentapp: ["merchant"],
    dashportal: ["elst", "bank"],
    agentportal: ["merchant"],
  };

  let returndata = {
    status: 400,
    pinset: false,
    userdata: {} as any,
  };
  const serverPublicKey = await getPublicKey();
  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    workflow.on("validatepayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string().required(),
        pincode: Joi.number().min(6).required(),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      if (_user.phoneNumber === utils.formatPhoneNumber(_payload.phonenumber)) {
        _encryptedpin = utils.localEncryptPassword(String(_payload.pincode));
        workflow.emit("fetchuser");
      } else return res.status(401).json({ message: "invalid request" });
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber), //inputConverter.updatePhoneNumber(_payload.phonenumber),
        realm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
      };
      // console.log('---- incoming phone query for user: ',userquery)

      let _userresp = await userExists(userquery);
      // console.log('---- user found : ', _userresp)

      if (_userresp.status === 200) {
        if (
          (Object.keys(_userresp.userdata).includes("PINHistory") &&
            Array.isArray(
              _userresp.userdata.PINHistory &&
                _userresp.userdata.PINHistory.includes(_encryptedpin)
            )) ||
          (_userresp.userdata.loginPIN !== "" &&
            _encryptedpin === _userresp.userdata.loginPIN)
        )
          resolve(
            res.status(400).json({
              message:
                "The PIN has been used recently. Please choose a different PIN.",
            })
          );
        else {
          const _prevlinked = {
            query: {
              deviceUUID: _deviceuuid,
            },
            updatedata: {
              deviceUUID: "",
              deviceStatus: "UNLINKED",
              lastModified: moment.utc().toISOString(),
            },
          };

          // console.log('====== previous user query: ', _prevlinked.query)
          // console.log('====== previous user update data: ', _prevlinked.updatedata)

          // const _fristtimepinset = _userresp.userdata.realm === 'member' && Object.keys(_userresp.userdata).includes('firstPINSet') ? _userresp.userdata.firstPINSet : false
          const _newlink = {
            updatedata: {
              loginPIN: _encryptedpin,
              passwordChangedAt: moment.utc().toISOString(),
              deviceLinkedDate: moment().utc().toISOString(),
              deviceUUID: _deviceuuid,
              devicePlatform: _deviceplatform,
              deviceStatus: "LINKED",
              firstPINSet: true,
              // PINHistory: await maintainPINHistory(_userresp.userdata.loginPIN, _userresp.userdata.PINHistory),
              lastModified: moment.utc().toISOString(),
            } as any,
          };
          if (_userresp.userdata.loginPIN !== "reset_pin_requested")
            _newlink.updatedata.PINHistory = await maintainPINHistory(
              _userresp.userdata.loginPIN,
              _userresp.userdata.PINHistory
            );

          if (_installationdate && _installationdate !== "")
            _newlink.updatedata["APPInstallationDate"] = new Date(
              Number(_installationdate)
            );

          // console.log('====== new user query: ', userquery)
          // console.log('====== new user update data: ', _newlink.updatedata)

          let _allowedpin = await validatePin(_payload.pincode);
          if (
            !_allowedpin &&
            ![
              "+251991014552",
              "+251991014553",
              "+251973007357",
              "+251918627182",
            ].includes(_userresp.userdata.phoneNumber)
          )
            resolve(
              res.status(400).json({
                message: "weak PIN used: please use a strong combination",
              })
            );
          else {
            try {
              const _prevuserresp = await updateUser(
                _prevlinked.query,
                _prevlinked.updatedata
              );
              console.log(
                "-=-=-= previous user update result: ",
                _prevuserresp.status
              );

              const _newuserresp = await updateUser(
                userquery,
                _newlink.updatedata
              );
              console.log(
                "=-=-=-=- new user update result: ",
                _newuserresp.status
              );

              if (_newuserresp.status === 200) {
                const _pinsetmsg = `Dear ${String(
                  _newuserresp.userdata.fullName
                ).toLowerCase()}, 
                
Your PIN has been set successfully${
                  _newuserresp.userdata.realm === "member"
                    ? ", and your device is now securely linked."
                    : "."
                }

Dashen Bank – always one step ahead.`;

                sendSMS(_pinsetmsg, _newuserresp.userdata.phoneNumber);

                let _accesstoken = await tokenMaker(
                  _newuserresp.userdata,
                  "access",
                  _sourceapp as string,
                  serverPublicKey,
                  ["member", "merchant"].includes(_newuserresp.userdata.realm)
                    ? String(_deviceuuid)
                    : "",
                  true,
                  ["member"].includes(_newuserresp.userdata.realm)
                    ? String(_deviceplatform)
                    : "",
                  _fcmtoken
                );
                let merchantid: string = "";
                if (_newuserresp.userdata.realm == "merchant") {
                  const merchant: any = await fetch_merchant_info(
                    _newuserresp.userdata.organizationID
                  );
                  console.log("merchant === > ", merchant);

                  if (merchant.status) {
                    merchantid = merchant.data.TILLNumber;
                  }
                }

                returnuser(_newuserresp.userdata, _accesstoken)
                  .then(({ info, statusCode }) => {
                    if (statusCode === 200) {
                      workflow.emit("removeotp", _userresp.userdata);
                      resolve(
                        res.status(200).json({
                          ...info.data,
                          publicKey: serverPublicKey,
                          rf: serverPublicKey,
                          merchantid,
                        })
                      );
                    } else {
                      resolve(res.status(400).json(info));
                    }
                  })
                  .catch((err) => {
                    resolve(res.status(500).json(err));
                  });
              } else
                resolve(
                  res.status(400).json({ message: "account not active" })
                );
            } catch (error) {
              resolve(
                res
                  .status(400)
                  .json({ ...returndata, message: "please try again later" })
              );
            }
          }
        }
      } else {
        resolve(
          res.status(500).json({
            ...returndata,
            message:
              "please register on the Super APP and visit your nearest branch for Verification Code",
          })
        );
      }
    });

    workflow.on("removeotp", async (user: IUser) => {
      const otpquery = {
        phoneNumber: user.phoneNumber,
        status: "CONFIRMED",
        otpFor: { $in: ["pinset", "pinreset"] },
      };

      let _otpresp = await otpRemove(otpquery);

      if (_otpresp.status === 200)
        console.log("successfully removed confirmed otps on app pinops");
      else console.log("remove otp failed on app pinops");
    });

    workflow.emit("validatepayload");
  });
}

export async function pinLogin(req: Request, res: Response): Promise<Response> {
  console.log("PIN LOGIN...");

  const _deviceuuid: String | undefined = req.headers.deviceuuid as String;
  const _deviceplatform: String | undefined = req.headers.platform as String;
  const _sourceapp: String | undefined = req.headers.sourceapp as String;
  const _fcmtoken: String | undefined = req.headers.fcmtoken as String;

  const _payload = req.body;

  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
    agentapp: ["merchant"],
    dashportal: ["elst", "bank"],
    agentportal: ["merchant"],
  };

  const _dashrequest = ["dashportal", "agentportal"].includes(
    _sourceapp as string
  );
  const _agentapp = ["agentapp"].includes(_sourceapp as string);
  const serverPublicKey = await getPublicKey();
  let returndata = {
    status: 400,
    pinset: false,
    userdata: {} as any,
  };

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    workflow.on("validatepayload", () => {
      const schema = Joi.object({
        pincode: Joi.number().min(6).required(),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        logger.logAXIOS(
          `Response sent [authentication service]: ${JSON.stringify({
            error,
          })}`,
          "error"
        );
        logger.error(
          `Response sent [authentication service]: ${JSON.stringify({ error })}`
        );
        return res.status(400).json({ message: error.details[0].message });
      }

      workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        realm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
      } as any;

      if (_dashrequest || _agentapp)
        userquery = { ...userquery, _id: (req as any)._user._id };
      else userquery = { ...userquery, deviceUUID: _deviceuuid };

      let _userresp = await userExists(userquery);

      if (_userresp.status === 200) {
        let user = _userresp.userdata as IUser;

        if (!user.enabled) {
          logger.logAXIOS(
            `Request sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "user not active",
            })}`,
            "error"
          );
          logger.error(
            `Request sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "user not active",
            })}`
          );
          resolve(
            res.status(400).json({
              ...returndata,
              accountLocked: true,
              message:
                _userresp.userdata.realm === "merchant" &&
                _userresp.userdata.merchantRole === "agent"
                  ? `Cashier is suspended!

Please talk to your merchant if this is done by mistake.`
                  : "account locked. please visit your neareset branch to activate your account",
            })
          );
        } else {
          if (
            _dashrequest &&
            (user.OTPStatus !== "verified" ||
              moment.utc().diff(user.OPTLastVerifiedAt, "seconds") > 180)
          ) {
            logger.logAXIOS(
              `Response sent [authentication service]: ${JSON.stringify({
                _deviceuuid,
                ...returndata,
              })}`,
              "error"
            );
            logger.error(
              `Response sent [authentication service]: ${JSON.stringify({
                _deviceuuid,
                ...returndata,
              })}`
            );
            resolve(
              res.status(500).json({
                ...returndata,
                OTPExpired: true,
                message: "session expired: please verify OTP and try again",
              })
            );
          } else {
            if (
              (user.loginAttemptCount as number) >= 3 &&
              moment.utc().isBefore(user.nextLoginAttempt)
            ) {
              // realm + count
              // logger.error(`Response sent [authentication service]: ${JSON.stringify({_deviceuuid,user:`${user.fullName} - ${user.phoneNumber}`, message: 'inccorect credentials used'})}`)
              // if (user.realm === "merchant") {
              //   return res
              //     .status(400)
              //     .json({
              //       message: "Your account is locked. Please use forget pin.",
              //     });
              // } else {
              // }
              exports.incorrectTriesHandler(user, res);
            } else {
              if (
                utils.localEncryptPassword(String(_payload.pincode)) !==
                user.loginPIN
              ) {
                // logger.error(`Response sent [authentication service]: ${JSON.stringify({_deviceuuid, user:`${user.fullName} - ${user.phoneNumber}`, message: 'inccorect credentials used'})}`)
                exports.incorrectTriesHandler(user, res);
              } else workflow.emit("loginuser", _userresp.userdata);
            }
          }
        }
      } else {
        logger.logAXIOS(
          `Request sent [authentication service]: ${JSON.stringify(
            userquery
          )} - user not found`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: ${JSON.stringify(
            userquery
          )} - user not found`
        );
        resolve(
          res.status(500).json({
            ...returndata,
            userFound: false,
            message:
              "please register on the Super APP and visit your nearest branch for Verification Code",
          })
        );
      }
    });

    workflow.on("loginuser", async (user: IUser) => {
      logger.logAXIOS(
        `Response sent: ${JSON.stringify({
          user: `${user.fullName} - ${user.phoneNumber}`,
          message: "logged in",
        })}`,
        "info"
      );
      logger.info(
        `Response sent: ${JSON.stringify({
          user: `${user.fullName} - ${user.phoneNumber}`,
          message: "logged in",
        })}`
      );

      let _accesstoken = await tokenMaker(
        user,
        "access",
        _sourceapp as string,
        serverPublicKey,
        ["member", "merchant"].includes(user.realm) ? String(_deviceuuid) : "",
        false,
        ["member"].includes(user.realm) ? String(_deviceplatform) : "",
        _fcmtoken
      );
      let merchantid: string = "";
      if (user.realm == "merchant") {
        const merchant: any = await fetch_merchant_info(user.organizationID);
        console.log("merchant === > ", merchant);

        if (merchant.status) {
          merchantid = merchant.data.TILLNumber;
        }
      }
      returnuser(user, _accesstoken)
        .then(({ info, statusCode }) => {
          if (statusCode === 200) {
            logger.logAXIOS(
              `Response sent [authentication service]: ${JSON.stringify(
                info.data
              )}`,
              "info"
            );
            logger.info(
              `Response sent [authentication service]: ${JSON.stringify(
                info.data
              )}`
            );
            resolve(
              res.status(200).json({
                ...info.data,
                publicKey: serverPublicKey,
                rf: serverPublicKey,
                merchantid,
              })
            );
          } else {
            resolve(res.status(400).json(info));
          }
        })
        .catch((err) => {
          logger.logAXIOS(
            `Response sent [authentication service]: ${JSON.stringify(err)}`,
            "error"
          );
          logger.error(
            `Response sent [authentication service]: ${JSON.stringify(err)}`
          );
          resolve(res.status(500).json(err));
        });
    });

    workflow.emit("validatepayload");
  });
}

export async function removeDeviceTokenization(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("UNSUBSCRIBE DEVICE...");

  const _deviceuuid: String | undefined = req.headers.deviceuuid as String;
  const _sourceapp: String | undefined = req.headers.sourceapp as String;

  const _payload = req.body;

  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
    agentapp: ["merchant"],
  };

  let returndata = {
    status: 400,
    unsubscribed: false,
  };

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    workflow.on("validatepayload", () => {
      workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        deviceUUID: _deviceuuid,
        realm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
      };

      const _userresp = await userExists(userquery);

      if (_userresp.status === 200) {
        // // let linkedaccountsdata = _userresp.userdata.linkedAccounts.map((_account: any) => {
        // //   return {
        // //     accountNumber: _account.accountNumber,
        // //     linkedStatus: false,
        // //     linkedDate: moment(_account.linked).toISOString()
        // //   }
        // // })

        // const updatedata = {
        //   $set: {
        //     loginPIN: '',
        //     deviceUUID: '',
        //     deviceStatus: 'UNLINKED',
        //     PINHistory: []
        //     // linkedAccounts: linkedaccountsdata,
        //     // accountLinked: false,
        //     // mainAccount: ''
        //   },
        //   lastModified: moment.utc().toISOString()
        // }

        // const unsubscribeduser = await updateUser(userquery, updatedata)
        // const dropallldapactions = await dropLDAPActions({user: _userresp.userdata._id, status: "PENDING"}, {$set:{status: 'REJECTED'}})
        // const dropallotps = await dropOTPs(_userresp.userdata.phoneNumber, _userresp.userdata.realm)

        // console.log('user update result: ', unsubscribeduser.status)
        // console.log('drop all ldap result: ', dropallldapactions.status)
        // console.log('drop otp result: ', dropallotps.status)

        // if (unsubscribeduser.status === 200) {
        //   returndata.status = 200
        //   returndata.unsubscribed = true
        //   resolve(res.json({ ...returndata, message: 'device unsubscribed successfully' }));
        // }
        // else resolve(res.status(400).json({ ...returndata, message: 'try again later' }))

        const unlinkdevice = await unlinkDevice(_userresp.userdata, -1);
        console.log(
          "unlink statuses: ",
          unlinkdevice.status,
          unlinkdevice.unlinkdata
        );
        if (
          unlinkdevice.status === 200 &&
          unlinkdevice.unlinkdata.unsubscribestatus === 200
        ) {
          returndata.status = 200;
          returndata.unsubscribed = true;
          resolve(
            res.json({
              ...returndata,
              message: "device unsubscribed successfully",
            })
          );
        } else
          resolve(
            res.status(400).json({ ...returndata, message: "try again later" })
          );
      } else {
        resolve(
          res.status(500).json({
            ...returndata,
            message:
              "please register on the Super APP and visit your nearest branch for Verification Code",
          })
        );
      }
    });

    workflow.emit("validatepayload");
  });
}

export async function changePIN(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("CHANGE PIN...");

  const _deviceuuid: String | undefined = req.headers.deviceuuid as String;
  const _deviceplatform: String | undefined = req.headers.platform as String;
  const _sourceapp: String | undefined = req.headers.sourceapp as String;
  const _fcmtoken: String | undefined = req.headers.fcmtoken as String;

  const _dashrequest = ["dashportal", "agentportal"].includes(
    _sourceapp as string
  );

  const _payload = req.body;

  let _oldencryptedpin = "" as string;
  let _newencryptedpin = "" as string;

  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
    agentapp: ["merchant"],
    dashportal: ["elst", "bank"],
    agentportal: ["merchant"],
  };

  let returndata = {
    status: 400,
    pinchanged: false,
    accesstoken: "",
  };

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    workflow.on("validatepayload", () => {
      const schema = Joi.object({
        oldpin: Joi.string().required(),
        newpin: Joi.number().min(6).required(),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        logger.logAXIOS(
          `Request sent [authentication service]: required body missing`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: required body missing`
        );
        return res.status(400).json({ message: error.details[0].message });
      }

      _oldencryptedpin = utils.localEncryptPassword(String(_payload.oldpin));
      _newencryptedpin = utils.localEncryptPassword(String(_payload.newpin));
      workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        realm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
      } as any;

      if (_dashrequest)
        userquery = { ...userquery, _id: (req as any)._user._id };
      else userquery = { ...userquery, deviceUUID: _deviceuuid };

      let _userresp = await userExists(userquery);

      if (_userresp.status === 200) {
        if (_userresp.userdata.PINHistory.includes(_newencryptedpin)) {
          logger.logAXIOS(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "The PIN has been used recently",
            })}`,
            "error"
          );
          logger.error(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "The PIN has been used recently",
            })}`
          );
          resolve(
            res.status(400).json({
              message:
                "The PIN has been used recently. Please choose a different PIN.",
            })
          );
        } else {
          if (_newencryptedpin === _userresp.userdata.loginPIN) {
            {
              logger.logAXIOS(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "PIN has no change",
                })}`,
                "error"
              );
              logger.error(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "PIN has no change",
                })}`
              );
              resolve(
                res.status(500).json({
                  ...returndata,
                  message: "PIN has no change: please provide a different PIN",
                })
              );
            }
          } else {
            if (
              _userresp.status === 200 &&
              _oldencryptedpin === _userresp.userdata.loginPIN
            ) {
              let _allowedpin = await validatePin(_payload.newpin);
              if (!_allowedpin) {
                logger.logAXIOS(
                  `Response sent [authentication service]: ${JSON.stringify({
                    _deviceuuid,
                    message: "weak PIN used",
                  })}`,
                  "error"
                );
                logger.error(
                  `Response sent [authentication service]: ${JSON.stringify({
                    _deviceuuid,
                    message: "weak PIN used",
                  })}`
                );
                resolve(
                  res.status(401).json({
                    message: "weak PIN used: please use a strong combination",
                  })
                );
              } else {
                let updatedata = {
                  loginPIN: _newencryptedpin,
                  firstPINSet: true,
                  PINHistory: await maintainPINHistory(
                    _oldencryptedpin,
                    _userresp.userdata.PINHistory
                  ),
                  passwordChangedAt: moment.utc().toISOString(),
                  lastModified: moment.utc().toISOString(),
                };

                const pinchangeduser = await updateUser(userquery, updatedata);

                console.log("user update result: ", pinchangeduser.status);

                if (pinchangeduser.status === 200) {
                  let _accesstoken = await tokenMaker(
                    pinchangeduser.userdata,
                    "access",
                    _sourceapp as string,
                    "",
                    ["member", "merchant"].includes(
                      pinchangeduser.userdata.realm
                    )
                      ? String(_deviceuuid)
                      : "",
                    true,
                    ["member"].includes(pinchangeduser.userdata.realm)
                      ? String(_deviceplatform)
                      : "",
                    _fcmtoken
                  );
                  // returndata.status = 200
                  // returndata.pinchanged = true
                  // returndata.accesstoken = _accesstoken

                  returnuser(pinchangeduser.userdata, _accesstoken)
                    .then(({ info, statusCode }) => {
                      if (statusCode === 200) {
                        logger.logAXIOS(
                          `Response sent [authentication service]: ${JSON.stringify(
                            info.data
                          )}`,
                          "info"
                        );
                        logger.info(
                          `Response sent [authentication service]: ${JSON.stringify(
                            info.data
                          )}`
                        );
                        resolve(res.status(200).json(info.data));
                      } else {
                        logger.logAXIOS(
                          `Response sent [authentication service]: ${JSON.stringify(
                            { _deviceuuid, info }
                          )}`,
                          "error"
                        );
                        logger.error(
                          `Response sent [authentication service]: ${JSON.stringify(
                            { _deviceuuid, info }
                          )}`
                        );
                        resolve(res.status(400).json(info));
                      }
                    })
                    .catch((err) => {
                      logger.logAXIOS(
                        `Response sent [authentication service]: ${JSON.stringify(
                          { err }
                        )}`,
                        "error"
                      );
                      logger.error(
                        `Response sent [authentication service]: ${JSON.stringify(
                          { err }
                        )}`
                      );
                      resolve(res.status(500).json(err));
                    });
                } else {
                  logger.logAXIOS(
                    `Response sent [authentication service]: ${JSON.stringify({
                      _deviceuuid,
                      returndata,
                    })}`,
                    "error"
                  );
                  logger.error(
                    `Response sent [authentication service]: ${JSON.stringify({
                      _deviceuuid,
                      returndata,
                    })}`
                  );
                  resolve(
                    res
                      .status(400)
                      .json({ ...returndata, message: "try again later" })
                  );
                }
              }
            } else {
              if (Object.keys(_userresp.userdata).length > 0) {
                logger.logAXIOS(
                  `Response sent [authentication service]: ${JSON.stringify({
                    _deviceuuid,
                    message: "old PIN mismatch",
                  })}`,
                  "error"
                );
                logger.error(
                  `Response sent [authentication service]: ${JSON.stringify({
                    _deviceuuid,
                    message: "old PIN mismatch",
                  })}`
                );
                resolve(
                  res.status(500).json({
                    ...returndata,
                    message: "old PIN mismatch: please try again",
                  })
                );
              } else {
                logger.logAXIOS(
                  `Response sent [authentication service]: ${JSON.stringify({
                    _deviceuuid,
                    message: "user data not found",
                  })}`,
                  "error"
                );
                logger.error(
                  `Response sent [authentication service]: ${JSON.stringify({
                    _deviceuuid,
                    message: "user data not found",
                  })}`
                );
                resolve(
                  res
                    .status(500)
                    .json({ ...returndata, message: "user data not found" })
                );
              }
            }
          }
        }
      } else {
        logger.logAXIOS(
          `Response sent [authentication service]: ${JSON.stringify({
            _deviceuuid,
            message: "user data not found",
          })}`,
          "error"
        );
        logger.error(
          `Response sent [authentication service]: ${JSON.stringify({
            _deviceuuid,
            message: "user data not found",
          })}`
        );
        resolve(
          res.status(500).json({
            ...returndata,
            message:
              "please register on the Super APP and visit your nearest branch for Verification Code",
          })
        );
      }
    });

    workflow.emit("validatepayload");
  });
}

export async function checkPINStrength(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("CHECK PIN STRENGTH...");

  const _deviceuuid: String | undefined = req.headers.deviceuuid as String;
  const _sourceapp: String | undefined = req.headers.sourceapp as String;

  const _payload = req.body;

  // let _oldencryptedpin = '' as string
  let _newencryptedpin = "" as string;

  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
  };

  let returndata = {
    status: 400,
  };

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    workflow.on("validatepayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string().required(),
        newpin: Joi.number().min(6).required(),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        logger.logAXIOS(
          `Request sent [authentication service]: required body missing`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: required body missing`
        );
        return res.status(400).json({ message: error.details[0].message });
      }

      _newencryptedpin = utils.localEncryptPassword(String(_payload.newpin));
      workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        realm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
      } as any;

      let _userresp = await userExists(userquery);

      if (_userresp.status === 200) {
        if (_userresp.userdata.PINHistory.includes(_newencryptedpin)) {
          logger.logAXIOS(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "The PIN has been used recently",
            })}`,
            "error"
          );
          logger.error(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "The PIN has been used recently",
            })}`
          );
          resolve(
            res.status(400).json({
              message:
                "The PIN has been used recently. Please choose a different PIN.",
            })
          );
        } else {
          if (_newencryptedpin === _userresp.userdata.loginPIN) {
            {
              logger.logAXIOS(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "PIN has no change",
                })}`,
                "error"
              );
              logger.error(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "PIN has no change",
                })}`
              );
              resolve(
                res.status(500).json({
                  ...returndata,
                  message: "PIN has no change: please provide a different PIN",
                })
              );
            }
          } else {
            // if (_userresp.status === 200 && _oldencryptedpin === _userresp.userdata.loginPIN) {
            let _allowedpin = await validatePin(_payload.newpin);
            if (!_allowedpin) {
              logger.logAXIOS(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "weak PIN used",
                })}`,
                "error"
              );
              logger.error(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "weak PIN used",
                })}`
              );
              resolve(
                res.status(401).json({
                  message: "weak PIN used: please use a strong combination",
                })
              );
            } else {
              resolve(res.status(200).json({ status: 200, message: "200OK" }));
            }
            // }
            // else {
            // if (Object.keys(_userresp.userdata).length > 0){
            //   logger.logAXIOS(`Response sent [authentication service]: ${JSON.stringify({_deviceuuid, message: 'old PIN mismatch'})}`, 'error')
            //   logger.error(`Response sent [authentication service]: ${JSON.stringify({_deviceuuid, message: 'old PIN mismatch'})}`)
            //   resolve(
            //     res.status(500).json({ ...returndata, message: "old PIN mismatch: please try again" })
            //   );
            // }
            // else{
            //   logger.logAXIOS(`Response sent [authentication service]: ${JSON.stringify({_deviceuuid,  message: "user data not found" })}`, 'error')
            //   logger.error(`Response sent [authentication service]: ${JSON.stringify({_deviceuuid,  message: "user data not found" })}`)
            //   resolve(
            //     res.status(500).json({ ...returndata, message: "user data not found" })
            //   );
            // }
            // }
          }
        }
      } else {
        logger.logAXIOS(
          `Response sent [authentication service]: ${JSON.stringify({
            _deviceuuid,
            message: "user data not found",
          })}`,
          "error"
        );
        logger.error(
          `Response sent [authentication service]: ${JSON.stringify({
            _deviceuuid,
            message: "user data not found",
          })}`
        );
        resolve(
          res.status(500).json({
            ...returndata,
            message:
              "please register on the Super APP and visit your nearest branch for Verification Code",
          })
        );
      }
    });

    if (
      ["+251991014552", "+251991014553", "+251973007357"].includes(
        String(utils.formatPhoneNumber(_payload.phonenumber))
      )
    )
      resolve(res.status(200).json({ status: 200, message: "200OK" }));
    else workflow.emit("validatepayload");
  });
}

export async function signout(req: Request, res: Response): Promise<Response> {
  console.log("SIGNOUT ACCOUNT...");

  const _deviceuuid: String | undefined = req.headers.deviceuuid as String;
  const _sourceapp: String | undefined = req.headers.sourceapp as String;

  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
    agentapp: ["merchant"],
    dashportal: ["elst", "bank"],
    agentportal: ["merchant"],
  };

  const _dashrequest = ["dashportal", "agentportal"].includes(
    _sourceapp as string
  );

  let returndata = {
    status: 400,
    loggedout: false,
  };

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    workflow.on("validatepayload", () => {
      workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        realm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
      } as any;

      if (_dashrequest)
        userquery = { ...userquery, _id: (req as any)._user._id };
      else userquery = { ...userquery, deviceUUID: _deviceuuid };

      const _userresp = await userExists(userquery);

      if (_userresp.status === 200) {
        invalidateSession(_userresp.userdata);

        const updatedata = {
          accessToken: "",
          sessionExpiresOn: moment.utc().subtract(1, "days").toISOString(),
          lastModified: moment.utc().toISOString(),
        };

        const loggedoutser = await updateUser(userquery, updatedata);

        if (loggedoutser.status === 200) {
          logger.logAXIOS(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "user logged out",
            })}`,
            "info"
          );
          logger.info(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "user logged out",
            })}`
          );

          if (["dashportal", "agentportal"].includes(_sourceapp as string))
            workflow.emit("removeotp", loggedoutser.userdata);

          returndata.status = 200;
          returndata.loggedout = true;
          resolve(
            res.json({ ...returndata, message: "logged out successfully" })
          );
        } else {
          logger.logAXIOS(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              ...returndata,
            })}`,
            "error"
          );
          logger.error(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              ...returndata,
            })}`
          );
          resolve(
            res.status(400).json({ ...returndata, message: "try again later" })
          );
        }
      } else {
        logger.logAXIOS(
          `Response sent [authentication service]: ${JSON.stringify({
            _deviceuuid,
            ...returndata,
          })}`,
          "error"
        );
        logger.error(
          `Response sent [authentication service]: ${JSON.stringify({
            _deviceuuid,
            ...returndata,
          })}`
        );
        resolve(
          res
            .status(500)
            .json({ ...returndata, message: "please try again later" })
        );
      }
    });

    workflow.on("removeotp", async (user: IUser) => {
      const otpquery = {
        phoneNumber: user.phoneNumber,
        status: "CONFIRMED",
        otpFor: "login",
      };

      let _otpresp = await otpRemove(otpquery);

      if (_otpresp.status === 200) console.log("    otp found and removed");
      else console.log("    otp not found or error removing");
    });

    workflow.emit("validatepayload");
  });
}

export async function verifyPIN(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("VERIFY PIN...");

  let _payload = req.body;

  const _deviceuuid: string | undefined = req.headers.deviceuuid as string;

  return await new Promise(async (resolve) => {
    const schema = Joi.object({
      pincode: Joi.number().min(4).required(),
    });

    const { error } = schema.validate(_payload);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    } else {
      let userquery = {
        deviceUUID: _deviceuuid,
        enabled: true,
      };

      let _userresp = await userExists(userquery);
      if (
        _userresp.status === 200 &&
        utils.localEncryptPassword(String(_payload.pincode)) ===
          _userresp.userdata.loginPIN
      )
        resolve(res.status(200).json({ status: true, messgage: "verified" }));
      else
        resolve(
          res.status(400).json({ status: false, message: "incorrect pin" })
        );
    }
  });
}

export async function forgotPIN(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("forgot PIN...");

  const _deviceuuid: String | undefined = req.headers.deviceuuid as String;
  const _deviceplatform: String | undefined = req.headers.platform as String;
  const _sourceapp: String | undefined = req.headers.sourceapp as String;
  const _fcmtoken: String | undefined = req.headers.fcmtoken as String;

  const _dashrequest = ["dashportal", "agentportal"].includes(
    _sourceapp as string
  );

  const _payload = req.body;

  let _oldencryptedpin = "" as string;
  let _newencryptedpin = "" as string;

  const allowedsources: Record<string, string[]> = {
    memberapp: ["member"],
    agentapp: ["merchant"],
    dashportal: ["elst", "bank"],
    agentportal: ["merchant"],
  };

  let returndata = {
    status: 400,
    pinchanged: false,
    accesstoken: "",
  };

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    workflow.on("validatepayload", () => {
      const schema = Joi.object({
        // oldpin: Joi.string().required(),
        newpin: Joi.number().min(6).required(),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        logger.logAXIOS(
          `Request sent [authentication service]: required body missing`,
          "error"
        );
        logger.error(
          `Request sent [authentication service]: required body missing`
        );
        return res.status(400).json({ message: error.details[0].message });
      }

      // _oldencryptedpin = utils.localEncryptPassword(String(_payload.oldpin));
      _newencryptedpin = utils.localEncryptPassword(String(_payload.newpin));
      workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        realm: { $in: allowedsources[String(_sourceapp).toLowerCase()] },
      } as any;

      if (_dashrequest)
        userquery = { ...userquery, _id: (req as any)._user._id };
      else userquery = { ...userquery, deviceUUID: _deviceuuid };

      let _userresp = await userExists(userquery);

      if (_userresp.status === 200) {
        _oldencryptedpin = _userresp.userdata.loginPIN;

        if (_userresp.userdata.PINHistory.includes(_newencryptedpin)) {
          logger.logAXIOS(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "The PIN has been used recently",
            })}`,
            "error"
          );
          logger.error(
            `Response sent [authentication service]: ${JSON.stringify({
              _deviceuuid,
              message: "The PIN has been used recently",
            })}`
          );
          resolve(
            res.status(400).json({
              message:
                "The PIN has been used recently. Please choose a different PIN.",
            })
          );
        } else {
          if (_newencryptedpin === _userresp.userdata.loginPIN) {
            {
              logger.logAXIOS(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "PIN has no change",
                })}`,
                "error"
              );
              logger.error(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "PIN has no change",
                })}`
              );
              resolve(
                res.status(500).json({
                  ...returndata,
                  message: "PIN has no change: please provide a different PIN",
                })
              );
            }
          } else {
            // if (
            //   _userresp.status === 200 &&
            //   _oldencryptedpin === _userresp.userdata.loginPIN
            // ) {
            let _allowedpin = await validatePin(_payload.newpin);
            if (!_allowedpin) {
              logger.logAXIOS(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "weak PIN used",
                })}`,
                "error"
              );
              logger.error(
                `Response sent [authentication service]: ${JSON.stringify({
                  _deviceuuid,
                  message: "weak PIN used",
                })}`
              );
              resolve(
                res.status(401).json({
                  message: "weak PIN used: please use a strong combination",
                })
              );
            } else {
              let updatedata = {
                loginPIN: _newencryptedpin,
                firstPINSet: true,
                PINHistory: await maintainPINHistory(
                  _oldencryptedpin,
                  _userresp.userdata.PINHistory
                ),
                passwordChangedAt: moment.utc().toISOString(),
                lastModified: moment.utc().toISOString(),
              };

              const pinchangeduser = await updateUser(userquery, updatedata);

              console.log("user update result: ", pinchangeduser.status);

              if (pinchangeduser.status === 200) {
                let _accesstoken = await tokenMaker(
                  pinchangeduser.userdata,
                  "access",
                  _sourceapp as string,
                  "",
                  ["member", "merchant"].includes(pinchangeduser.userdata.realm)
                    ? String(_deviceuuid)
                    : "",
                  true,
                  ["member"].includes(pinchangeduser.userdata.realm)
                    ? String(_deviceplatform)
                    : "",
                  _fcmtoken
                );
                // returndata.status = 200
                // returndata.pinchanged = true
                // returndata.accesstoken = _accesstoken

                returnuser(pinchangeduser.userdata, _accesstoken)
                  .then(({ info, statusCode }) => {
                    if (statusCode === 200) {
                      logger.logAXIOS(
                        `Response sent [authentication service]: ${JSON.stringify(
                          info.data
                        )}`,
                        "info"
                      );
                      logger.info(
                        `Response sent [authentication service]: ${JSON.stringify(
                          info.data
                        )}`
                      );
                      resolve(res.status(200).json(info.data));
                    } else {
                      logger.logAXIOS(
                        `Response sent [authentication service]: ${JSON.stringify(
                          { _deviceuuid, info }
                        )}`,
                        "error"
                      );
                      logger.error(
                        `Response sent [authentication service]: ${JSON.stringify(
                          { _deviceuuid, info }
                        )}`
                      );
                      resolve(res.status(400).json(info));
                    }
                  })
                  .catch((err) => {
                    logger.logAXIOS(
                      `Response sent [authentication service]: ${JSON.stringify(
                        { err }
                      )}`,
                      "error"
                    );
                    logger.error(
                      `Response sent [authentication service]: ${JSON.stringify(
                        { err }
                      )}`
                    );
                    resolve(res.status(500).json(err));
                  });
              } else {
                logger.logAXIOS(
                  `Response sent [authentication service]: ${JSON.stringify({
                    _deviceuuid,
                    returndata,
                  })}`,
                  "error"
                );
                logger.error(
                  `Response sent [authentication service]: ${JSON.stringify({
                    _deviceuuid,
                    returndata,
                  })}`
                );
                resolve(
                  res
                    .status(400)
                    .json({ ...returndata, message: "try again later" })
                );
              }
            }
            // } else {
            // if (Object.keys(_userresp.userdata).length > 0) {
            //   logger.logAXIOS(
            //     `Response sent [authentication service]: ${JSON.stringify({
            //       _deviceuuid,
            //       message: "old PIN mismatch",
            //     })}`,
            //     "error"
            //   );
            //   logger.error(
            //     `Response sent [authentication service]: ${JSON.stringify({
            //       _deviceuuid,
            //       message: "old PIN mismatch",
            //     })}`
            //   );
            //   resolve(
            //     res.status(500).json({
            //       ...returndata,
            //       message: "old PIN mismatch: please try again",
            //     })
            //   );
            // } else {
            //   logger.logAXIOS(
            //     `Response sent [authentication service]: ${JSON.stringify({
            //       _deviceuuid,
            //       message: "user data not found",
            //     })}`,
            //     "error"
            //   );
            //   logger.error(
            //     `Response sent [authentication service]: ${JSON.stringify({
            //       _deviceuuid,
            //       message: "user data not found",
            //     })}`
            //   );
            //   resolve(
            //     res
            //       .status(500)
            //       .json({ ...returndata, message: "user data not found" })
            //   );
            // }
          }
        }
        // }
      } else {
        logger.logAXIOS(
          `Response sent [authentication service]: ${JSON.stringify({
            _deviceuuid,
            message: "user data not found",
          })}`,
          "error"
        );
        logger.error(
          `Response sent [authentication service]: ${JSON.stringify({
            _deviceuuid,
            message: "user data not found",
          })}`
        );
        resolve(
          res.status(500).json({
            ...returndata,
            message:
              "please register on the Super APP and visit your nearest branch for Verification Code",
          })
        );
      }
    });

    workflow.emit("validatepayload");
  });
}

export default {
  healthCheck,
  login,
  deviceLookUP,
  phoneNumberLookUP,
  memberSelfSignupV2,
  memberSelfSignup,
  userRegister,
  PINSetReSetOTPCheck,
  setLoginPIN,
  pinLogin,
  removeDeviceTokenization,
  changePIN,
  checkPINStrength,
  signout,
  verifyPIN,
  forgotPIN,
  unlinkDevice
};
