import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { env, isProduction } from './config/env';
import { AppError } from './shared/errors';
import { requireAuth, requireSameOrigin } from './modules/auth/middleware';
import { authRouter } from './modules/auth/routes';
import { dashboardRouter } from './modules/dashboard/routes';
import { membersRouter } from './modules/members/routes';
import { plansRouter } from './modules/plans/routes';
import {
  exercisesRouter,
  memberRoutinesRouter,
  routinesRouter,
} from './modules/routines/routes';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      },
});

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, app: 'gimnasio-mvp' });
  });

  app.use('/api', requireSameOrigin);
  app.use('/api/auth', authRouter);

  app.use('/api', requireAuth);
  app.use('/api/members/:memberId/routines', memberRoutinesRouter);
  app.use('/api/members', membersRouter);
  app.use('/api/plans', plansRouter);
  app.use('/api/routines', routinesRouter);
  app.use('/api/exercises', exercisesRouter);
  app.use('/api/dashboard', dashboardRouter);

  app.use('/api', (_request, response) => {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado' },
    });
  });

  const clientDir = join(process.cwd(), 'dist/client');
  if (existsSync(clientDir)) {
    app.use(express.static(clientDir, { index: false }));
    app.use((request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith('/api')) {
        next();
        return;
      }
      response.sendFile(join(clientDir, 'index.html'));
    });
  }

  app.use((error: unknown, request: Request, response: Response, _next: NextFunction) => {
    const requestLogger = (request as Request & { log?: typeof logger }).log ?? logger;

    if (error instanceof AppError) {
      requestLogger.warn({ err: error, code: error.code }, error.message);
      response.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
      return;
    }

    requestLogger.error({ err: error }, 'Error no controlado');
    response.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error inesperado. Intentá de nuevo.',
      },
    });
  });

  return app;
}
