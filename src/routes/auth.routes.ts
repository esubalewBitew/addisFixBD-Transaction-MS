/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from "express";
import { healthCheck, login } from "../controller/auth.controller";
// import authController from "../../controller/auth.controller";
// import authorization from "../../lib/authorization";
// import authorizedevice from "../../lib/authorizeddevice";
//import logcontroller from "../../controller/servelogs.controller";
// import decryptAndVerifyPayload from "../../lib/decryptPayload";
// import verifyApproovToken from "../../lib/verify_approovToken";

// import { rateLimiter } from "../../lib/rateLimiter";

const router = Router();

// router.get("/logfiles", logcontroller.listFiles);
// router.get("/servelog/:fileName", logcontroller.serveLogFile);

router.get(
  "/healthcheck",
  healthCheck
);

router.post(
  "/login",
  login
);

// router.get(
//   "/devicecheck",
//   // rateLimiter,
//   verifyApproovToken(),
//   authController.deviceLookUP
// );

// router.get(
//   "/phonenumbercheck",
//   verifyApproovToken(),
//   // rateLimiter,
//   authController.phoneNumberLookUP
// );
// router.post(
//   "/phonenumbercheck_v2",
//   // rateLimiter,
//   verifyApproovToken(),
//   decryptAndVerifyPayload(),
//   authController.phoneNumberLookUP
// );
// router.post("/merechant/phonenumbercheck_v2", authController.phoneNumberLookUP);

// router.get(
//   "/app/prepinops",
//   // rateLimiter,
//   verifyApproovToken(),
//   authController.PINSetReSetOTPCheck
// );
// router.post(
//   "/app/prepinops_v2",
//   // rateLimiter,
//   verifyApproovToken(),
//   decryptAndVerifyPayload(),
//   authController.PINSetReSetOTPCheck
// );

// router.post(
//   "/signup/selfmember",
//   // rateLimiter,
//   verifyApproovToken(),
//   decryptAndVerifyPayload(),
//   authController.memberSelfSignupV2
// );

// router.post(
//   "/signup/user",
//   authorization(["*"], ["register user"]),
//   decryptAndVerifyPayload(),
//   authController.userRegister
// );

// router.post(
//   "/app/pinops/merchant/setpin",
//   verifyApproovToken(),
//   authorization(["member", "merchant"], ["set pin"]),
//   decryptAndVerifyPayload(),
//   authController.setLoginPIN
// );
// router.post(
//   "/app/pinops/setpin",
//   verifyApproovToken(),
//   authorization(["member", "merchant"], ["set pin"]),
//   decryptAndVerifyPayload(),
//   authController.setLoginPIN
// );
// router.post(
//   "/dash/pinops/setpin",
//   authorization(["elst", "bank", "merchant"], ["set pin"]),
//   authController.setLoginPIN
// );
// router.post(
//   "/dash/merchant/pinops/setpin",
//   decryptAndVerifyPayload(),
//   authorization(["elst", "bank", "merchant"], ["set pin"]),
//   authController.setLoginPIN
// );

// router.post(
//   "/dash/merchant/pinops/changepin",
//   decryptAndVerifyPayload(),
//   authorization(["member", "merchant"], ["change pin"]),
//   authController.changePIN
// );
// router.post(
//   "/app/pinops/merchant/changepin",
//   authorization(["member", "merchant"], ["change pin"]),
//   authorizedevice(),
//   decryptAndVerifyPayload(),
//   authController.changePIN
// );
// router.post(
//   "/app/pinops/forgotpin",
//   authorization(["merchant"], ["change pin"]),
//   authorizedevice(),
//   decryptAndVerifyPayload(),
//   authController.forgotPIN
// );
// router.post(
//   "/app/pinops/changepin",
//   verifyApproovToken(),
//   authorization(["member", "merchant"], ["change pin"]),
//   authorizedevice(),
//   decryptAndVerifyPayload(),
//   authController.changePIN
// );
// router.post(
//   "/app/pinops/checkpin",
//   verifyApproovToken(),
//   authorization(["member"], ["change pin", "set pin"]),
//   decryptAndVerifyPayload(),
//   authController.checkPINStrength
// );

// router.post(
//   "/dash/pinops/changepin",
//   authorization(["elst", "bank", "merchant"], ["change pin"]),
//   authController.changePIN
// );
// router.post(
//   "/dash/pinops/forgotpin",
//   authorization(["merchant"], ["change pin"]),
//   authController.forgotPIN
// );

// router.post(
//   "/dash/pinops/pinlogin",
//   authorization(["elst", "bank", "merchant"], ["pin login"]),
//   authController.pinLogin
// );
// router.post(
//   "/dash/merchant/pinops/pinlogin",
//   decryptAndVerifyPayload(),
//   authorization(["elst", "bank", "merchant"], ["pin login"]),
//   authController.pinLogin
// );
// router.post(
//   "/app/pinops/merchant/pinlogin",
//   verifyApproovToken(),
//   authorization(["merchant"], ["pin login"]),
//   decryptAndVerifyPayload(),
//   authController.pinLogin
// );
// router.post(
//   "/app/pinops/pinlogin",
//   verifyApproovToken(),
//   decryptAndVerifyPayload(),
//   authController.pinLogin
// );

// router.delete(
//   "/app/unsubscribe",
//   verifyApproovToken(),
//   authorization(["member", "merchant"], ["unlink device"]),
//   authorizedevice(),
//   authController.removeDeviceTokenization
// );

// router.post(
//   "/app/pinops/logout",
//   verifyApproovToken(),
//   authorization(["member", "merchant"], ["logout account"]),
//   authorizedevice(),
//   decryptAndVerifyPayload(),
//   authController.signout
// );
// router.post(
//   "/dash/pinops/logout",
//   authorization(["elst", "bank", "merchant"], ["logout account"]),
//   authController.signout
// );

// router.post(
//   "/pinops/verifypin",
//   verifyApproovToken(),
//   authorization(["member"], ["verify pin"]),
//   authorizedevice(),
//   decryptAndVerifyPayload(),
//   authController.verifyPIN
// );

export default router;
