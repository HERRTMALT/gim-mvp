import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Embebe las migraciones SQL en un módulo TypeScript.
 *
 * En Vercel el runtime serverless no incluye de forma confiable la carpeta
 * `migrations/`, así que leer los .sql con `fs` en cada cold start es frágil.
 * Generando este archivo las migraciones viajan dentro del bundle.
 *
 * Es un script .mjs a propósito: se ejecuta con Node puro, sin depender de
 * devDependencies (Vercel puede instalar solo dependencias de producción).
 */
const root = process.cwd();
const migrationsDir = join(root, 'migrations');
const outputFile = join(root, 'src/server/infra/db/migrations.generated.ts');

const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

const entries = files.map((file) => {
  const sql = readFileSync(join(migrationsDir, file), 'utf8')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  return `  {\n    version: ${JSON.stringify(file)},\n    sql: \`${sql}\`,\n  },`;
});

const output = `// AUTO-GENERADO por scripts/generate-migrations.mjs. No editar a mano.
// Ejecutar \`npm run build\` (o \`npm run migrations:generate\`) para regenerarlo.

export type Migration = { version: string; sql: string };

export const MIGRATIONS: Migration[] = [
${entries.join('\n')}
];
`;

writeFileSync(outputFile, output, 'utf8');
console.log(`Migraciones embebidas: ${files.length} (${files.join(', ')})`);
