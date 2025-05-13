import jwt from "jsonwebtoken";
import initConfig from "../config/index";

export const generateResetToken = async(pin: string, reset: string) => {
  const _CONFIG = await initConfig();
  const secretKey = _CONFIG._VALS._JWTSECRET || 'secreat key';
  const payload = { pin, reset: reset ? reset : '' };
 // const options = { expiresIn: "1m" };
 const options: jwt.SignOptions = { expiresIn: '1m' };
  return jwt.sign(payload, secretKey, options);
};

export const generateLoginToken = async(pin: string, login: string, expiresIn?: any) => {
  const _CONFIG = await initConfig();
  const secretKey = _CONFIG._VALS._JWTSECRET;
  const payload = { pin, login: login ? login : "" };
  const options = { expiresIn: expiresIn ? expiresIn : "1m" };

  return jwt.sign(payload, secretKey, options);
};

export const generateRandom4DigitNumber = (): number => {
  return Math.floor(Math.random() * 900000) + 100000;
};

export const validateResetToken = async (
  resetToken: string
): Promise<boolean> => {
  const _CONFIG = await initConfig();
  const secretKey = _CONFIG._VALS._JWTSECRET;

  if (!resetToken) {
    console.error("Error validating reset token: JWT must be provided");
    return false;
  }

  console.log("Validating token:", resetToken); // Log the token

  try {
    const decoded: any = jwt.verify(resetToken, secretKey);

    if (decoded && decoded.pin) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error validating reset token:", error);
    return false;
  }
};
