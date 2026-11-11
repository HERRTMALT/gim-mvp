import { createApp } from './server/app';
import { runMigrations } from './server/infra/db/migrate';
import { seedDatabase } from './server/infra/db/seed';

// Este módulo se compila con tsup a `dist/vercel/index.js`. El entrypoint que
// Vercel detecta es `server.js` (raíz), que reexporta ese bundle ya compilado.
// En serverless el módulo se evalúa una vez por cold start; las migraciones y el
// seed son idempotentes, así que es seguro ejecutarlos acá.
runMigrations();
seedDatabase();

const app = createApp();

export default app;
