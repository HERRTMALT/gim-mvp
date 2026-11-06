import type { NextFunction, Request, Response } from 'express';
import { allowedOrigins } from '../../config/env';
import { AppError, UnauthorizedError } from '../../shared/errors';
import { readSessionFromCookie } from './service';

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  if (!readSessionFromCookie(request.headers.cookie)) {
    next(new UnauthorizedError());
    return;
  }
  next();
}

export function requireSameOrigin(request: Request, _response: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    next();
    return;
  }

  const origin = request.headers.origin;
  const fetchSite = request.headers['sec-fetch-site'];

  if (fetchSite === 'cross-site') {
    next(new AppError(403, 'CSRF', 'Origen no permitido'));
    return;
  }

  if (origin && !allowedOrigins.has(origin)) {
    next(new AppError(403, 'CSRF', 'Origen no permitido'));
    return;
  }

  next();
}
