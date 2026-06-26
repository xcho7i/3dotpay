import { z, type ZodError } from 'zod';

/**
 * The ONE error shape every API response uses. Backend and mobile both import
 * this — there is no second definition anywhere.
 */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Build an ApiError envelope. */
export function makeApiError(code: string, message: string, details?: unknown): ApiError {
  return { error: { code, message, ...(details === undefined ? {} : { details }) } };
}

/** Flattened, serializable view of a single zod issue. */
export interface ApiErrorIssue {
  path: string;
  message: string;
  code: string;
}

/**
 * Convert a ZodError into the standard ApiError envelope so validation failures
 * are returned consistently everywhere.
 */
export function zodErrorToApiError(
  error: ZodError,
  message = 'Request validation failed',
): ApiError {
  const details: ApiErrorIssue[] = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
  return makeApiError('VALIDATION_ERROR', message, details);
}
