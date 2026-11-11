import express from 'express';
import { createApp } from './server/app';
import { runMigrations } from './server/infra/db/migrate';
import { seedDatabase } from './server/infra/db/seed';

// Vercel detecta aplicaciones Express por la presencia de un entrypoint en
// `src/index.ts` que importe `express`. El import se usa para que el detector
// de frameworks reconozca el proyecto como Express y no como un sitio Vite.
void express;

// En serverless este módulo se evalúa una vez por cold start. Las migraciones y
// el seed son idempotentes, así que es seguro ejecutarlos acá.
runMigrations();
seedDatabase();

const app = createApp();

export default app;
