import axios from "axios";
// import utils from "../lib/utils.js";
import utils from "../lib/utils";
const axiosSendSms = async (phonenumber: string, messageBody: string) => {
  try {
    const response = await axios.post(
      `http://${global._CONFIG._VALS.IP}:${global._CONFIG._VALS.PORT_LDAP_NOTIFICATION}/v1.0/chatbirrapi/ldapnotif/sms/send`,
      {
        recipient: utils.formatPhoneNumber(phonenumber),
        messageBody: `${
          ["uat", "dev"].includes(process.env.NODE_ENV as string) ? "UAT: " : ""
        }${messageBody}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("SMS sent successfully:", response.data);
    return;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return;
  }
};

export default axiosSendSms;
