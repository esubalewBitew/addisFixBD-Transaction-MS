// Load Module Dependencies
import { unless } from "express-unless";
import { type NextFunction, type Request, type Response } from "express";

import jwt from "jsonwebtoken";

import utils from "../lib/utils";

//import { debugging_logger_v2 } from "./debug_logger";
import zlib from "zlib";
import util from "util";
//import { checksession } from "./sessionhandler";
const inflate = util.promisify(zlib.inflate);

export default function authenticate(): {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
  unless: any;
} {
  // console.log("req._user ===>>><<<>>>", (req as any)._user);

  const Authmiddleware = async function middleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authorization = req.get("Authorization");
    const _JWTSECRET = global?._CONFIG?._VALS?._JWTSECRET || "addisfix";
    const _REFRESHSECRET = global?._CONFIG?._VALS?._REFRESHSECRET || "addisfix";

    /**
     * ONBOARDING APP FILER
     */
    const _onboardingapp = req.headers["x-onboarding-app"];

    if (authorization === undefined) {
      res.status(401).json({ error: "Use the Right Authentication" });
    } else if (_onboardingapp) {
      res.status(401).json({ error: "discontinued app access" });
    } else {
      const [scheme, token] = authorization.split(" ");

      if (scheme.toLowerCase() !== "bearer" || !token) {
        res
          .status(401)
          .json({ error: "Unauthorized: Invalid Bearer token format" });
      } else {
        try {
          const secretKey = _JWTSECRET;

          let verifytoken: any = jwt.verify(token, secretKey);
          // debugging_logger_v2(["verifytoken: ", verifytoken]);
          // debugging_logger_v2(["verifytoken.data: ", verifytoken.data]);
          // debugging_logger_v2([
          //   "utils.localDecryptPassword(verifytoken.data): ",
          //   utils.localDecryptPassword(verifytoken.data),
          // ]);
          let _tokenvals;
          // let _permissions: string[] = [];

          const pathtoignore = [
            "otp/dash/confirm/dashops",
            "otp/app/confirm/agentops",
            "otp/app/confirm/pinops",
            "otp/app/confirm/presignup",
            "auth/app/pinops/setpin",
            "auth/app/pinops/checkpin",
            "auth/dash/pinops/pinlogin",
            "auth/dash/pinops/changepin",
          ] as string[];
          if (
            pathtoignore.includes(
              String(req.path).split("/v1.0/chatbirrapi/")[1]
            )
          ) {
            console.log(" * * * * * * * * temp token * * * * * * * *");

            _tokenvals = JSON.parse(
              utils.localDecryptPassword(verifytoken.data)
            );
           // debugging_logger_v2(["_tokenvals temp: ", _tokenvals]);
            // _tokenvals.userpermissions?.map((_permission: string) => {
            //   _permissions.push(_permission);
            // });
            // console.log('"permissions: ", _permissions);', _permissions);
            // _permissions = _tokenvals.permissions as string[];
            // debugging_logger_v2(["permissions: ", _permissions]);

            (req as any)._ignore = true;
          } else {
            console.log(" * * * * * * * * token * * * * * * * *");
            _tokenvals = utils.localDecryptPassword(verifytoken.data);
            //debugging_logger_v2(["_tokenvals: ", _tokenvals]);
            let compressedBuffer = Buffer.from(_tokenvals, "base64");
            // debugging_logger_v2([
            //   "compressedBuffer: ",
            //   compressedBuffer.toString("utf-8"),
            // ]);
            let decompressedBuffer = await inflate(compressedBuffer);

            let decompressedString = decompressedBuffer.toString();
            //debugging_logger_v2(["decompressedString: ", decompressedString]);
            _tokenvals = JSON.parse(decompressedString);
            // _permissions = _tokenvals.permissions as string[];

           // debugging_logger_v2(["_tokenvals: ", _tokenvals]);
          }
          //debugging_logger_v2(["user _tokenvals: ", _tokenvals]);
          (req as any)._user = {
            _id: _tokenvals.userid,
            fullName: _tokenvals.fullname,
            phoneNumber: _tokenvals.phonenumber,
            otpfor: _tokenvals.otpfor ?? "",
            email: _tokenvals.useremail ?? "",
            realm: _tokenvals.userrealm,
            role: _tokenvals.userrole,
            userCode: _tokenvals.usercode,
            organizationID: _tokenvals.organizationid,
            primaryAuthentication: _tokenvals.primaryauth,
            permissions: _tokenvals.permissions,
            department: _tokenvals?.department,
            ifbmember: _tokenvals.ifbmember,
            isMaker: _tokenvals.makersuser,
            isChecker: _tokenvals.checkeruser,
            CAPLimit: _tokenvals.caplimit,
            sessionExpiresOn: _tokenvals.sessionexpiry,
            deviceUUID: _tokenvals.deviceuuid,
            publicKey: _tokenvals.publicKey,
          };
          //await checksession(_tokenvals, verifytoken.exp)(req, res, next);
        } catch (error:any) {
          console.log("error in authentication ===>>><<<>>>", error.message);

          res.status(403);
          res.json({
            status: 403,
            type: "AUTHENTICATION_ERROR",
            message: "Use the Right Authentication",
          });
        }
      }
    }
    // }
  };
  Authmiddleware.unless = unless;
  return Authmiddleware;
}
