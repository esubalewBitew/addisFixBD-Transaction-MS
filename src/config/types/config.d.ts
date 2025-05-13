export interface TopLevelConfig {
  MONGODB_URL: string;
  _VALS: Vals;
}

export interface Vals {
  MONGODB_URL?: string;
  SMSSender: string;
  _SESSIONTIMEOUT: number;
  _TEMPSESSIONTIMEOUT: number;
  _OTP_SESSIONTIMEOUT: number;
  PINEXPIRYDATE: number;
  _OTPEXPIRY: number;
  docDBCONNString: string;
  docDBNAME: string;
  secret: string;
  PWDSecretKey: string;
  PWDiv: string;
  _JWTSECRET: string;
  _JWTEXPIREY: number;
  DASH_JWTEXPIREY: number;
  APP_JWTEXPIREY: number;
  APP_SESSIONEXPIREY: number;
  DASH_SESSIONEXPIREY: number;
  SESSION_THRESHOLD: number;
  SESSION_IDLETIME: number;
  _REFRESHSECRET: string;
  _REFRESHEXPIREY: number;
  KAFKA_ADDRESS?: string;
  baseURL: string;
  resourcePath: string;
  PORT?: number;
  PORT_AUTH?: number;

  appId: string;
  bankEmail: string;
  complyCube_ApiKey: string;
  PORT_LDAP_NOTIFICATION: string;

  BANK_URL: string;
  IP: string;

  APPROOVE_SECRET: string;
}
