import { type PaginateResult, type PopulateOptions } from "mongoose";

import OTPModel from "../models/otp.model";
import CustomErrorFunc from "../lib/custom-error";
import {
  type OTPUpdate,
  type IOTP,
  type OTPFilter,
  type OTPOptions,
  type OTPProjection,
} from "../config/types/otp";
import { type DeleteResult } from 'mongodb'

// import utils from "../lib/utils";
// import otpModel from "../models/otp.model";

const whitelist = {};

const population: PopulateOptions[] = [];

interface OTPDalParams {
  method:
    | "create"
    | "get"
    | "get collection"
    | "get paginate"
    | "update"
    | "delete"
    | "delete many"
  query?: OTPFilter;
  projection?: OTPProjection;
  options?: OTPOptions;
  data?: IOTP;
  update?: OTPUpdate;
}

interface OTPReturn {
  statusCode: number;
  body: { error: unknown; data?: IOTP | IOTP[] | PaginateResult<any> | DeleteResult };
}

/**
 * OTPDal function
 */
export async function otpDal(props: OTPDalParams): Promise<OTPReturn> {

  switch (props.method) {
    case "create": {
      const { data } = props;

      if (data != null) {
        return await createOTP(data);
      } else {
        return {
          statusCode: 400,
          body: {
            error: "no data provided",
          },
        };
      }
    }

    case "get": {
      const { query, projection, options } = props;
      return await getOTP(query ?? {}, projection, options);
    }

    case "get collection": {
      const { query, projection, options } = props;

      return await getCollection(query ?? {}, projection, options);
    }

    case "get paginate": {
      const { query, options } = props;

      return await getPaginate(query ?? {}, options);
    }

    case "update": {
      const { query, options, update } = props;

      if (query !== undefined || update !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await updateOTP(query!, update!, options);
      }
      return {
        statusCode: 400,
        body: {
          error: "query or update not provided",
        },
      };
    }

    case "delete": {
      const { query } = props;

      if (query !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await deleteOTP(query);
      }
      return {
        statusCode: 400,
        body: {
          error: "query not provided",
        },
      };
    }

    case 'delete many': {
      const { query } = props

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return await deleteOTPs(query!)
    }

    default: {
      return {
        statusCode: 500,
        body: {
          error: "Unknown database action",
        },
      };
    }
  }
}

async function createOTP(data: IOTP): Promise<OTPReturn> {
  try {
    const otp = new OTPModel(data);
    const otpSaved = await otp.save();

    return {
      statusCode: 201,
      body: {
        error: null,
        data: otpSaved.toObject(),
      },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function getOTP(
  query: OTPFilter,
  projection?: OTPProjection,
  options?: OTPOptions
): Promise<OTPReturn> {
  try {
    const otp = await OTPModel.findOne(
      query,
      projection ?? whitelist,
      options ?? {}
    )
      .lean()
      .populate(population);

    if (otp != null) {
      return {
        statusCode: 200,
        body: { error: null, data: otp },
      };
    } else {
      return {
        statusCode: 400,
        body: { error: "otp not found" },
      };
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: new CustomErrorFunc(err.message),
      },
    };
  }
}

async function getCollection(
  query: OTPFilter,
  projection?: OTPProjection,
  options?: OTPOptions
): Promise<OTPReturn> {
  try {
    const otps = await OTPModel.find(
      query,
      projection ?? whitelist,
      options ?? {}
    )
      .populate(population)
      .lean();

    return {
      statusCode: 200,
      body: {
        error: null,
        data: otps,
      },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function getPaginate(
  query: OTPFilter,
  options?: OTPOptions
): Promise<OTPReturn> {
  const opts = {
    select: whitelist,
    sort: options != null ? options.sort : {},
    populate: population,
    lean: true,
    page: options != null ? Number(options.page) : 1,
    limit: options != null ? Number(options.limit) : 10,
  };

  try {
    const paginatedOTPList = await OTPModel.paginate(query, opts);

    return {
      statusCode: 200,
      body: {
        error: null,
        data: paginatedOTPList,
      },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function updateOTP(
  query: OTPFilter,
  update: OTPUpdate,
  options?: OTPOptions
): Promise<OTPReturn> {
  const opts = {
    new: true,
    ...options,
  };

  try {
    const otp = await OTPModel.findOneAndUpdate(query, update, opts)
      .populate(population)
      .lean();

    if (otp !== null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: otp,
        },
      };
    }
    return {
      statusCode: 400,
      body: { error: "error updating otp*" },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function deleteOTP(query: OTPFilter): Promise<OTPReturn> {
  try {
    const otp = await OTPModel.findOneAndDelete(query).lean();

    if (otp !== null) {
      return {
        statusCode: 200,
        body: {
          error: null,
          data: otp,
        },
      };
    }
    return {
      statusCode: 400,
      body: { error: "error deleting otp" },
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: {
        error: err.message,
      },
    };
  }
}

async function deleteOTPs(query: OTPFilter): Promise<OTPReturn> {
  try {
    const result = await OTPModel.deleteMany(query)

    return { statusCode: 200, body: { error: null, data: result } }
  } catch (err:any) {
    return { statusCode: 500, body: { error: err.message } }
  }
}

export default otpDal;

// export const SaveOTPDal = async (data: any) => {
//   try {
//     const otp = new OTPModel(data);

//     const otpSaved = await otp.save();

//     return otpSaved;
//   } catch (error) {
//     console.log("error in SaveOTPDal", error);
//   }
// };

// export const VerifyOTP = async (value: any) => {
//   try {
//     const query = {
//       $and: [
//         { otpCode: value.otp } /*, { account_number: value.account_number }*/,
//       ],
//     };
//     console.log("--=>><<<==", query);

//     const response = await OTPModel.findOne(query);
//     console.log("response", response);

//     if (response) {
//       if (response.otpCode === value.otp) {
//         const currentTime = new Date();
//         if (currentTime <= response.expiresAt) {
//           return response;
//         } else {
//           console.log("OTP has expired");
//           return null;
//         }
//       } else {
//         console.log("Invalid OTP code");
//         return null;
//       }
//     } else {
//       console.log("No OTP found");
//       return null;
//     }
//   } catch (error) {
//     console.error("Error in VerifyOTP", error);
//     throw error;
//   }
// };

// //
// export const SaveDataToOTPDal = async (OTP: any, value: any) => {
//   const now = new Date();
//   const expiresAt = new Date(now.getTime() + 1 * 60 * 1000);
//   const data = {
//     phoneNumber: utils.formatPhoneNumber(value.phoneNumber),
//     otpCode: OTP,
//     status: "PENDING",
//     expiresAt: expiresAt,
//   };
//   const otpInstance = new OTPModel(data);
//   const response = await otpInstance.save();
//   console.log("response in save date to DB Dal", response);
//   return response;
// };

// // existing PIN --->>>
// export const OTPCheckDals = async (value: any) => {
//   try {
//     const query = {
//       $and: [
//         { otpCode: value.otp },
//         { phoneNumber: utils.formatPhoneNumber(value.phoneNumber) },
//       ],
//     };
//     console.log("query", query);
//     const response = await OTPModel.findOne(query);
//     console.log("response in OTP check Dal", response);
//     if (response) return response;
//     else return null;
//   } catch (error) {
//     console.log("error in OTP check dal", error);
//   }
// };

// export const savePinDetailsDal = async (
//   otp: string,
//   phoneNumber: string,
//   expiresAt: Date,
//   status: string
// ) => {
//   try {
//     let response;
//     const existingPin = await OTPModel.findOne({ otp, phoneNumber });
//     if (existingPin) {
//       existingPin.expiresAt = expiresAt;
//       existingPin.status = status;
//       response = await existingPin.save();
//     } else {
//       const newPin = new OTPModel({ otp, phoneNumber, expiresAt, status });
//       response = await newPin.save();
//     }
//     return response;
//   } catch (error) {
//     console.error("Error saving PIN details:", error);
//     throw new Error("Error saving PIN details");
//   }
// };

// export const GenerateOTPDal = async (device: any, data: any) => {
//   try {
//     const response = await OTPModel.findOneAndUpdate(
//       { deviceUUID: device },
//       data,
//       { new: true, upsert: true }
//     );

//     console.log("response in update OTP dal", response);
//     return response;
//   } catch (error) {
//     console.log("error in update dal");
//   }
// };

// export const UpadteOTPDal = async (phoneNumber: any, data: any) => {
//   try {
//     console.log("update otp dal", phoneNumber, "..", data);
//     const response = await OTPModel.findOneAndUpdate(
//       { phoneNumber: phoneNumber },
//       data,
//       { new: true, upsert: true }
//     );

//     console.log("response in update OTP dal", response);
//     return response;
//   } catch (error) {
//     console.log("error in update dal");
//   }
// };

// export const CreateOTPDal = async (phoneNumber: any, data: any) => {
//   try {
//     console.log("update otp dal", phoneNumber, "..", data);
//     const response = await OTPModel.findOneAndUpdate(
//       { phoneNumber: phoneNumber },
//       data,
//       { new: true, upsert: true }
//     );

//     console.log("response in update OTP dal", response);
//     return response;
//   } catch (error) {
//     console.log("error in update dal");
//   }
// };

// export const OTPCheckDal = async (value: any) => {
//   console.log("value--", value);
//   try {
//     const query = {
//       $and: [
//         { otpCode: value.otp },
//         { phoneNumber: utils.formatPhoneNumber(value.phonenumber) },
//       ],
//     };
//     console.log("query", query);
//     const response = await OTPModel.findOne(query);
//     console.log("response in OTP check Dal", response);
//     if (response) {
//       return true;
//     } else {
//       return false;
//     }
//   } catch (error) {
//     console.log("error in OTP check dal", error);
//     return false;
//   }
// };

// export const OTPCheckDalx = async (value: any) => {
//   try {
//     const query = {
//       $and: [{ otpCode: value.otp }, { deviceUUID: value.deviceId }],
//     };
//     console.log("query", query);
//     const response = await OTPModel.findOne(query);
//     console.log("response in OTP check Dal", response);
//     if (response) return true;
//     else return false;
//   } catch (error) {
//     console.log("error in OTP check dal", error);
//   }
// };

// export const DeleteVerifyOTPDal = async (value: any) => {
//   try {
//     const query = {
//       $and: [
//         { otpCode: value.otp },
//         { phoneNumber: utils.formatPhoneNumber(value.phonenumber) },
//       ],
//     };
//     console.log("qq", query);
//     const result = await OTPModel.deleteOne(query);
//     console.log("Delete result:", result);
//     if (result.acknowledged) {
//       return true;
//     } else {
//       return false;
//     }
//   } catch (error) {
//     console.log("error in Delete OTP check dal", error);
//     return false;
//   }
// };

// export const SaveOTPDalReset = async (data: any) => {
//   try {
//     console.log("data in the save otp check dal", data);
//     const otp = new OTPModel(data);

//     const otpSaved = await otp.save();
//     console.log("otp saved", otpSaved);
//     return otpSaved;
//   } catch (error) {
//     console.log("error in SaveOTPDal", error);
//   }
// };

// export const DeleteOTPResetDal = async (value: any) => {
//   try {
//     const query = {
//       $and: [{ otpCode: value.otp }, { deviceUUID: value.deviceId }],
//     };
//     console.log("qq", query);
//     const result = await OTPModel.deleteOne(query);
//     console.log("Delete result:", result);
//     if (result.acknowledged) {
//       return true;
//     } else {
//       return false;
//     }
//   } catch (error) {
//     console.log("error in deleting reset otp document:", error);
//   }
// };

// export const UpdateOtpDataDal = async (value: any) => {
//   try {
//     const query = { phoneNumber: utils.formatPhoneNumber(value.phonenumber) };
//     console.log("--query", query);
//     // const params = {
//     //   $set: {
//     //     // otpCode: value.otpCode,
//     //     expiresAt: value.expiresAt,
//     //   },
//     // };
//     // const options = { upsert: true, runValidators: true };
//     const response = await OTPModel.deleteOne(query);
//     console.log("-- response --", response);
//     if (response) {
//       return true;
//     } else {
//       return false;
//     }
//   } catch (error) {
//     console.log(
//       "error in deleting otp data document:",
//       (error as Error).message
//     );
//     return false;
//   }
//   // try {
//   //   const query = { phoneNumber: utils.formatPhoneNumber(value.phonenumber) };
//   //   console.log("--query", query);
//   //   const params = {
//   //     $set: {
//   //       // otpCode: value.otpCode,
//   //       expiresAt: value.expiresAt,
//   //     },
//   //   };
//   //   const options = { upsert: true, runValidators: true }; 
//   //   const response = await OTPModel.updateOne(query, params, options);
//   //   console.log("-- response --", response);
//   //   if (response) {
//   //     return true;
//   //   } else {
//   //     return false;
//   //   }
//   // } catch (error) {
//   //   console.log(
//   //     "error in deleting otp data document:",
//   //     (error as Error).message
//   //   );
//   //   return false;
//   // }
// };
