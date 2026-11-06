import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { parseCookie } from 'cookie';
import { env, isProduction, ownerPassword, ownerPasswordHash } from '../../config/env';
import { safeCompare, verifyPassword } from './password';

export const SESSION_COOKIE = 'gym_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function credentialFingerprint(): string {
  const credential = ownerPasswordHash || ownerPassword;
  return createHash('sha256')
    .update(`${credential}:${env.SESSION_SECRET}`)
    .digest('hex')
    .slice(0, 24);
}

function sign(payload: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(payload).digest('base64url');
}

export function verifyOwnerPassword(password: string): boolean {
  if (ownerPasswordHash) return verifyPassword(password, ownerPasswordHash);
  return safeCompare(password, ownerPassword);
}

export function createSessionValue(): string {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Date.now() + SESSION_DURATION_MS,
      v: credentialFingerprint(),
    }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySessionValue(value: string): boolean {
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number;
      v?: string;
    };
    if (!data.exp || data.exp < Date.now()) return false;
    return data.v === credentialFingerprint();
  } catch {
    return false;
  }
}

export function readSessionFromCookie(header: string | undefined): boolean {
  if (!header) return false;
  const cookies = parseCookie(header);
  const value = cookies[SESSION_COOKIE];
  return value ? verifySessionValue(value) : false;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction,
    path: '/',
    maxAge: SESSION_DURATION_MS,
  };
}
