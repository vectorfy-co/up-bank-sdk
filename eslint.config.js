import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '.pnpm-store/**', 'vitest.config.ts'],
  },
  {
    files: ['**/*.{js,cjs,mjs,mts,ts}'],
    languageOptions: {
      globals: {
        ...globals.es2022,
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/interfaces', '**/interfaces.*'],
              message:
                'Legacy manual interfaces are removed. Use generated contracts from src/types.ts or src/zod.ts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.mts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.scripts.json',
      },
    },
  },
];
