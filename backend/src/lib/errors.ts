/**
 * Typed application errors. Controllers/services throw these; the global error
 * handler maps them to the shared ApiError envelope using `code` + `statusCode`.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class NotImplementedError extends AppError {
  constructor(what: string) {
    super(501, 'NOT_IMPLEMENTED', `${what} is not implemented yet`);
  }
}
