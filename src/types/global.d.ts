declare global {
  var _CONFIG: {
    MONGODB_URL: string;
    _VALS: {
      _JWTSECRET: string;
      _REFRESHSECRET: string;
      [key: string]: any;
    };
  };
}

export {}; 