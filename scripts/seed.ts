import { closeDb } from '../src/server/infra/db';
import { runMigrations } from '../src/server/infra/db/migrate';
import { seedDatabase } from '../src/server/infra/db/seed';

runMigrations();
seedDatabase();
closeDb();
console.log('Datos iniciales cargados');
