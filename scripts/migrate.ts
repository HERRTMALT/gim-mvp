import { closeDb } from '../src/server/infra/db';
import { runMigrations } from '../src/server/infra/db/migrate';

runMigrations();
closeDb();
console.log('Migraciones al día');
