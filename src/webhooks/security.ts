import { WebhookEventCallbackSchema, WebhookEventTypeEnumSchema } from '../gen/schemas';
import type { WebhookEventCallback } from '../types';

/**
 * Inputs required for webhook signature verification.
 */
export type VerifyWebhookSignatureInput = {
  rawBody: string | Uint8Array;
  signatureHeader: string;
  secretKey: string;
};

/**
 * Verify Up webhook authenticity signature using SHA-256 HMAC.
 *
 * @param input Raw payload, signature header, and webhook secret.
 * @returns True when the signature is valid.
 */
export async function verifyWebhookSignature(input: VerifyWebhookSignatureInput): Promise<boolean> {
  const rawBody = toUint8Array(input.rawBody);
  const expectedSignature = await computeHmacSha256Hex(input.secretKey, rawBody);
  const receivedSignature = normalizeHex(input.signatureHeader);

  return constantTimeHexEqual(expectedSignature, receivedSignature);
}

/**
 * Parse and validate a webhook callback payload.
 *
 * @param rawBody Raw JSON payload body.
 * @returns Strongly typed webhook callback event.
 */
export function parseAndValidateWebhookEvent(rawBody: string | Uint8Array): WebhookEventCallback {
  const parsedPayload = parseJsonPayload(rawBody);
  const validatedPayload = WebhookEventCallbackSchema.parse(parsedPayload);

  WebhookEventTypeEnumSchema.parse(validatedPayload.data.attributes.eventType);

  return validatedPayload as WebhookEventCallback;
}

/**
 * Verify webhook signature and parse the payload into a strongly-typed event.
 *
 * @param input Verification and parsing inputs.
 * @returns Verified and validated webhook event.
 */
export async function assertVerifiedWebhookEvent(input: {
  rawBody: string | Uint8Array;
  signatureHeader: string;
  secretKey: string;
}): Promise<WebhookEventCallback> {
  const verified = await verifyWebhookSignature(input);
  if (!verified) {
    throw new Error('Webhook signature verification failed');
  }

  return parseAndValidateWebhookEvent(input.rawBody);
}

/**
 * Parses raw webhook payload bytes/text into JSON.
 */
function parseJsonPayload(rawBody: string | Uint8Array): unknown {
  const bodyText = typeof rawBody === 'string' ? rawBody : new TextDecoder().decode(rawBody);
  return JSON.parse(bodyText);
}

/**
 * Computes an HMAC SHA-256 signature as lowercase hex.
 */
async function computeHmacSha256Hex(secretKey: string, body: Uint8Array): Promise<string> {
  const secretBytes = new TextEncoder().encode(secretKey);

  if (globalThis.crypto?.subtle) {
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await globalThis.crypto.subtle.sign('HMAC', key, toArrayBuffer(body));
    return bytesToHex(new Uint8Array(signature));
  }

  const nodeCrypto = await loadNodeCrypto();
  if (nodeCrypto?.createHmac) {
    return nodeCrypto.createHmac('sha256', secretBytes).update(body).digest('hex');
  }

  throw new Error('No crypto implementation available for webhook signature verification');
}

/**
 * Normalizes text or bytes to `Uint8Array`.
 */
function toUint8Array(value: string | Uint8Array): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }
  return new TextEncoder().encode(value);
}

/**
 * Creates a detached `ArrayBuffer` view for Web Crypto APIs.
 */
function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

/**
 * Dynamically loads Node's crypto module when Web Crypto is unavailable.
 */
async function loadNodeCrypto(): Promise<{
  createHmac: (
    algorithm: string,
    key: Uint8Array,
  ) => { update: (data: Uint8Array) => { digest: (encoding: 'hex') => string } };
} | null> {
  try {
    const specifier = 'node:crypto';
    return (await import(specifier)) as {
      createHmac: (
        algorithm: string,
        key: Uint8Array,
      ) => {
        update: (data: Uint8Array) => { digest: (encoding: 'hex') => string };
      };
    };
  } catch {
    return null;
  }
}

/**
 * Converts bytes to lowercase hexadecimal.
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Normalizes signature header values for comparison.
 */
function normalizeHex(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('sha256=') ? normalized.slice('sha256='.length) : normalized;
}

/**
 * Performs a constant-time comparison of two hex strings.
 */
function constantTimeHexEqual(leftHex: string, rightHex: string): boolean {
  if (leftHex.length !== rightHex.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < leftHex.length; i++) {
    mismatch |= leftHex.charCodeAt(i) ^ rightHex.charCodeAt(i);
  }

  return mismatch === 0;
}
