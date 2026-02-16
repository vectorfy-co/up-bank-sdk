import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import * as generatedSchemas from './schemas';
import { getOperationSchemas, operationSchemas } from './operation-schemas';

describe('generated schema integrity', () => {
  it('does not leave unresolved enum placeholders in generated enum schemas', () => {
    const enumSchemas = Object.entries(generatedSchemas)
      .filter(([name, value]) => {
        return (
          name.endsWith('EnumSchema') &&
          typeof value === 'object' &&
          value !== null &&
          'safeParse' in value
        );
      })
      .map(([, value]) => value as z.ZodTypeAny);

    expect(enumSchemas.length).toBeGreaterThan(0);
    for (const schema of enumSchemas) {
      expect(schema.safeParse({}).success).toBe(false);
    }
  });

  it('includes operation schema mappings for documented endpoints', () => {
    expect(Object.keys(operationSchemas).length).toBeGreaterThan(0);
    expect(getOperationSchemas('GET', '/util/ping')).toBeDefined();
    expect(getOperationSchemas('post', 'webhooks/{webhookId}/ping')).toBeDefined();
  });
});
