import { describe, expect, it } from 'vitest';
import {
  assertVerifiedWebhookEvent,
  parseAndValidateWebhookEvent,
  verifyWebhookSignature,
} from './security';

const TEST_SECRET = 'super-secret-key';

const SAMPLE_EVENT = {
  data: {
    type: 'webhook-events',
    id: 'evt_123',
    attributes: {
      eventType: 'PING',
      createdAt: '2026-01-01T00:00:00+00:00',
    },
    relationships: {
      webhook: {
        data: { type: 'webhooks', id: 'wh_123' },
      },
    },
  },
};

describe('webhook security helpers', () => {
  it('accepts a valid signature and returns a parsed event', async () => {
    const rawBody = JSON.stringify(SAMPLE_EVENT);
    const signatureHeader = await sign(TEST_SECRET, rawBody);

    expect(
      await verifyWebhookSignature({
        rawBody,
        signatureHeader,
        secretKey: TEST_SECRET,
      }),
    ).toBe(true);

    const event = await assertVerifiedWebhookEvent({
      rawBody,
      signatureHeader,
      secretKey: TEST_SECRET,
    });
    expect(event.data.attributes.eventType).toBe('PING');

    expect(
      await verifyWebhookSignature({
        rawBody,
        signatureHeader: `sha256=${signatureHeader}`,
        secretKey: TEST_SECRET,
      }),
    ).toBe(true);
  });

  it('rejects invalid signatures', async () => {
    const rawBody = JSON.stringify(SAMPLE_EVENT);
    const signatureHeader = await sign(TEST_SECRET, rawBody);
    const invalidSignature = `${signatureHeader.slice(0, -1)}0`;

    expect(
      await verifyWebhookSignature({
        rawBody,
        signatureHeader: invalidSignature,
        secretKey: TEST_SECRET,
      }),
    ).toBe(false);

    await expect(
      assertVerifiedWebhookEvent({
        rawBody,
        signatureHeader: invalidSignature,
        secretKey: TEST_SECRET,
      }),
    ).rejects.toThrow('Webhook signature verification failed');
  });

  it('throws when payload does not match webhook schema', async () => {
    const invalidPayload = JSON.stringify({ notData: true });
    const signatureHeader = await sign(TEST_SECRET, invalidPayload);

    await expect(
      assertVerifiedWebhookEvent({
        rawBody: invalidPayload,
        signatureHeader,
        secretKey: TEST_SECRET,
      }),
    ).rejects.toThrow();
  });

  it('throws when eventType is outside allowed webhook event set', () => {
    const rawBody = JSON.stringify({
      ...SAMPLE_EVENT,
      data: {
        ...SAMPLE_EVENT.data,
        attributes: {
          ...SAMPLE_EVENT.data.attributes,
          eventType: 'UNSUPPORTED_EVENT',
        },
      },
    });

    expect(() => parseAndValidateWebhookEvent(rawBody)).toThrow();
  });

  it('supports Uint8Array payloads for verification and parsing', async () => {
    const rawBodyString = JSON.stringify(SAMPLE_EVENT);
    const rawBody = new TextEncoder().encode(rawBodyString);
    const signatureHeader = await sign(TEST_SECRET, rawBodyString);

    expect(
      await verifyWebhookSignature({
        rawBody,
        signatureHeader: ` SHA256=${signatureHeader} `,
        secretKey: TEST_SECRET,
      }),
    ).toBe(true);

    const parsed = parseAndValidateWebhookEvent(rawBody);
    expect(parsed.data.id).toBe('evt_123');
  });

  it('returns false when signature lengths differ', async () => {
    const rawBody = JSON.stringify(SAMPLE_EVENT);

    expect(
      await verifyWebhookSignature({
        rawBody,
        signatureHeader: 'abc',
        secretKey: TEST_SECRET,
      }),
    ).toBe(false);
  });

  it('falls back to Node crypto when Web Crypto is unavailable', async () => {
    const previousCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });

    try {
      const rawBody = JSON.stringify(SAMPLE_EVENT);
      const specifier = 'node:crypto';
      const { createHmac } = (await import(specifier as string)) as {
        createHmac: (
          algorithm: string,
          key: string,
        ) => {
          update: (input: string) => { digest: (encoding: 'hex') => string };
        };
      };
      const signatureHeader = createHmac('sha256', TEST_SECRET).update(rawBody).digest('hex');

      expect(
        await verifyWebhookSignature({
          rawBody,
          signatureHeader,
          secretKey: TEST_SECRET,
        }),
      ).toBe(true);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: previousCrypto,
      });
    }
  });
});

async function sign(secret: string, rawBody: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API unavailable in test runtime');
  }

  const secretBytes = new TextEncoder().encode(secret);
  const bodyBytes = new TextEncoder().encode(rawBody);
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    toArrayBuffer(secretBytes),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, toArrayBuffer(bodyBytes));
  return bytesToHex(new Uint8Array(signature));
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

function bytesToHex(value: Uint8Array): string {
  return Array.from(value)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
