import dotenv from "dotenv";
dotenv.config();

import { TopLevelConfig, Vals } from "./types/config";
import path from "path";

const getConfig = (): TopLevelConfig => ({
  MONGODB_URL:
    process.env.MONGODB_URL_PROD || "mongodb://localhost:27017/AddisFix_Db",

  _VALS: {
    SMSSender: process.env.SMS_SENDER || "AddisFix",

    _SESSIONTIMEOUT: Number(process.env.SESSION_TIMEOUT) || 30,
    _TEMPSESSIONTIMEOUT: Number(process.env.TEMP_SESSION_TIMEOUT) || 5,
    _OTP_SESSIONTIMEOUT: Number(process.env.OTP_SESSION_TIMEOUT) || 5,
    _OTPEXPIRY: Number(process.env.OTP_EXPIRY) || 5,
    PINEXPIRYDATE: Number(process.env.PIN_EXPIRY_DATE) || 90,

    docDBCONNString: process.env.DOC_DB_CONN_STRING || "",
    docDBNAME: process.env.DOC_DB_NAME || "",
    secret: process.env.SECRET || "your-secret-key",

    PWDSecretKey: process.env.PWD_SECRET_KEY || "your-pwd-secret-key",
    PWDiv: process.env.PWD_IV || "your-pwd-iv",

    _JWTSECRET: process.env.JWT_SECRET || "your-jwt-secret",
    _JWTEXPIREY: Number(process.env.JWT_EXPIRY) || 60,
    _REFRESHSECRET: process.env.REFRESH_SECRET || "your-refresh-secret",
    _REFRESHEXPIREY: Number(process.env.REFRESH_EXPIRY) || 1440,

    DASH_JWTEXPIREY: Number(process.env.DASH_JWT_EXPIRY) || 60,
    APP_JWTEXPIREY: Number(process.env.APP_JWT_EXPIRY) || 60,
    APP_SESSIONEXPIREY: Number(process.env.APP_SESSION_EXPIRY) || 30,
    DASH_SESSIONEXPIREY: Number(process.env.DASH_SESSION_EXPIRY) || 30,
    SESSION_THRESHOLD: Number(process.env.SESSION_THRESHOLD) || 5,
    SESSION_IDLETIME: Number(process.env.SESSION_IDLE_TIME) || 5,

    KAFKA_ADDRESS: process.env.KAFKA_ADDRESS,

    resourcePath: path.resolve(__dirname, "..", "..", "..", "_resources"),
    baseURL: process.env.BASE_URL || "http://localhost:3006",
    PORT: Number(process.env.PORT) || 3006,
    PORT_AUTH: Number(process.env.PORT_AUTH) || 3006,

    appId: process.env.APP_ID || "addisfix",
    bankEmail: process.env.BANK_EMAIL || "bank@addisfix.com",
    complyCube_ApiKey: process.env.COMPLY_CUBE_API_KEY || "",

    BANK_URL: process.env.BANK_URL || "http://localhost:8080",
    IP: process.env.IP || "localhost",
    PORT_LDAP_NOTIFICATION: process.env.PORT_LDAP_NOTIFICATION || "389",
    APPROOVE_SECRET: process.env.APPROOVE_SECRET || "your-approove-secret",
  },
});

// Initialize configuration synchronously
const config = getConfig();
export default config;
