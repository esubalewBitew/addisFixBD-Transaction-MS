import Joi from "joi";
interface passwordRules {
  minLength: number;
  maxLength: number;
  numbers: boolean;
  capitalLetters: boolean;
  smallLetters: boolean;
  characters: boolean;
}

export const generatePasswordValidation = (config: passwordRules) => {
  let schema = Joi.string().min(config.minLength).max(config.maxLength);
  console.log("config === ", config);

  if (config.numbers) {
    schema = schema.pattern(new RegExp("(?=.*[0-9])"));
  }

  if (config.capitalLetters) {
    schema = schema.pattern(new RegExp("(?=.*[A-Z])"));
  }

  if (config.smallLetters) {
    schema = schema.pattern(new RegExp("(?=.*[a-z])"));
  }

  if (config.characters) {
    schema = schema.pattern(new RegExp("(?=.*[!@#$%^&*])"));
  }

  return schema.required().messages({
    "string.min": `Password must be at least ${config.minLength} characters long`,
    "string.max": `Password cannot exceed ${config.maxLength} characters`,
    "string.pattern.base":
      "Password must meet the required complexity (e.g., numbers, letters, or special characters)",
  });
};

export const phoneNumberValidation = Joi.string()
  .custom((value, helpers) => {
    if (!value.startsWith("+251")) {
      return helpers.error("phoneNumber.missingPrefix");
    }

    const afterPrefix = value.slice(4); // Extract the digits after "+251"
    if (!/^\d{9}$/.test(afterPrefix)) {
      return helpers.error("phoneNumber.invalidFormat");
    }

    if (!["9", "7"].includes(afterPrefix[0])) {
      return helpers.error("phoneNumber.invalidStartDigit");
    }

    return value; // Validation passed
  })
  .messages({
    "phoneNumber.missingPrefix": "Phone number must start with +251.",
    "phoneNumber.invalidFormat":
      "Phone number must be followed by exactly 9 digits.",
    "phoneNumber.invalidStartDigit":
      "Phone number must start with 9 or 7 after +251.",
  })
  .required();
export const passwordValidation = Joi.string()
  .min(12)
  .max(30)
  .pattern(new RegExp("(?=.*[a-z])"))
  .pattern(new RegExp("(?=.*[A-Z])"))
  .pattern(new RegExp("(?=.*[0-9])"))
  .pattern(new RegExp("(?=.*[!@#$%^&*])"))
  .required()
  .messages({
    "string.min": "Password must be at least 12 characters long",
    "string.max": "Password cannot exceed 30 characters",
    "password.redundant":
      "Password cannot have more than 2 repeating characters in a row",
    "string.pattern.base":
      "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character",
    "password.sequential":
      'Password cannot contain sequential characters (e.g., "123", "abc")',
  });

export const phoneNumberLookUpSchema = Joi.object({
  phone_number: phoneNumberValidation,
});

export const userLoginSchema = Joi.object({
  password: passwordValidation,
});
export const userSetPasswordSchema = Joi.object({
  password: passwordValidation,
});
export const userForgotPasswordSchema = Joi.object({
  newpassword: passwordValidation,
});

export const otpRequestSchema = Joi.object({
  phone_number: phoneNumberValidation,
});

export const userRegisterSchema = Joi.object({
  phone_number: phoneNumberValidation,
  user_name: Joi.string().min(3).max(30).required(),
  full_name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  role: Joi.string().required().valid("MAKER", "CHECKER"),
  department: Joi.string().max(40).required(),
  permission_categories: Joi.array().items(Joi.string()).required(),
  permission_groups: Joi.array().items(Joi.string()).required(),
  // included_permissions: Joi.array().items(Joi.string()).required(),
  // excluded_permissions: Joi.array().items(Joi.string()).optional(),
});

export const userUpdateSchema = Joi.object({
  phone_number: phoneNumberValidation,
  user_name: Joi.string().min(3).max(30).optional(),
  full_name: Joi.string().min(3).max(40).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().optional().valid("MAKER", "CHECKER"),
  department: Joi.string().max(40).optional(),
  permission_categories: Joi.array().items(Joi.string()).optional(),
  permission_groups: Joi.array().items(Joi.string()).optional(),
  // included_permissions: Joi.array().items(Joi.string()).optional(),
  // excluded_permissions: Joi.array().items(Joi.string()).optional(),
});
