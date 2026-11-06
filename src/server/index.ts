import { createApp, logger } from './app';
import { env } from './config/env';
import { closeDb } from './infra/db';
import { runMigrations } from './infra/db/migrate';
import { seedDatabase } from './infra/db/seed';

runMigrations();
seedDatabase();

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, gym: env.GYM_NAME },
    'Servidor iniciado',
  );
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Cerrando servidor');
  server.close(() => {
    closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
