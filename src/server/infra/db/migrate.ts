import { db, execute, queryAll, transaction } from './index';
import { MIGRATIONS } from './migrations.generated';

type AppliedMigration = { version: string };

export function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    queryAll<AppliedMigration>('SELECT version FROM schema_migrations').map((row) => row.version),
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;
    transaction(() => {
      db.exec(migration.sql);
      execute('INSERT INTO schema_migrations (version) VALUES (?)', [migration.version]);
    });
    console.log(`Migración aplicada: ${migration.version}`);
  }
}
