/**
 * Load Module Dependencies
 */

interface ErrorInfo {
  name?: keyof typeof ERROR_CODES;
  message?: string;
  status?: number;
}

interface ErrorCode {
  message: string;
  status: number;
}

const ERROR_CODES: Record<string, ErrorCode> = {
  AUTHENTICATION_ERROR: {
    message: 'User not Authenticated',
    status: 401
  },
  DEFAULT_ERROR: {
    message : 'Something Went Wrong ☹ ',
    status: 400
  },
  SERVER_ERROR: {
    message: 'Internal Server Error',
    status: 500
  },
  LOGOUT_ERROR: {
    message: 'You are not Logged in',
    status: 400
  },
  AUTHORIZATION_ERROR: {
    message: 'You are not authorized to perform this action',
    status: 403
  },
  USER_CREATION_ERROR: {
    message: 'User cannot be created',
    status: 400
  },
  PASSWORD_UPDATE_ERROR: {
    message: 'Could not update password for the user',
    status: 400
  }
};

/**
 * CustomError Type Definition.
 *
 * @param {ErrorInfo} info error information
 *
 */
class CustomError extends Error {
  public status: number;

  constructor(info: ErrorInfo) {
    super();
    
    const _knownError = ERROR_CODES[info.name || 'DEFAULT_ERROR'];

    this.name = info.name || 'DEFAULT_ERROR';
    this.message = _knownError ? _knownError.message : (info.message || '');
    this.status = _knownError ? _knownError.status : (info.status || 400);
  }
}

// Expose Constructor
export = CustomError;
