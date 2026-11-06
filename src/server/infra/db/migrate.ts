import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { db, execute, queryAll, transaction } from './index';

type AppliedMigration = { version: string };

export function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const directory = join(process.cwd(), 'migrations');
  const files = readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const applied = new Set(
    queryAll<AppliedMigration>('SELECT version FROM schema_migrations').map((row) => row.version),
  );

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(directory, file), 'utf8');
    transaction(() => {
      db.exec(sql);
      execute('INSERT INTO schema_migrations (version) VALUES (?)', [file]);
    });
    console.log(`Migración aplicada: ${file}`);
  }
}
