import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['esm'],
  target: 'node22',
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  removeNodeProtocol: false,
  external: [
    'libsql',
    'express',
    'zod',
    'dotenv',
    'cookie',
    'express-rate-limit',
    'helmet',
    'pino',
    'pino-http',
    'react',
    'react-dom',
    '@react-pdf/renderer',
    'date-fns',
  ],
};

export default defineConfig([
  {
    ...shared,
    entry: ['src/server/index.ts'],
    outDir: 'dist/server',
    clean: true,
  },
  {
    // Bundle que consume el entrypoint `server.js` de Vercel.
    ...shared,
    entry: { index: 'src/vercel.ts' },
    outDir: 'dist/vercel',
    clean: true,
  },
]);
