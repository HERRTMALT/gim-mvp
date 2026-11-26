# Contexto del servidor

- Arranque normal: `runMigrations() → seedDatabase() → createApp() → app.listen(PORT)`; `closeDb()` en `SIGINT`/`SIGTERM` con timeout de 5 s. Migraciones y seed son idempotentes.
- En Vercel, `src/vercel.ts` hace lo mismo pero **sin `listen()`**: corre en cada *cold start* y exporta la app. `server.js` reexporta el bundle `dist/vercel`.
- Orden de middlewares en `src/server/app.ts`: `helmet` → `express.json` → `pino-http` → `/api/health` → `requireSameOrigin` → `/api/auth/*` → `requireAuth` → módulos → 404 de API → estáticos/fallback SPA → errores. No lo reordenes sin entender el impacto en CSRF y auth.
- Convención por módulo: `routes.ts` valida y responde, `service.ts` contiene las reglas de negocio, `repository.ts` habla con SQL. El dominio en `domain/routines` es puro: no importa DB ni Express.
- Validación: esquemas en `src/shared/schemas.ts` y `src/server/shared/validation.ts` (`parseId()` para IDs). Consultas parametrizadas; las operaciones de cuotas y rutinas usan transacciones.
- Fechas de negocio: `today()` prioriza `APP_TZ`, luego `TZ`, luego `America/Argentina/Buenos_Aires`. Vercel define `TZ=:UTC`; el código limpia el `:`. No uses la zona del proceso directamente.
- Sesión actual: cookie `gym_session` firmada con HMAC y huella de credencial; `requireAuth` responde solo sí/no, **sin `userId` ni `role`**. No agregues autorización por recurso salvo que se pida la migración del producto final.
- Respuestas de error: `{ error: { code, message, details } }`. Códigos: `UNAUTHORIZED`, `CSRF`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `ROUTINE_SAFETY`, `RATE_LIMITED`, `INTERNAL_ERROR`.
- Logs `pino` estructurados; nunca incluyas condiciones de salud, contraseñas ni secretos.
- Si cambiás `migrations/*.sql`, ejecutá `npm run migrations:generate`, confirmá `src/server/infra/db/migrations.generated.ts` y pasá `npm run typecheck` + `npm test`.
