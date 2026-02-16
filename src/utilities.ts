import { ErrorResponseSchema } from './gen/schemas';
import { isUpApiHttpError } from './errors';
import type { UpApiError } from './types';

/**
 * Checks whether an unknown error matches the legacy Up API error shape.
 *
 * @param error Value to evaluate.
 * @returns True when the error contains a valid Up error response payload.
 */
export function isUpApiError(error: unknown): error is UpApiError {
  if (!isUpApiHttpError(error)) {
    return false;
  }

  const parseResult = ErrorResponseSchema.safeParse(error.response.data);
  return parseResult.success;
}
