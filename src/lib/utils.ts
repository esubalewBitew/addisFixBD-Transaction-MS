import crypto from "crypto";

let getRandomArbitrary = () => {
  const min = 100000;
  const max = 999999;

  const generatedNumber = crypto.randomInt(min, max);
  return String(generatedNumber);
};

let formatPhoneNumber = (phoneNumber: string) => {
  if (String(phoneNumber).startsWith("0"))
    return `+251${String(phoneNumber).substring(1)}`
  else if (String(phoneNumber).startsWith("9") ||  String(phoneNumber).startsWith("7"))
    return `+251${String(phoneNumber)}`
  else if (String(phoneNumber).startsWith("+")) return String(phoneNumber);
  else if (String(phoneNumber).startsWith("251"))
    return `+${String(phoneNumber)}`
};

let localEncryptPassword = (password: string) => {
  let PWDSecretKey = '12345678901234567890123456789012'// global._CONFIG._VALS.PWDSecretKey;
  let PWDiv = global._CONFIG._VALS.PWDiv;

  console.log("PWDSecretKey", PWDSecretKey);

  console.log("PWDiv Password ==>", password);

  const cipher = crypto.createCipheriv("aes-256-cbc", PWDSecretKey, PWDiv);

  let encrypted = cipher.update(password, "utf8", "hex");

  encrypted += cipher.final("hex");
  // console.log("THIS ENCRYPTED PWD: ", encrypted);

  return encrypted;
};

let localDecryptPassword = (encryptedPassword: string) => {

  console.log("encryptedPassword data", encryptedPassword);
  let PWDSecretKey = '12345678901234567890123456789012'// global._CONFIG._VALS.PWDSecretKey;
  let PWDiv = global._CONFIG._VALS.PWDiv;

  const decipher = crypto.createDecipheriv("aes-256-cbc", PWDSecretKey, PWDiv);

  let decrypted = decipher.update(encryptedPassword, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

export default {
  formatPhoneNumber,
  getRandomArbitrary,
  localEncryptPassword,
  localDecryptPassword,
};
