---
name: Verificación gimnasio
description: Checklist de verificación para cambios en gimnasio-mvp (typecheck, tests, build y archivos generados)
---

# Verificación gimnasio

## Checklist

1. `npm run typecheck` — TypeScript estricto sobre `src`, `scripts`, `tests` y configs (`tsc --noEmit`).
2. `npm test` — Vitest + Supertest. Usan `DATABASE_PATH=:memory:`, secreto fijo y `LOG_LEVEL=silent`; no tocan `data/gym.sqlite`.
3. Solo si cambiaste SQL, el build o dependencias: `npm run build`. Ejecuta `prebuild` → `migrations:generate`, compila el cliente a `public/` y el servidor a `dist/` y `dist/vercel/`.
4. Si tocaste `migrations/*.sql`, confirmá en git `src/server/infra/db/migrations.generated.ts`: Docker y Vercel compilan con ese archivo embebido.
5. No corras migraciones contra la base real para probar; `npm run db:setup` es solo para desarrollo local.
6. No edites `dist/`, `public/`, `data/`, `package-lock.json` ni `.env*`; usá `.env.example` como referencia.

## Criterio de éxito

Reportá los comandos ejecutados y su resultado. Si alguno falla, corregí la causa antes de dar el trabajo por terminado. Para cambios solo documentales, alcanza con verificar que no se modificó código ni configuración ejecutable.
