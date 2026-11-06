import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env';
import { parseBody } from '../../shared/validation';
import { loginSchema } from '../../../shared/schemas';
import { requireAuth } from './middleware';
import {
  SESSION_COOKIE,
  createSessionValue,
  sessionCookieOptions,
  verifyOwnerPassword,
} from './service';
import { UnauthorizedError } from '../../shared/errors';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.',
    },
  },
});

authRouter.post('/login', loginLimiter, (request, response) => {
  const { password } = parseBody(loginSchema, request.body);

  if (!verifyOwnerPassword(password)) {
    throw new UnauthorizedError('Contraseña incorrecta');
  }

  response.cookie(SESSION_COOKIE, createSessionValue(), sessionCookieOptions());
  response.json({ ok: true });
});

authRouter.post('/logout', (_request, response) => {
  response.clearCookie(SESSION_COOKIE, { path: '/' });
  response.json({ ok: true });
});

authRouter.get('/me', requireAuth, (_request, response) => {
  response.json({
    authenticated: true,
    gymName: env.GYM_NAME,
    gymPhone: env.GYM_PHONE,
  });
});
