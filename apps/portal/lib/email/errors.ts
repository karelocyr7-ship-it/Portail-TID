export class EmailConfigurationError extends Error {
  readonly code = "EMAIL_CONFIGURATION_INVALID";
}

export class EmailValidationError extends Error {
  readonly code = "EMAIL_VALIDATION_FAILED";
}

export class EmailTemporaryError extends Error {
  readonly code = "EMAIL_TEMPORARY_FAILURE";
  constructor(message: string, readonly cause?: unknown) {
    super(message);
  }
}

export class EmailPermanentError extends Error {
  readonly code = "EMAIL_PERMANENT_FAILURE";
  constructor(message: string, readonly cause?: unknown) {
    super(message);
  }
}
