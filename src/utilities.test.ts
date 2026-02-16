import { describe, expect, it } from 'vitest';
import { UpApiHttpError } from './errors';
import { isUpApiError } from './utilities';

describe('isUpApiError', () => {
  it('returns false for non-UpApiHttpError values', () => {
    expect(isUpApiError(new Error('boom'))).toBe(false);
    expect(isUpApiError({})).toBe(false);
  });

  it('returns false when UpApiHttpError payload does not match error schema', () => {
    const error = new UpApiHttpError({
      message: 'bad request',
      status: 400,
      method: 'GET',
      url: 'https://api.up.com.au/api/v1/util/ping',
      data: { notErrors: true },
    });

    expect(isUpApiError(error)).toBe(false);
  });
});
