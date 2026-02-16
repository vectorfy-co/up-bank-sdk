import { UpClient } from '../helper/client';
import { ENDPOINTS } from '../constants';
import { PingResponseSchema } from '../gen/schemas';
import type { Pong } from '../types';

type RequestBehavior = {
  cache?: boolean;
};

/**
 * Utility endpoints validate API health and auth behavior.
 */
export class UtilApi {
  /**
   * @param api Shared low-level API client.
   */
  constructor(private readonly api: UpClient) {}

  /**
   * Make a basic ping request to verify auth + connectivity.
   *
   * @param options Request behavior options.
   * @returns Ping metadata from the API.
   */
  public ping(options: RequestBehavior = {}): Promise<Pong> {
    return this.api.get(`${ENDPOINTS.UTIL}/ping`, {
      responseSchema: PingResponseSchema,
      cache: options.cache,
    });
  }
}
