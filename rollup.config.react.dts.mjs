import dts from 'rollup-plugin-dts';

export default /** @type {import('rollup').RollupOptions} */ ({
  input: 'src/react/index.ts',
  output: [{ file: './dist/react/index.d.ts', format: 'es' }],
  external: ['react', 'react-dom', '@tanstack/react-query', '@tanstack/query-core', 'zod'],
  plugins: [dts({ tsconfig: './tsconfig.build.json' })],
});
