import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default /** @type {import('rollup').RollupOptions} */ ({
  input: 'src/react/index.ts',
  output: [
    {
      file: './dist/react/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: './dist/react/index.mjs',
      format: 'es',
      sourcemap: true,
    },
  ],
  external: ['react', 'react-dom', '@tanstack/react-query', '@tanstack/query-core', 'zod'],
  plugins: [
    nodeResolve({ extensions: ['.mjs', '.js', '.json', '.ts'] }),
    commonjs(),
    json(),
    typescript({ tsconfig: './tsconfig.build.json' }),
  ],
});
