import type { HttpMethod } from './helper/client';

/**
 * Constructor payload used to build a normalized HTTP error.
 */
export type UpApiHttpErrorInit = {
  message: string;
  status: number;
  method: HttpMethod;
  url: string;
  data: unknown;
  requestId?: string;
  responseHeaders?: Readonly<Record<string, string>>;
};

/**
 * Represents a failed HTTP call to the Up API.
 */
export class UpApiHttpError extends Error {
  readonly status: number;
  readonly method: HttpMethod;
  readonly url: string;
  readonly data: unknown;
  readonly requestId: string | undefined;
  readonly responseHeaders: Readonly<Record<string, string>> | undefined;
  readonly response: { status: number; data: unknown };

  /**
   * Creates a new structured Up API HTTP error.
   *
   * @param init Initialization payload containing request and response details.
   */
  constructor(init: UpApiHttpErrorInit) {
    super(init.message);
    this.name = 'UpApiHttpError';
    this.status = init.status;
    this.method = init.method;
    this.url = init.url;
    this.data = init.data;
    this.requestId = init.requestId;
    this.responseHeaders = init.responseHeaders;
    this.response = { status: init.status, data: init.data };
  }
}

/**
 * Checks whether a value is an {@link UpApiHttpError}.
 *
 * @param error Value to evaluate.
 * @returns True when the value is an UpApiHttpError instance.
 */
export function isUpApiHttpError(error: unknown): error is UpApiHttpError {
  return error instanceof UpApiHttpError;
}
