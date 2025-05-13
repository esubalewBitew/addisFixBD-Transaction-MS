import dotenv from "dotenv";

import { EventEmitter } from "events";
import { type Request, type Response } from "express";

import jwt from "jsonwebtoken";
import axios from "axios";

import userDal from "../dal/user.dal";
import { type IUser } from "../config/types/user";

import { type IOTP } from "../config/types/otp";
import OTPDal from "../dal/otp.dal";

import { tempTokenMaker } from "../lib/auth_functions";
import { memberSelfSignup } from "./auth.controller";

import utils from "../lib/utils";
import randomNumber from "../lib/generate_random_number";

import Joi, { string } from "joi";

import moment from "moment";
import kafkaProducer from "../lib/kafka_producer";

import logger from "../logger";
import { getPublicKey } from "../lib/keyManager";
import axiosSendSms from "../lib/axios_sendSms";

import _AUTHCONTROLLER from "./auth.controller";

const _valuemapping: any = {
  sms: "phoneNumber",
  email: "email",
  both: "emailAndPhone",
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

const updateUser = async (
  query: any,
  updatedata: any
): Promise<{ status: number; userdata: any }> => {
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

const otpExists = async (
  query: any
): Promise<{ status: number; otpdata: any }> => {
  try {
    // console.log("this otp exists query: ", query);

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

const otpUpdate = async (
  query: any,
  updatedata: any
): Promise<{ status: number; otpdata: any }> => {
  try {
    const { statusCode: otpDalStatusCode, body: otpDalBody } = await OTPDal({
      method: "update",
      query: query,
      update: updatedata,
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

const sendSMS = async (otpcode: any, phonenumber: string) => {
  // kafkaProducer("sendSMS", {
  //   recipient: phonenumber,
  //   messageBody: `Your One Time Verification Passcode is ${otpcode}`,
  // });
  await axiosSendSms(
    phonenumber,
    `Your One Time Verification Passcode is ${otpcode}`
  );
};

const sendEmail = async (otpcode: any, email: string, fullname: string) => {
  await kafkaProducer("sendEmail", {
    otpcode: otpcode,
    type: "otp",
    recipients: [email],
    subject: "Email Verification",
    receiver: fullname,
  });
};

// const otpSchema = Joi.object({
//   otpcode: Joi.string()
//     .pattern(/^\d{6}$/, "numbers") // OTP must be exactly 6 digits
//     .required()
//     .messages({
//       "string.empty": "OTP code is required",
//       "string.pattern.base": "OTP code must be a 6-digit number",
//     }),
//   phonenumber: Joi.string()
//     .pattern(/^\d{9,15}$/, "numbers") // Phone number must be 10 to 15 digits
//     .required()
//     .messages({
//       "string.empty": "Phone number is required",
//       "string.pattern.base": "Phone number must be between 10 and 15 digits",
//     }),
// });

// const sendSMSLDAP = async (req: Request, res: Response) => {
//   let workflow = new EventEmitter();

//   workflow.on("validate", (Payload) => {
//     const { error, value } = otpSchema.validate(Payload);

//     if (error) {
//       return res
//         .status(400)
//         .json({ success: false, message: error.details[0].message });
//     }
//     workflow.emit("send sms", value);
//   });
//   workflow.on("send sms", async (value) => {
//     try {
//       const kafkaResponse: any = await kafkaProducer("sendSMS", {
//         recipient: value.phonenumber,
//         messageBody: `LDAP Login otp code is: ${value.otpcode}`,
//       });

//       return res
//         .status(200)
//         .json({ success: true, message: "SMS sent successfully" });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: "Error occurred while sending SMS",
//         error: error.message,
//       });
//     }
//   });

//   let Payload = req.body;
//   workflow.emit("validate", Payload);
// };

export async function generateOTP(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("OTP OPS: GENERATE...");

  const serverPublicKey = await getPublicKey();
  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    const _payload = req.body;

    const _sourceapp: String | undefined = req.headers.sourceapp as String;
    const _otpreason: String | undefined = req.headers.otpfor as String;

    let _apprequest = false;
    let _dashrequest = false;
    let _agentops = false;

    const _ldapops = [
      "accountlink",
      "accountunlink",
      "changephone",
      "pinreset",
      "activateaccount",
      "removeaccount",
      "attachphone",
      "detachphone",
    ];

    const _accountlinkunlink =
      _ldapops.includes(String(_otpreason).toLowerCase()) &&
      !["attachphone", "detachphone"].includes(_otpreason as string);
    const _phonechange = _otpreason === "changephone";
    const _activateaccount =
      _ldapops.includes(_otpreason as string) && _sourceapp === "ldapportal";

    let userquery: {
      realm?: Object;
      poolSource?: String;
      phoneNumber?: String;
      isDeleted: boolean;
      userCode?: String;
      merchantRole?: String;
    } = {
      isDeleted: false,
    } as any;

    switch (_sourceapp) {
      case "memberapp":
        userquery.realm = { $in: ["member"] };
        userquery.poolSource = "app";
        _apprequest = true;
        break;

      case "agentapp":
        userquery.realm = { $in: ["merchant"] };
        userquery.poolSource = "agent";
        _apprequest = true;
        _agentops = _otpreason === "createagent" ? true : false;
        break;

      case "agentportal":
        userquery.realm = { $in: ["merchant"] };
        userquery.poolSource = "agent";
        // if (_otpreason === "login") userquery.merchantRole = "owner";
        _dashrequest = true;
        break;

      case "dashportal":
        userquery.realm = { $in: ["elst", "bank", "merchant"] };
        userquery.poolSource =
          _otpreason === "createagent" ? "agent" : "portal";
        _dashrequest = true;
        break;

      case "ldapportal":
        userquery.realm = { $in: ["member"] };
        _dashrequest = true;
        break;

      default:
        break;
    }

    workflow.on("verifypayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string(),
        usercode: Joi.string(),
        accountnumebr: Joi.string(),
        oldpin: Joi.string(),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      if (_accountlinkunlink && _activateaccount)
        userquery = { isDeleted: false, userCode: _payload.usercode };
      else
        userquery.phoneNumber = utils.formatPhoneNumber(_payload.phonenumber);

      workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      let _userresp = await userExists(userquery);
      if (_userresp.status === 200) {
        _userresp.userdata.primaryAuthentication = Object.keys(
          _valuemapping
        ).find(
          (key) =>
            _valuemapping[key] === _userresp.userdata.primaryAuthentication
        ) as string;
        if (!_userresp.userdata.enabled) {
          if (_otpreason !== "createagent" && !_activateaccount)
            resolve(
              res.status(500).json({
                status: false,
                message:
                  _userresp.userdata.realm === "merchant" &&
                  _userresp.userdata.merchantRole === "agent"
                    ? `Cashier is suspended. 

Please talk to your merchant if this is done by mistake.`
                    : "account locked. please visit your neareset branch to activate your account",
              })
            );
          else workflow.emit("fetchotp", _userresp.userdata);
        } else {
          if (
            _otpreason === "changepin" &&
            utils.localEncryptPassword(String(_payload.oldpin)) !==
              _userresp.userdata.loginPIN
          ) {
            resolve(
              res.status(500).json({
                message:
                  "login PIN mismatch: please provide your current login PIN correclty",
              })
            );
          } else workflow.emit("fetchotp", _userresp.userdata);
        }
      } else {
        resolve(
          res.status(500).json({
            status: false,
            message: "unable to send Verifiction Code: user data not found",
          })
        );
      }
    });

    workflow.on("fetchotp", async (user: IUser) => {
      let otpquery = {
        // phoneNumber: user.phoneNumber,
        otpFor: String(_otpreason).toLowerCase(),
      } as any;

      if (_accountlinkunlink) otpquery.userCode = _payload.usercode;
      else otpquery.phoneNumber = utils.formatPhoneNumber(_payload.phonenumber);

      let _otpresp = await otpExists(otpquery);

      if (_otpresp.status === 200) {
        if (moment().isSameOrBefore(_otpresp.otpdata.expiresAt)) {
          let _timeleft = moment(_otpresp.otpdata.expiresAt).diff(
            moment(),
            "seconds"
          );
          let _waitmessage = `${_timeleft} seconds`;
          // if (_timeleft >= 60) {
          //   const minutes = Math.floor(_timeleft / 60);
          //   _waitmessage = `${minutes} minutes`;
          // } else _waitmessage = `${_timeleft} seconds`;

          resolve(
            res.status(500).json({
              status: false,
              message: `active OTP: please try again in ${_waitmessage}`,
            })
          );
        } else workflow.emit("updateotp", _otpresp.otpdata, user);
      } else workflow.emit("createotp", user);
    });

    /**
     * default otp added for phone number +251991014552
     * APP Store  usage
     * temporary!
     */
    workflow.on("updateotp", async (OTP: IOTP, user: IUser) => {
      const updatedata = {
        expiresAt: moment().add(3, "minutes").toISOString(),
        otpCode: ["+251991014552"].includes(
          user.phoneNumber
        )
          ? utils.localEncryptPassword("000000")
          : utils.localEncryptPassword(String(randomNumber.generateRandom(6))),
        status: "REQUESTED",
        lastModified: moment().toISOString(),
      };

      const otpquery = {
        _id: OTP._id,
      };

      let _otpresp = await otpUpdate(otpquery, updatedata);

      if (_otpresp.status === 200)
        workflow.emit("respond", _otpresp.otpdata, user);
      else
        resolve(
          res
            .status(500)
            .json({ status: false, message: "unable to send Verifiction Code" })
        );
    });

    workflow.on("createotp", async (user: IUser) => {
      const adddata = {
        phoneNumber: user.phoneNumber,
        accountNumber:
          _accountlinkunlink && !_phonechange ? _payload.accountnumber : "",
        userRealm: user.realm,
        userCode: user.userCode,
        otpCode: ["+251991014552"].includes(user.phoneNumber)
          ? utils.localEncryptPassword("000000")
          : utils.localEncryptPassword(String(randomNumber.generateRandom(6))),
        otpFor: String(_otpreason).toLowerCase(),
        // deviceUUID: _deviceuuid
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
        workflow.emit("respond", _otpresp.otpdata, user);
      else
        resolve(
          res
            .status(500)
            .json({ status: false, message: "unable to send Verifiction Code" })
        );
    });

    workflow.on("respond", (OTP: IOTP, user: IUser) => {
      /**
       * send email / sms
       */
      console.log(
        "-=-=-===-=-=-=",
        user.primaryAuthentication,
        "=-=-=-==-=-=-=-=-="
      );
      console.log(
        !_ldapops && ["sms", "both"].includes(user.primaryAuthentication)
      );
      console.log(user.phoneNumber);
      console.log("_ldapops ", _ldapops);

      if (
        // !_ldapops &&
        ["sms", "both"].includes(user.primaryAuthentication) &&
        user.phoneNumber
      ) {
        console.log("sending sms");

        sendSMS(
          utils.localDecryptPassword(String(OTP.otpCode)),
          user.phoneNumber
        );
      }
      if (
        ["email", "both"].includes(user.primaryAuthentication) &&
        user.email
      ) {
        sendEmail(
          utils.localDecryptPassword(String(OTP.otpCode)),
          user.email,
          user.fullName
        );
      }

      let _accesstoken =
        _dashrequest || _agentops
          ? tempTokenMaker(user, ["verify otp"], serverPublicKey)
          : "";

      resolve(
        res.json({
          status: true,
          expireson: OTP.expiresAt,
          senton: OTP.createdAt,
          otpcode: utils.localDecryptPassword(String(OTP.otpCode)),
          accesstoken: _accesstoken,
          rf: serverPublicKey,
        })
      );
    });

    workflow.emit("verifypayload");
  });
}

export async function generateOTP_v2(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("OTP OPS: GENERATE...");

  const serverPublicKey = await getPublicKey();
  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    const _payload = req.body;

    const _otpreason: String | undefined = req.headers.otpfor as String;

    const allowedreasons = [
      'pinset',
      'pinreset'
    ]

    workflow.on("verifypayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string().required()
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      if(allowedreasons.includes(_otpreason as string)) workflow.emit("fetchuser");
      else return res.status(400).json({ message: 'invalid request' });
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        realm: 'member',
        poolSource: 'app',
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        enabled: true,
        isDeleted: false
      }

      let _userresp = await userExists(userquery);
      if (_userresp.status === 200) {
        _userresp.userdata.primaryAuthentication = Object.keys(
          _valuemapping
        ).find(
          (key) =>
            _valuemapping[key] === _userresp.userdata.primaryAuthentication
        ) as string;
          
        workflow.emit("createotp", _userresp.userdata);

      } else {
        resolve(
          res.status(500).json({
            status: false,
            message: "unable to send Verifiction Code: user data not found",
          })
        );
      }
    });

    workflow.on("createotp", async (user: IUser) => {
      const adddata = {
        phoneNumber: user.phoneNumber,
        accountNumber: user.mainAccount || '',
        userRealm: user.realm,
        userCode: user.userCode,
        otpCode: ["+251918627182"].includes(user.phoneNumber)
          ? utils.localEncryptPassword("000000")
          : utils.localEncryptPassword(String(randomNumber.generateRandom(6))),
        otpFor: String(_otpreason).toLowerCase(),
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
        workflow.emit("respond", _otpresp.otpdata, user);
      else
        resolve(
          res
            .status(500)
            .json({ status: false, message: "unable to send Verifiction Code" })
        );
    });

    workflow.on("respond", (OTP: IOTP, user: IUser) => {
      /**
       * send email / sms
       */
      console.log(
        "-=-=-===-=-=-=",
        user.primaryAuthentication,
        "=-=-=-==-=-=-=-=-="
      );
      console.log(["sms", "both"].includes(user.primaryAuthentication));
      console.log(user.phoneNumber);

      if (
        ["sms", "both"].includes(user.primaryAuthentication) &&
        user.phoneNumber
      ) {
        console.log("sending sms");

        sendSMS(
          utils.localDecryptPassword(String(OTP.otpCode)),
          user.phoneNumber
        );
      }
      if (
        ["email", "both"].includes(user.primaryAuthentication) &&
        user.email
      ) {
        sendEmail(
          utils.localDecryptPassword(String(OTP.otpCode)),
          user.email,
          user.fullName
        );
      }

      resolve(
        res.json({
          status: true,
          expireson: OTP.expiresAt,
          senton: OTP.createdAt,
          otpcode: ['dev', 'uat'].includes(String(process.env.NODE_ENV)) ? utils.localDecryptPassword(String(OTP.otpCode)) : '',
          rf: serverPublicKey
        })
      );
    });

    workflow.emit("verifypayload");
  });
}

export async function verifyOTP(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("OTP OPS: VERIFY...");

  const _sourceapp: String | undefined = req.headers.sourceapp as String;
  const serverPublicKey = await getPublicKey();

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    const _payload = req.body;

    const _sourceapp: String | undefined = req.headers.sourceapp as String;
    const _otpreason: String | undefined = req.headers.otpfor as String;

    let userquery: {
      realm?: Object;
      poolSource?: String;
      phoneNumber?: String;
      isDeleted: boolean;
      userCode?: String;
      merchantRole?: String;
    } = {
      isDeleted: false,
      phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
    } as any;

    let _apprequest = false;
    let _dashrequest = false;
    let _agentops = false;

    switch (_sourceapp) {
      case "memberapp":
        userquery.realm = { $in: ["member"] };
        userquery.poolSource = "app";
        _apprequest = true;
        break;

      case "agentapp":
        userquery.realm = { $in: ["merchant"] };
        userquery.poolSource = "agent";
        _apprequest = true;
        _agentops = _otpreason === "createagent" ? true : false;
        break;

      case "agentportal":
        userquery.realm = { $in: ["merchant"] };
        userquery.poolSource = "agent";
        if (_otpreason === "login") userquery.merchantRole = "owner";
        _dashrequest = true;
        break;

      case "dashportal":
        userquery.realm = { $in: ["elst", "bank", "merchant"] };
        userquery.poolSource =
          _otpreason === "createagent" ? "agent" : "portal";
        _dashrequest = true;
        break;

      case "ldapportal":
        userquery.realm = { $in: ["member"] };
        _dashrequest = true;
        break;

      default:
        break;
    }

    workflow.on("verifypayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string().required(),
        otpcode: Joi.number().required(),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      console.log("fetching user -- ", userquery);

      let _userresp = await userExists(userquery);
      console.log("user resp -- ", _userresp);
      if (_userresp.status === 200) {
        workflow.emit("fetchotp", _userresp.userdata);
      } else {
        resolve(
          res.status(500).json({
            status: false,
            message: "unable to confirm Verifiction Code: user data not found",
          })
        );
      }
    });

    workflow.on("fetchotp", async (user: IUser) => {
      const otpquery = {
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        otpFor: String(_otpreason).toLowerCase(),
      };

      let _otptresp = await otpExists(otpquery);
      if (_otptresp.status === 200) {
        const OTP = _otptresp.otpdata as IOTP;

        if (String(OTP.status).toLowerCase() === "confirmed") {
          logger.logAXIOS(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "confirmed Verification Code",
            })}`,
            "error"
          );
          logger.error(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "confirmed Verification Code",
            })}`
          );
          resolve(
            res
              .status(500)
              .json({ status: false, message: `confirmed Verification Code` })
          );
        } else if (moment().isAfter(OTP.expiresAt)) {
          logger.logAXIOS(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "expired Verification Code",
            })}`,
            "error"
          );
          logger.error(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "expired Verification Code",
            })}`
          );
          resolve(
            res
              .status(500)
              .json({ status: false, message: `expired Verification Code` })
          );
        } else if (
          String(OTP.otpCode) !==
          utils.localEncryptPassword(String(_payload.otpcode))
        ) {
          logger.logAXIOS(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "incorrect Verification Code",
            })}`,
            "error"
          );
          logger.error(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "incorrect Verification Code",
            })}`
          );
          resolve(
            res
              .status(500)
              .json({ status: false, message: `incorrect Verification Code` })
          );
        } else workflow.emit("removeotp", OTP, user);
      } else {
        logger.logAXIOS(
          `Response sent [otp service]: ${JSON.stringify({
            phonenumber: _payload.phonenumber,
            message: "failed to verify: OTP data not found",
          })}`,
          "error"
        );
        logger.error(
          `Response sent [otp service]: ${JSON.stringify({
            phonenumber: _payload.phonenumber,
            message: "failed to verify: OTP data not found",
          })}`
        );
        resolve(
          res.status(500).json({
            status: false,
            message: `failed to verify: invalid request`,
          })
        );
      }
    });

    workflow.on("removeotp", async (OTP: IOTP, user: IUser) => {
      const otpquery = {
        // phoneNumber: user.phoneNumber,
        // otpFor: {$in: ['pinset', 'pinreset']}
        _id: OTP._id,
      };

      let _otpresp = await otpRemove(otpquery);

      if (_otpresp.status === 200)
        console.log("successfully removed confirmed otps on app pinops");
      else console.log("remove otp failed on app pinops");
      console.log("dash req ", _dashrequest);
      console.log("agent req ", _agentops);

      if (_dashrequest || _agentops) workflow.emit("updateuser", user);
      else workflow.emit("respond", user);
    });

    workflow.on("updateuser", async (user: IUser) => {
      console.log("update user - - - - ");

      let updatedata = {
        OTPStatus: "verified",
        OTPLastTriedAt: moment.utc().toISOString(),
        OPTLastVerifiedAt: moment.utc().toISOString(),
        OTPVerifyCount: 0,
        lastModified: moment().toISOString(),
      } as any;

      if (_otpreason === "pinreset")
        updatedata = {
          ...updatedata,
          loginPIN: "",
        };

      const userquery = {
        _id: user._id,
      };
      console.log("user query ", userquery);

      let _userresp = await updateUser(userquery, updatedata);
      console.log("user resp ", _userresp);

      if (_userresp.status === 200)
        workflow.emit("respond", _userresp.userdata);
      else
        resolve(
          res
            .status(500)
            .json({ status: false, message: "unable to send Verifiction Code" })
        );
    });

    workflow.on("respond", (user: IUser) => {
      console.log("response - - - -");
      console.log("servier key ", serverPublicKey);

      let _accesstoken = "";
      _accesstoken = tempTokenMaker(
        user,
        _dashrequest
          ? ["set pin", "pin login"]
          : ["set pin", "reset pin", "change pin"],
        serverPublicKey
      );
      console.log("access toekn ", _accesstoken);

      logger.logAXIOS(
        `Response sent [otp service]: ${JSON.stringify({
          phonenumber: _payload.phonenumber,
          message: "OTP confirmed",
        })}`,
        "info"
      );
      logger.info(
        `Response sent [otp service]: ${JSON.stringify({
          phonenumber: _payload.phonenumber,
          message: "OTP confirmed",
        })}`
      );

      resolve(
        res.json({
          status: true,
          pinset: !user.loginPIN || user.loginPIN === "" ? false : true,
          accesstoken: _accesstoken,
        })
      );
    });

    workflow.emit("verifypayload");
  });
}
export async function verifyOTP_v2(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("OTP OPS: VERIFY...");

  const serverPublicKey = await getPublicKey();

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    const _payload = req.body;

    const _otpreason: String | undefined = req.headers.otpfor as String;  
    const _installationdate: String | undefined = req.headers.installationdate as String;

    workflow.on("verifypayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string().required(),
        otpcode: Joi.number().required()
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      if(_otpreason === 'pinreset' && (!_installationdate || _installationdate === '')) {
        return res.status(400).json({ message: 'missing requirement: invalid request' });
      } else workflow.emit("fetchuser");
    });

    workflow.on("fetchuser", async () => {
      let userquery = {
        realm: 'member',
        poolSource: 'app',
        enabled: true,
        isDeleted: false,
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
      }

      let _userresp = await userExists(userquery);
      if (_userresp.status === 200) {
        workflow.emit("fetchotp", _userresp.userdata);
      } else {
        resolve(
          res.status(500).json({
            status: false,
            message: "unable to confirm Verifiction Code: user data not found",
          })
        );
      }
    });

    workflow.on("fetchotp", async (user: IUser) => {
      const otpquery = {
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        otpFor: String(_otpreason).toLowerCase(),
      };

      let _otptresp = await otpExists(otpquery);
      if (_otptresp.status === 200) {
        const OTP = _otptresp.otpdata as IOTP;

        if (String(OTP.status).toLowerCase() === "confirmed") {
          logger.logAXIOS(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "confirmed Verification Code",
            })}`,
            "error"
          );
          logger.error(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "confirmed Verification Code",
            })}`
          );
          resolve(
            res
              .status(500)
              .json({ status: false, message: `confirmed Verification Code` })
          );
        } else if (moment().isAfter(OTP.expiresAt)) {
          logger.logAXIOS(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "expired Verification Code",
            })}`,
            "error"
          );
          logger.error(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "expired Verification Code",
            })}`
          );
          resolve(
            res
              .status(500)
              .json({ status: false, message: `expired Verification Code` })
          );
        } else if (
          String(OTP.otpCode) !==
          utils.localEncryptPassword(String(_payload.otpcode))
        ) {
          logger.logAXIOS(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "incorrect Verification Code",
            })}`,
            "error"
          );
          logger.error(
            `Response sent [otp service]: ${JSON.stringify({
              phonenumber: _payload.phonenumber,
              message: "incorrect Verification Code",
            })}`
          );

          if(user.OTPVerifyCount >= 3) {
            let __now = moment.utc();
            const _nexttryat = moment.utc(user.OTPLastTriedAt).add(2, "minutes")
            const _waitingtime = moment.utc(_nexttryat).diff(moment.utc(__now), "s")
            
            if(_waitingtime > 0) return res.status(429).json({ status: false, message: `too many wrong attempts: try again in ${_waitingtime} seconds` });
            else workflow.emit("removeotp", OTP, user); 
          } else workflow.emit("updateuser", OTP, user);
        } else workflow.emit("removeotp", OTP, user);
      } else {
        logger.logAXIOS(
          `Response sent [otp service]: ${JSON.stringify({
            phonenumber: _payload.phonenumber,
            message: "failed to verify: OTP data not found",
          })}`,
          "error"
        );
        logger.error(
          `Response sent [otp service]: ${JSON.stringify({
            phonenumber: _payload.phonenumber,
            message: "failed to verify: OTP data not found",
          })}`
        );
        resolve(
          res.status(500).json({
            status: false,
            message: `failed to verify: invalid request`,
          })
        );
      }
    });

    workflow.on("removeotp", async (OTP: IOTP, user: IUser) => {
      const otpquery = {
        _id: OTP._id
      };

      let _otpresp = await otpRemove(otpquery);

      if (_otpresp.status === 200)
        console.log("successfully removed confirmed otps on app pinops");
      else console.log("remove otp failed on app pinops");

      if(_otpreason === 'pinreset') await _AUTHCONTROLLER.unlinkDevice(user, Number(_installationdate))
      workflow.emit("respond", user);
    });

    workflow.on("updateuser", async (user: IUser) => {
      let updatedata = {
        OTPStatus: "failed",
        OTPLastTriedAt: moment.utc().toISOString(),
        OPTLastVerifiedAt: moment.utc().toISOString(),
        OTPVerifyCount: 0,
        lastModified: moment.utc().toISOString(),
      } as any;

      const userquery = {
        _id: user._id,
      };

      let _userresp = await updateUser(userquery, updatedata);

      if (_userresp.status === 200)
        workflow.emit("respond", _userresp.userdata);
      else
        resolve(
          res
            .status(400)
            .json({ status: false, message: "incorrect confirmation code. please try again" })
        );
    });

    workflow.on("respond", (user: IUser) => {
      let _accesstoken = "";
      _accesstoken = tempTokenMaker(
        user,
        ["set pin", "change pin"],
        serverPublicKey
      );

      logger.logAXIOS(
        `Response sent [otp service]: ${JSON.stringify({
          phonenumber: _payload.phonenumber,
          message: "OTP confirmed",
        })}`,
        "info"
      );
      logger.info(
        `Response sent [otp service]: ${JSON.stringify({
          phonenumber: _payload.phonenumber,
          message: "OTP confirmed",
        })}`
      );

      resolve(
        res.json({
          status: true,
          pinset: !user.loginPIN || user.loginPIN === "" ? false : true,
          accesstoken: _accesstoken,
        })
      );
    });

    workflow.emit("verifypayload");
  });
}

export async function generatePreOTP(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("PRE OTP OPS: GENERATE...");

  const _sourceapp: String | undefined = req.headers.sourceapp as String;
  const _reqpath: String = req.path;
  const _fromvirtual = req.path.includes('virtual')

  const serverPublicKey = await getPublicKey();
  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    const _payload = req.body;

    const _sourceapp: String | undefined = req.headers.sourceapp as String;
    const _otpreason: String | undefined = req.headers.otpfor as String;
    const _deviceuuid: String | undefined = req.headers.deviceuuid as String;

    let _customername = "" as string;

    const _ldapops = ["presignup"];

    workflow.on("verifypayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string(),
        accountnumber: Joi.string().optional().allow('')
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      if(_fromvirtual) workflow.emit("memberexists", null);
      else workflow.emit("accountlookup");
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
        if (_account && _account.data.statusCode === 200)
          workflow.emit("memberexists", _account.data.data);
        else
          resolve(
            res.status(400).json({ status: 400, message: "account not found" })
          );
        // }
      } catch (error) {
        resolve(
          res.status(500).json({
            status: 500,
            message: error?.response.data.message || "account does not exists",
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

      if(!_fromvirtual) memberquery.$or.push({ customerNumber: _account.customer_number })

      let _memberresp = await userExists(memberquery);
      if (_memberresp.status === 200) {
        resolve(
          res.status(400).json({
            status: 400,
            message:
              "member already exists: please use a different phone number, account number, or device",
          })
        );
      } else {
        if(!_fromvirtual) _customername = _account.customer_name;
        workflow.emit("fetchotp");
      }
    });

    workflow.on("fetchotp", async () => {
      let otpquery = {
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        otpFor: String(_otpreason).toLowerCase(),
      } as any;

      let _otpresp = await otpExists(otpquery);

      if (_otpresp.status === 200) {
        if (moment().isSameOrBefore(_otpresp.otpdata.expiresAt)) {
          let _timeleft = moment(_otpresp.otpdata.expiresAt).diff(
            moment(),
            "seconds"
          );
          let _waitmessage = `${_timeleft} seconds`;
          // if (_timeleft >= 60) {
          //   const minutes = Math.floor(_timeleft / 60);
          //   _waitmessage = `${minutes} minutes`;
          // } else _waitmessage = `${_timeleft} seconds`;

          resolve(
            res.status(500).json({
              status: false,
              message: `active OTP: please try again in ${_waitmessage}`,
            })
          );
        } else workflow.emit("updateotp", _otpresp.otpdata);
      } else workflow.emit("createotp");
    });

    workflow.on("updateotp", async (OTP: IOTP) => {
      const updatedata = {
        expiresAt: moment().add(3, "minutes").toISOString(),
        otpCode: utils.localEncryptPassword(String(randomNumber.generateRandom(6))),
        status: "REQUESTED",
        lastModified: moment().toISOString(),
      };

      const otpquery = {
        _id: OTP._id,
      };

      let _otpresp = await otpUpdate(otpquery, updatedata);

      if (_otpresp.status === 200) workflow.emit("respond", _otpresp.otpdata);
      else
        resolve(
          res
            .status(500)
            .json({ status: false, message: "unable to send Verifiction Code" })
        );
    });

    workflow.on("createotp", async () => {
      let adddata = {
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        // accountNumber: _payload.accountnumber,
        userRealm: _sourceapp === "memberapp" ? "member" : "",
        otpCode: utils.localEncryptPassword(String(randomNumber.generateRandom(6))),
        otpFor: String(_otpreason).toLowerCase(),
        deviceUUID: _deviceuuid,
        expiresAt: moment()
          .add(global._CONFIG._VALS._OTP_SESSIONTIMEOUT, "minutes")
          .toISOString(),
        enabled: true,
        status: "REQUESTED",
        createdAt: moment().toISOString(),
        lastModified: moment().toISOString(),
      } as any

      if(!_fromvirtual) adddata.accountNumber = _payload.accountnumber

      let _otpresp = await otpAdd(adddata);

      if (_otpresp.status === 201) workflow.emit("respond", _otpresp.otpdata);
      else
        resolve(
          res
            .status(500)
            .json({ status: false, message: "unable to send Verifiction Code" })
        );
    });

    workflow.on("respond", (OTP: IOTP) => {
      sendSMS(utils.localDecryptPassword(String(OTP.otpCode)), OTP.phoneNumber);
      // sendEMAIL(['eyuel@eaglelionsystems.com'],utils.localDecryptPassword(String(OTP.otpCode)), _customername, 'verification');

      const _tempuser = {
        userid: "",
        usercode: "",
        fullname: "",
        phonenumber: OTP.phoneNumber,
        userrealm: OTP.userRealm,
        deviceuuid: _deviceuuid,
      };

      let _accesstoken = tempTokenMaker(
        _tempuser,
        ["verify otp"],
        serverPublicKey
      );

      resolve(
        res.json({
          status: true,
          expireson: OTP.expiresAt,
          senton: OTP.createdAt,
          otpcode: utils.localDecryptPassword(String(OTP.otpCode)),
          accesstoken: _accesstoken,
        })
      );
    });

    workflow.emit("verifypayload");
  });
}

export async function confirmPreOTP(
  req: Request,
  res: Response
): Promise<Response> {
  console.log("PRE OTP OPS: VERIFY...");

  return await new Promise((resolve) => {
    const workflow = new EventEmitter();

    const _payload = req.body;
    const _fromvirtual = req.path.includes('virtual');

    const _sourceapp: String | undefined = req.headers.sourceapp as String;
    const _otpreason: String | undefined = req.headers.otpfor as String;
    const _deviceuuid: String | undefined = req.headers.deviceuuid as String;

    workflow.on("verifypayload", () => {
      const schema = Joi.object({
        phonenumber: Joi.string().required(),
        accountnumber: Joi.string().optional().allow(''),
        // gender: Joi.string().required(),
        otpcode: Joi.string().required(),
        fullname: Joi.string().optional().allow(''),
      });

      const { error } = schema.validate(_payload);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      workflow.emit("fetchotp");
    });

    workflow.on("fetchotp", async () => {
      let otpquery = {
        phoneNumber: utils.formatPhoneNumber(_payload.phonenumber),
        // accountNumber: _payload.accountnumber,
        deviceUUID: _deviceuuid,
        otpFor: String(_otpreason).toLowerCase()
      } as any

      if(!_fromvirtual) otpquery.accountNumber = _payload.accountnumber

      let _otpresp = await otpExists(otpquery);
      if (_otpresp.status === 200) {
        const OTP = _otpresp.otpdata as IOTP;

        if (String(OTP.status).toLowerCase() === "confirmed")
          resolve(
            res
              .status(500)
              .json({ status: false, message: `confirmed Verification Code` })
          );
        else if (moment().isAfter(OTP.expiresAt))
          resolve(
            res
              .status(500)
              .json({ status: false, message: `expired Verification Code` })
          );
        else if (
          String(OTP.otpCode) !==
          utils.localEncryptPassword(String(_payload.otpcode))
        )
          resolve(
            res
              .status(500)
              .json({ status: false, message: `incorrect Verification Code` })
          );
        else {
          workflow.emit("signupcall");
          workflow.emit("removeotp", OTP);
        }
      } else
        resolve(
          res.status(500).json({
            status: false,
            // message: "restriction: account logged in on another device or invalid request"
            message: `failed to verify: invalid request`,
          })
        );
    });

    workflow.on("signupcall", () => {
      delete req.body.otpcode;
      console.log("==== this data to signup: ", req.body);
      return memberSelfSignup(req, res);
    });

    workflow.on("removeotp", async (OTP: IOTP) => {
      const otpquery = {
        _id: OTP._id,
      };

      let _otpresp = await otpRemove(otpquery);

      if (_otpresp.status === 200)
        console.log("successfully removed confirmed otps on app pinops");
      else console.log("remove otp failed on app pinops");
    });

    workflow.emit("verifypayload");
  });
}

export default {
  generateOTP,
  generateOTP_v2,
  verifyOTP,
  verifyOTP_v2,
  generatePreOTP,
  confirmPreOTP,
};
