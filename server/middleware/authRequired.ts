import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { COOKIE_NAME, getSessionUserId, readSessionCookie } from '../lib/session';

declare module 'express-serve-static-core' {
  interface Request {
    authUserId?: string;
  }
}

export function authRequired(request: Request, _response: Response, next: NextFunction) {
  void (async () => {
    const sessionId = readSessionCookie(request.cookies[COOKIE_NAME]);

    if (!sessionId) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    const userId = await getSessionUserId(sessionId);

    if (!userId) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    request.authUserId = userId;
    next();
  })().catch(next);
}
