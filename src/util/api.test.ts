import { describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '../constants';
import { PingResponseSchema } from '../gen/schemas';
import type { UpClient } from '../helper/client';
import { UtilApi } from './api';

describe('UtilApi', () => {
  it('pings util endpoint with optional cache behavior', async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ meta: { id: '1', statusEmoji: '⚡️' } }),
    } as unknown as UpClient;

    const api = new UtilApi(client);
    await api.ping({ cache: false });

    expect(vi.mocked(client.get)).toHaveBeenCalledWith(`${ENDPOINTS.UTIL}/ping`, {
      responseSchema: PingResponseSchema,
      cache: false,
    });
  });
});
