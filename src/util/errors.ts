export class AppError extends Error {
    
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    isOperational: boolean = true,
  ){
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
  
  Error.captureStackTrace(this, this.constructor);

  Object.setPrototypeOf(this, AppError.prototype);
  }

}


export class ValidationError extends AppError {

    public readonly errors: Record<string, string>[];

    constructor(message:string='Validation Error', errors: Record<string, string>[] = []){
        super(message, 400, 'VALIDATION_ERROR', true);
        this.errors = errors
        Object.setPrototypeOf(this, ValidationError.prototype);
    }

}

export class UnAuthorizedError extends AppError {

    constructor(message:string='Unauthorized access'){
        super(message, 401, 'UNAUTHORIZED', true);
        Object.setPrototypeOf(this, UnAuthorizedError.prototype);
    }
}

export class ForbiddenError extends AppError {

    constructor(message:string='Forbidden access'){
        super(message, 403, 'FORBIDDEN', true);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }

}

export class NotFoundError extends AppError {

    constructor(message:string='Not found'){
        super(message, 404, 'NOT_FOUND', true);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class ConflictError extends AppError {

    constructor(message:string='Conflict'){
        super(message, 409, 'CONFLICT', true);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message: string = 'Too many requests') {
      super(message, 429, 'TOO_MANY_REQUESTS');
      Object.setPrototypeOf(this, TooManyRequestsError.prototype);
    }
  }

  export class InsufficientCreditsError extends AppError {
    constructor(message: string = 'Insufficient credits') {
      super(message, 402, 'INSUFFICIENT_CREDITS');
      Object.setPrototypeOf(this, InsufficientCreditsError.prototype);
    }
  }

  export class ExternalServiceError extends AppError {
    constructor(service: string, message: string = 'External service error') {
      super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
      Object.setPrototypeOf(this, ExternalServiceError.prototype);
    }
  }