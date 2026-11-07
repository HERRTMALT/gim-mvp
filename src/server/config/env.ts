import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    APP_URL: z.string().min(1).default('http://localhost:5173'),
    DATABASE_PATH: z.string().min(1).default('./data/gym.sqlite'),
    COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET debe tener al menos 32 caracteres'),
    OWNER_PASSWORD_HASH: z.string().optional(),
    OWNER_PASSWORD: z.string().optional(),
    GYM_NAME: z.string().min(1).default('Gimnasio'),
    GYM_PHONE: z.string().optional().default(''),
    GYM_ADDRESS: z.string().optional().default(''),
    TZ: z.string().default('America/Argentina/Buenos_Aires'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  })
  .refine((value) => Boolean(value.OWNER_PASSWORD_HASH || value.OWNER_PASSWORD), {
    message: 'Configurá OWNER_PASSWORD_HASH o OWNER_PASSWORD',
    path: ['OWNER_PASSWORD'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuración inválida (.env):');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
// Por defecto la cookie es Secure en producción. Se puede desactivar para
// pruebas locales por HTTP con COOKIE_SECURE=false.
export const cookieSecure = env.COOKIE_SECURE
  ? env.COOKIE_SECURE === 'true'
  : isProduction;
export const ownerPassword = env.OWNER_PASSWORD ?? '';
export const ownerPasswordHash = env.OWNER_PASSWORD_HASH ?? '';
export const allowedOrigins = new Set(
  [env.APP_URL, 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(
    Boolean,
  ),
);
