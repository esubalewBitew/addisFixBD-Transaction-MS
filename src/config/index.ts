import dotenv from "dotenv";
dotenv.config();

import vault from "node-vault";
import { TopLevelConfig, Vals } from "./types/config";
import path from "path";

const vaultClient = vault({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

async function loadConfig() {
  try {
    const result = await vaultClient.read(process.env.VAULT_PATH_STAGING as string);
    // console.log("result ", result.data.data);

    return result.data.data;
  } catch (error) {
    console.error("Error reading from Vault:", error);
    throw error;
  }
}

const getConfig = (config: Vals): TopLevelConfig => ({
  // MONGODB_URL: 'mongodb://10.1.15.163/CBEIB-Sandbox-DB',
  MONGODB_URL: config.MONGODB_URL as string,

  _VALS: {
    SMSSender: config.SMSSender,

    _SESSIONTIMEOUT: config._SESSIONTIMEOUT,
    _TEMPSESSIONTIMEOUT: config._TEMPSESSIONTIMEOUT,
    _OTP_SESSIONTIMEOUT: config._OTP_SESSIONTIMEOUT,
    _OTPEXPIRY: config._OTPEXPIRY,
    PINEXPIRYDATE: config.PINEXPIRYDATE,
    
    docDBCONNString: config.docDBCONNString,
    docDBNAME: config.docDBNAME,
    secret: config.secret,
    
    PWDSecretKey: config.PWDSecretKey,
    PWDiv: config.PWDiv,
    
    _JWTSECRET: config._JWTSECRET,
    _JWTEXPIREY: config._JWTEXPIREY,
    _REFRESHSECRET: config._REFRESHSECRET,
    _REFRESHEXPIREY: config._REFRESHEXPIREY,

    DASH_JWTEXPIREY: config.DASH_JWTEXPIREY,
    APP_JWTEXPIREY: config.APP_JWTEXPIREY,
    APP_SESSIONEXPIREY: config.APP_SESSIONEXPIREY,
    DASH_SESSIONEXPIREY: config.DASH_SESSIONEXPIREY,
    SESSION_THRESHOLD: config.SESSION_THRESHOLD,
    SESSION_IDLETIME: config.SESSION_IDLETIME,

    KAFKA_ADDRESS: config.KAFKA_ADDRESS,

    resourcePath: path.resolve(__dirname, "..", "..", "..", "_resources"),
    baseURL: config.baseURL,
    PORT: config.PORT_AUTH,

    appId: config.appId,
    bankEmail: config.bankEmail,
    complyCube_ApiKey: config.complyCube_ApiKey,
    
    BANK_URL: config.BANK_URL,
    IP: config.IP,
    PORT_LDAP_NOTIFICATION: config.PORT_LDAP_NOTIFICATION,
    APPROOVE_SECRET: config.APPROOVE_SECRET,
  },
});
async function initConfig(): Promise<TopLevelConfig> {
  const config = await loadConfig();
  const initConf = await getConfig(config);
  return initConf;
}

export default initConfig;
