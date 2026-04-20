import crypto from 'node:crypto';
import type { Response } from 'express';
import { env } from '../config/env';
import { pool } from '../db/pool';

const COOKIE_NAME = 'campus_cycle_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export async function createSession(userId: string) {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await pool.query(`insert into sessions (id, user_id, expires_at) values ($1, $2, $3)`, [id, userId, expiresAt]);

  return { id, expiresAt };
}

export async function getSessionUserId(sessionId: string) {
  const result = await pool.query<{ user_id: string }>(
    `select user_id from sessions where id = $1 and expires_at > now()`,
    [sessionId],
  );

  return result.rows[0]?.user_id ?? null;
}

export async function deleteSession(sessionId: string) {
  await pool.query(`delete from sessions where id = $1`, [sessionId]);
}

export function setSessionCookie(response: Response, sessionId: string, expiresAt: Date) {
  response.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  });
}

export function readSessionCookie(cookieValue: unknown) {
  return typeof cookieValue === 'string' && cookieValue ? cookieValue : null;
}

export { COOKIE_NAME };
