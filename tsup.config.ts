import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server/index.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist/server',
  clean: true,
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  removeNodeProtocol: false,
  external: [
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
});
