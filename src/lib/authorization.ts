// Load Module Dependencies

import { type Request, type Response, type NextFunction } from "express";
import moment from "moment";
// import checksession from "./sessionhandler";

interface User {
  _id: string;
  fullName: string;
  role: string;
  userCode: string;
  organizationID: string;
  phoneNumber: string;
  email: string;
  permissions: string[];
  realm: string;
  isMaker: boolean;
  isChecker: boolean;
  sessionExpiresOn: string;
  deviceUUID: string;
}

function authorization(
  realms: string[],
  permissions: string[],
  userrole?: string[]
) {
  // console.log("authorization =====>", realms, permissions, userrole);
  return async function middleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    console.log("authorization =====>", (req as any)._user );
    if ((req as any)._user == null) {
      res.status(401);
      res.json({
        status: 401,
        type: "AUTHORIZATION_ERROR",
        message: "Missing Authenticated User",
      });
      return;
    }

    const user: User = (req as any)._user;

    const _PERMISSIONS: string[] = user.permissions;

    let realmFound = false;
    let isAuthorized = false;

    console.log("user realm ==>>>: ", user.realm);

    // realms.forEach(function (realm) {
    //   if (realm === "*" || user.realm === realm) {
    //     realmFound = true;
    //   }
    // });

    if (user.realm === "portal") {
      realmFound = true;
    }

    console.log("user permissions ==>>>: ", _PERMISSIONS);
    let permissionFound = permissions.some((userpermission) =>
      _PERMISSIONS.includes(userpermission)
    );
    if (permissions.includes("*")) permissionFound = true;
    let bankfound = false;

    if (user.realm === "bank") {
      if (!userrole) bankfound = false;

      if (userrole?.includes(user.role)) bankfound = true;
    } else bankfound = true;

    if (realmFound  && permissionFound) isAuthorized = true;
    //if (true) isAuthorized = true;

    console.log(user.realm, realms);
    console.log(
      "realm found: ",
      realmFound,
      "permission Found: ",
      permissionFound
    );
    if (!isAuthorized) {
      res.status(400);
      res.json({
        status: 400,
        type: "AUTHORIZATION_ERROR",
        message: "Action Not Allowed",
      });
    } else {
      next();
      // checksession(req, res, next);
      // console.log('==>', user.sessionExpiresOn, moment().isAfter(moment(user.sessionExpiresOn)))
      // if ((user.sessionExpiresOn == null) || moment().isAfter(moment(user.sessionExpiresOn))) {
      //   // console.log(user.sessionExpiresOn)
      //   if (user.sessionExpiresOn == null) {
      //     console.log('... user session timeout not found')

      //     res
      //       .status(403)
      //       .json({
      //         message: 'expired session'
      //       })

      //     // userSession(req, user)

      //     // next();
      //   } else {
      //     console.log('    ... user session timeout expired')

      //     res
      //       .status(403)
      //       .json({
      //         message: 'session expired'
      //       })
      //   }
      // } else {
      //   console.log('    ... user session active')

      //   // await userSession(req, user)

      //   next()
      // }

      // next();
    }
  };
}

export default authorization;
