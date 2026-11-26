---
name: Migración producto final
description: Arquitectura objetivo y plan de migración del MVP al producto con cuentas de socio, eventos, PostgreSQL y VPS; usar solo cuando se pida planificar o ejecutar esa migración
---

# Migración al producto final

## Regla de alcance

Este diseño **no está implementado** en el repo. Lee `docs/DOCUMENTACION_TECNICA.md` (secciones 5–15) antes de proponer cambios. Si el usuario pide "hacerlo", avisá que es un cambio de alcance grande, separalo del MVP actual y confirmá el pedido antes de tocar código. Para decidir si corresponde, usá la skill `contexto-gimnasio`.

## Objetivo

100 socios con cuenta propia + 1 administradora (Belen), una sola app sobre VPS Hetzner CAX21 con NGINX + PostgreSQL, sesiones en DB y backups cifrados. Se eliminan Vercel, Turso y el proyecto separado `form-refaccionado`.

## Cambios por capa

- **Auth:** `users` con email + `password_hash` scrypt (reutilizar `modules/auth/password.ts`), `sessions` con token opaco hasheado y revocable, `password_reset_tokens` vía Brevo, `audit_logs`. Guards: `requireAuth`, `requireRole('admin')`, `requireSelfOrAdmin('memberId')`. El rol siempre se lee en servidor.
- **Portal del socio:** `GET /api/me/routines`, `/api/me/routines/:version`, `/api/me/profile`; los endpoints administrativos detrás de `requireRole('admin')`. Reutilizar `RoutinePlanView.tsx` (HTML en lugar de PDF como entregable principal).
- **Eventos:** módulo `src/server/modules/events/{routes,service,repository,schema}.ts` con máquina de estados `draft → published → closed → archived` validada en un solo lugar. Reglas heredadas: nombre/apellido ≥ 3, regex de email, teléfono `^[\d\s+-]{8,20}$`, cierre 1 h antes, cancelación hasta 2 h antes. `UNIQUE(event_id, member_id)` da idempotencia.
- **Datos:** `pg` + Drizzle. Las funciones `queryAll/queryOne/execute/transaction` pasan a `async`, al igual que repositorios y services; `datetime('now') → now()`, `AUTOINCREMENT → identity`, `*_json TEXT → jsonb`. Migraciones con `drizzle-kit`.
- **Borde:** NGINX sirve `public/` y hace `proxy_pass /api`, TLS con Certbot, Cloudflare delante. `trust proxy` se ajusta a Cloudflare + NGINX. Se eliminan `vercel.json` y `src/vercel.ts`.
- **Operación:** `pg_dump` diario → gzip → `age`/`gpg` → Storage Box (30 diarios + 12 mensuales), restore drill trimestral y snapshot antes de cada deploy. Rol de DB con grants limitados, nunca superuser.

## Invariantes que se conservan

- `event_inscriptions` guarda nombre/apellido/email/teléfono como **snapshot**, igual que `memberships.price_cents`: no cambia si Belen edita el socio después.
- Rutinas con versionado inmutable (`UNIQUE(member_id, version)`).
- Archivado lógico de socios, nunca borrado físico.
- Datos de salud no se loguean ni aparecen en auditoría.

## Migración de datos

Inventario (socios sin email, emails duplicados, rutinas huérfanas) → esquema destino → ETL SQLite→JSON→Drizzle → crear usuarios (Belen admin con `must_change_password`, socios con `member_id`) e invitaciones → cutover con freeze, dump final e import → smoke tests y paridad de conteos → retener ambos SQLite 30 días → rollback restaurando env vars si falla.

## Fuera de alcance

Cobros/facturación, WhatsApp, turnos/asistencia, preguntas personalizadas por evento, múltiples sucursales y relevar socios sin email. Cualquier ítem se cotiza por separado.
