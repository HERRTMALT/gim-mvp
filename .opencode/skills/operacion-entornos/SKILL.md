---
name: Operación de entornos
description: Cómo arrancar, detener y diagnosticar gimnasio-mvp en desarrollo local, build local, Docker y Vercel; usar ante problemas de puertos, cookies, CSRF o base de datos
---

# Operación de entornos

## Desarrollo local (recomendado)

```bash
npm install
cp .env.example .env
openssl rand -hex 32                      # SESSION_SECRET
npm run hash-password -- "mi-contraseña"  # opcional: OWNER_PASSWORD_HASH
npm run db:setup                          # migraciones + seed (una vez)
npm run dev
```

Cliente en `:5173`, API en `:3000/api/health`. Vite redirige `/api` al puerto 3000. Si el puerto está ocupado: `ss -ltnp | grep ':3000'` y ajustar `PORT`/proxy o liberar el PID.

## Build local y Docker

```bash
npm run build
APP_URL=http://localhost:3000 COOKIE_SECURE=false NODE_ENV=production npm start
```

```bash
docker build -t gimnasio-mvp .
docker run -d --name gimnasio -p 3000:3000 -v gimnasio-data:/app/data \
  -e SESSION_SECRET="..." -e OWNER_PASSWORD_HASH='scrypt$...' \
  -e GYM_NAME="Mi Gimnasio" -e COOKIE_SECURE=false gimnasio-mvp
```

El volumen `gimnasio-data` persiste SQLite. Sin volumen, al borrar el contenedor se pierde la base. `npm start` sirve API y cliente en el mismo puerto.

## Vercel + Turso

- Requiere `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`: el filesystem es efímero y `data/gym.sqlite` no sirve.
- `server.js` reexporta `dist/vercel/index.js`; en serverless no hay `listen()`.
- Usá `APP_TZ` para fechas de negocio: Vercel define `TZ=:UTC`.
- Si el PDF falla solo en Vercel, revisá `includeFiles` en `vercel.json`.

## Detener

| Entorno | Acción |
| --- | --- |
| `npm run dev` | `Ctrl+C` (`concurrently -k` mata ambos hijos). |
| `npm start` | `Ctrl+C`: cierra servidor y DB en forma graceful. |
| Docker | `docker stop gimnasio`; luego `docker rm` si no se reutiliza. |
| Compose | `docker compose down` (agregá `-v` **solo** si querés borrar el volumen). |
| Vercel | No hay proceso: quitar dominio o borrar el deployment. Turso no se borra con eso. |

## Diagnóstico rápido

| Síntoma | Causa / solución |
| --- | --- |
| Login ok pero APIs 401 | Cookie `Secure` sobre HTTP → `COOKIE_SECURE=false`. |
| Escrituras 403 `CSRF` | `Origin` distinto de `APP_URL` → ajustar `APP_URL` al origen real. |
| `no such table: members` | Faltan migraciones → `npm run db:migrate` o `db:setup`. |
| `Configuración inválida (.env)` | `SESSION_SECRET` ausente/<32 chars o credencial faltante. |
| Fechas desfasadas | Definir `APP_TZ=America/Argentina/Buenos_Aires`. |
| "No se encontraron ejercicios compatibles" | Poco equipamiento o muchas contraindicaciones. |

## Backups y secretos

- Copiar `gym.sqlite` junto con `-wal` y `-shm`, o usar `sqlite3 data/gym.sqlite ".backup '/tmp/gym-backup.sqlite'"`. Mejor parar el servicio primero.
- Cambiar contraseña: `npm run hash-password -- "nueva-clave"`, pegar el hash y borrar `OWNER_PASSWORD`. Eso invalida todas las sesiones.
- Los datos de salud y los backups son sensibles: permisos restringidos y nunca en repositorios ni canales públicos. No imprimas valores de `.env*`; la skill `verificacion-gimnasio` prohíbe editarlos.
