# Gimnasio MVP

Sistema de gestión para un gimnasio pequeño, pensado para usarse desde tablet o PC. Permite administrar socios, cuotas, rutinas de entrenamiento y descargar cada rutina en PDF.

- **Un solo usuario:** el dueño del gimnasio entra con una contraseña guardada en `.env`.
- **Sin facturación ni pagos:** el sistema registra la cuota y su vencimiento, no procesa cobros.
- **Sin roles ni empleados:** hay un único nivel de acceso.
- **Interfaz en español**, responsive para tablet y escritorio.

## Funcionalidad

- **Panel:** socios activos, cuotas por vencer en 7 días, altas del mes, socios sin cuota vigente, distribución por plan, últimos socios y rutinas recientes.
- **Socios:** alta, edición, búsqueda por nombre/DNI/teléfono, archivo sin borrar historial.
- **Salud:** condiciones declaradas, lesiones, medicamentos, apto médico, consentimiento y notas.
- **Planes:** 3, 4 y 5 días por semana, con precio editable. Cada cuota guarda el precio histórico del plan.
- **Cuotas:** registro con plan, fechas y notas. Al cargar una nueva, la anterior queda finalizada.
- **Rutinas:** generador por objetivo, nivel, días, duración, equipamiento, deporte (incluido fútbol), edad y condiciones de salud. Se pueden previsualizar, guardar, editar a mano y regenerar.
- **PDF:** cada rutina se descarga o imprime en un documento de varias páginas.

## Stack

- **Servidor:** Node.js 22+, TypeScript, Express 5, Zod, SQLite mediante `node:sqlite` (incluido en Node, sin módulos nativos).
- **Cliente:** React 19, Vite 8, Tailwind CSS 4, React Router 7, TanStack Query, React Hook Form, Sonner y lucide-react.
- **PDF:** `@react-pdf/renderer` (sin Chromium).
- **Autenticación:** cookie `httpOnly` firmada con HMAC; contraseña validada contra `.env`, con soporte para hash `scrypt`.

## Requisitos

- Node.js **22 o superior** (probado con Node 26).
- npm.

## Puesta en marcha

```bash
npm install
cp .env.example .env
```

Editá `.env` y como mínimo completá:

```env
SESSION_SECRET=<un secreto largo y aleatorio>
OWNER_PASSWORD=<la contraseña del dueño>
```

Podés generar el secreto con:

```bash
openssl rand -hex 32
```

Luego creá la base, cargá los planes y el catálogo de ejercicios, y arrancá en desarrollo:

```bash
npm run db:setup
npm run dev
```

- Cliente: <http://localhost:5173>
- API: <http://localhost:3000>
- Vite redirige `/api` al servidor.

La base se guarda por defecto en `./data/gym.sqlite`. El servidor aplica migraciones y carga el catálogo al iniciar, así que `db:setup` solo es necesario la primera vez o para recrear datos iniciales.

## Docker

El proyecto incluye un `Dockerfile` multi-stage: compila el cliente y el servidor, elimina las dependencias de desarrollo y deja una imagen final con Node en modo producción.

```bash
docker build -t gimnasio-mvp .

docker run -d --name gimnasio \
  -p 3000:3000 \
  -v gimnasio-data:/app/data \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  -e OWNER_PASSWORD_HASH='scrypt$...' \
  -e GYM_NAME="Mi Gimnasio" \
  -e COOKIE_SECURE=false \
  gimnasio-mvp
```

Abrí <http://localhost:3000>. La base SQLite queda en el volumen `gimnasio-data` y el contenedor aplica migraciones y seed automáticamente al iniciar.

- `COOKIE_SECURE=false` es solo para acceder por **HTTP local**. Si publicás la app con HTTPS, quitá esa variable para que la cookie use `Secure` (valor por defecto en producción).
- Generá `OWNER_PASSWORD_HASH` con `npm run hash-password -- "tu-contraseña"`. También se puede usar `OWNER_PASSWORD`, aunque no es lo recomendado.
- Si accedés desde otro dominio o IP, configurá `APP_URL` con ese origen (por ejemplo `APP_URL=https://gimnasio.example.com`).
- Para inspeccionar la imagen: `docker logs -f gimnasio` y `docker inspect --format '{{.State.Health.Status}}' gimnasio`.

Con Docker Compose podés guardar esas variables en un archivo y levantar todo con:

```yaml
services:
  gimnasio:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      DATABASE_PATH: /app/data/gym.sqlite
      APP_URL: http://localhost:3000
      COOKIE_SECURE: "false"
    volumes:
      - gimnasio-data:/app/data
    restart: unless-stopped

volumes:
  gimnasio-data:
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `SESSION_SECRET` | Sí | Secreto de al menos 32 caracteres para firmar la sesión. |
| `OWNER_PASSWORD_HASH` | Una de las dos | Hash `scrypt` de la contraseña. **Recomendado en producción.** |
| `OWNER_PASSWORD` | Una de las dos | Contraseña en texto plano. Práctica para desarrollo. |
| `PORT` | No | Puerto del servidor. Por defecto `3000`. |
| `APP_URL` | No | URL del cliente para validar el origen de escrituras. Por defecto `http://localhost:5173`. |
| `DATABASE_PATH` | No | Ruta del archivo SQLite. Por defecto `./data/gym.sqlite`. |
| `COOKIE_SECURE` | No | `true`/`false`. Fuerza si la cookie de sesión requiere HTTPS. Por defecto es `true` en producción. |
| `GYM_NAME` | No | Nombre que se muestra en el panel y la marca. |
| `GYM_PHONE` | No | Teléfono del gimnasio. |
| `GYM_ADDRESS` | No | Dirección del gimnasio. |
| `TZ` | No | Zona horaria de las fechas. Por defecto `America/Argentina/Buenos_Aires`. |
| `LOG_LEVEL` | No | Nivel de logs de pino. Por defecto `info`. |
| `NODE_ENV` | No | `development`, `test` o `production`. |

### Usar hash en lugar de contraseña en texto plano

```bash
npm run hash-password -- "tu-contraseña"
```

Copiá la línea `OWNER_PASSWORD_HASH=...` en `.env`, eliminá `OWNER_PASSWORD` y reiniciá el servidor.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor y cliente en modo desarrollo. |
| `npm run dev:server` | Solo API con recarga. |
| `npm run dev:client` | Solo Vite. |
| `npm run db:migrate` | Aplica migraciones pendientes. |
| `npm run db:seed` | Carga planes y catálogo de ejercicios. |
| `npm run db:setup` | Migraciones + seed. |
| `npm run hash-password -- "clave"` | Genera un hash `scrypt` para `.env`. |
| `npm run typecheck` | Chequeo de tipos. |
| `npm test` | Tests unitarios y de API con Vitest. |
| `npm run build` | Compila cliente y servidor en `dist/`. |
| `npm start` | Sirve la app compilada desde Express. |

En producción, `npm start` sirve tanto la API como el cliente compilado. Antes de iniciar:

```bash
npm run build
npm start
```

Si el panel se publica en otro dominio, configurá `APP_URL` con ese dominio para que las escrituras no se rechacen por origen. La cookie de sesión usa `secure` cuando `NODE_ENV=production`, por lo que se requiere HTTPS.

## Estructura

```
migrations/                  Esquema SQL y migraciones
scripts/                     Migración, seed y generación de hash
src/shared/                  Tipos y esquemas Zod compartidos
src/server/
  config/                    Validación de variables de entorno
  domain/routines/           Motor puro de rutinas y catálogo de ejercicios
  infra/db/                  SQLite, migraciones y seed
  infra/pdf/                 Documento PDF de la rutina
  modules/                   Auth, socios, planes, rutinas, panel
src/client/
  components/                Layout y componentes de interfaz
  lib/                       Cliente HTTP, autenticación y utilidades
  pages/                     Login, panel, socios, planes y rutinas
tests/                       Tests unitarios y de API
```

## Cómo funciona el generador de rutinas

El motor es determinístico para una misma semilla y combina reglas con una biblioteca de 59 ejercicios:

1. Elige un split según la frecuencia (3, 4 o 5 días).
2. Filtra ejercicios por equipamiento disponible y nivel.
3. Aplica contraindicaciones según las condiciones declaradas (por ejemplo, dolor de rodilla evita flexión de rodilla e impacto).
4. Ajusta volumen, series, repeticiones, descanso y progresión según objetivo, edad y deporte.
5. Agrega trabajo preventivo y de recuperación cuando el deporte es fútbol.

Cada rutina guarda la versión, la semilla, las reglas usadas y las advertencias. Al regenerar o editar se crea una **nueva versión**; el historial anterior no se borra.

### Seguridad de salud

Si el socio declara dolor de pecho, mareos, enfermedad cardíaca, cirugía reciente o embarazo, el generador automático **se bloquea** y pide evaluación médica. Si no hay apto médico vigente, la rutina se genera con una advertencia para no entregarla sin autorización.

## Datos y privacidad

- La base SQLite y el archivo `.env` están excluidos de git (`.gitignore`).
- Los datos de salud son sensibles: el panel es de uso interno. No compartas capturas con información de socios.
- Hacé copias de seguridad del archivo `data/gym.sqlite` (y de los archivos `-wal`/`-shm` si existen) de forma periódica.
- Para mover la instalación, copiá la base y configurá `DATABASE_PATH` en el nuevo entorno.

## Alcance actual y próximos pasos

Incluido:

- Login único por contraseña.
- Socios, salud, planes, cuotas, rutinas editables y PDF.
- Panel operativo y búsqueda.

Fuera de alcance por ahora:

- Facturación, pagos y validación de comprobantes.
- Envío de recibos por WhatsApp.
- Roles, empleados y múltiples usuarios.
- Reservas de turnos, control de acceso o asistencia.

## Tests

```bash
npm test
```

Los tests cubren hashing de contraseña, fechas de cuotas, generación de rutinas (determinismo, contraindicaciones, advertencias) y el flujo de API con una base SQLite en memoria: autenticación, protección CSRF, socios, cuotas, rutinas y PDF.
