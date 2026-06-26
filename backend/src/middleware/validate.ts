import { type RequestHandler } from 'express';
import { type ZodType } from 'zod';
import { zodErrorToApiError } from '@3dotpay/shared';

type RequestPart = 'body' | 'params' | 'query';

/**
 * Validate a request part against a shared zod schema. On failure, responds with
 * the consistent VALIDATION_ERROR envelope (400). For the body, the parsed value
 * (with defaults/coercions applied) is written back onto `req.body`; params and
 * query are read-only getters in Express 5, so they are validated as a gate only.
 */
export function validate(schema: ZodType, part: RequestPart = 'body'): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      res.status(400).json(zodErrorToApiError(result.error));
      return;
    }
    if (part === 'body') {
      req.body = result.data;
    }
    next();
  };
}
