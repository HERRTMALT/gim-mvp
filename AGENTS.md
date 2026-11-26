# Contexto del proyecto — gimnasio-mvp

Panel interno para un gimnasio pequeño: **un único usuario** (la dueña), socios, cuotas, rutinas versionadas y PDF. Node >= 22, Express 5, React 19, TypeScript estricto, SQLite/libSQL local (Turso en Vercel).

## Estado actual vs. plan futuro

- Este repo es el **MVP** descrito en `docs/GUIA_DE_OPERACION_Y_ARQUITECTURA.md` (25/11/2026). Esa guía manda.
- `docs/DOCUMENTACION_TECNICA.md` (20/11/2026) describe la **migración futura**: cuentas de socio, roles, eventos, PostgreSQL, VPS. Es diseño, **no código existente**. No lo implementes salvo pedido explícito.
- Si un requerimiento parece del producto final, aclaralo antes de escribir código y cargá la skill `migracion-producto-final`.
- Para decidir qué documento leer, usá la skill `contexto-gimnasio`.

## Reglas que no se negocian

- El historial nunca se destruye: archivar socios (no borrar), toda edición/regeneración de rutina crea una versión nueva (`UNIQUE(member_id, version)`), cada cuota guarda su `price_cents` histórico.
- Arquitectura: `src/shared` = contratos Zod compartidos; `src/server/domain` = lógica pura (sin DB ni Express); `src/server/infra` = DB y PDF; `src/server/modules/<nombre>` = `routes → service → repository`.
- Validá toda entrada con Zod y usá SQL parametrizado. Los datos de salud son sensibles: no los loguees ni los expongas en respuestas de auditoría.
- No edites artefactos generados: `src/server/infra/db/migrations.generated.ts` (se regenera con `npm run migrations:generate`), `public/`, `dist/`, `data/gym.sqlite*`, `package-lock.json`.
- No escribas secretos en el código ni los compartas. `.env`, `.env.local` y `.vercel/` están fuera de git; si necesitás revisar variables, leé solo las claves, nunca los valores. `.env.example` es la plantilla.

## Comandos y verificación

Desde la raíz: `npm run dev`, `npm test`, `npm run typecheck`, `npm run build`, `npm run db:setup`.

Antes de terminar un cambio de código: `npm run typecheck` y `npm test` (la skill `verificacion-gimnasio` tiene el checklist). Si tocás SQL, también `npm run build` y confirmá en git el archivo de migraciones regenerado.

Los detalles de ejecución, Docker, Vercel y resolución de problemas están en la skill `operacion-entornos`.

## Skills disponibles

| Skill | Cuándo usarla |
| --- | --- |
| `contexto-gimnasio` | Antes de explorar: qué doc leer y si es MVP o migración. |
| `verificacion-gimnasio` | Al cerrar un cambio: tipos, tests, build y generados. |
| `motor-rutinas` | Cambios en el generador determinístico o en el versionado de rutinas. |
| `operacion-entornos` | Arrancar, detener o diagnosticar dev/Docker/Vercel. |
| `migracion-producto-final` | Solo si se pide planificar o ejecutar el producto final. |

## Documentación de referencia

- Estado real, API, seguridad, scripts y operación: `docs/GUIA_DE_OPERACION_Y_ARQUITECTURA.md`.
- Diseño objetivo y plan de migración: `docs/DOCUMENTACION_TECNICA.md`.
- Resumen rápido de instalación y despliegue: `README.md`.
