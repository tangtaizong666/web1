import { Router } from 'express';
import { ZodError, z } from 'zod';
import { AppError } from '../lib/errors';
import { hashPassword, verifyPassword } from '../lib/passwords';
import {
  clearSessionCookie,
  COOKIE_NAME,
  createSession,
  deleteSession,
  getSessionUserId,
  readSessionCookie,
  setSessionCookie,
} from '../lib/session';
import { createUser, findUserByEmail, findUserById } from '../repositories/users';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRouter = Router();

function presentUser(user: { id: string; email: string }) {
  return { id: user.id, email: user.email };
}

authRouter.post('/register', async (request, response, next) => {
  try {
    const { email, password } = credentialsSchema.parse(request.body);
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }

    const user = await createUser(email, await hashPassword(password));
    const session = await createSession(user.id);
    setSessionCookie(response, session.id, session.expiresAt);

    response.status(201).json({ user: presentUser(user) });
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError(400, 'Invalid email or password'));
      return;
    }

    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
  try {
    const { email, password } = credentialsSchema.parse(request.body);
    const user = await findUserByEmail(email);

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new AppError(401, 'Invalid email or password');
    }

    const session = await createSession(user.id);
    setSessionCookie(response, session.id, session.expiresAt);

    response.json({ user: presentUser(user) });
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError(400, 'Invalid email or password'));
      return;
    }

    next(error);
  }
});

authRouter.post('/logout', async (request, response, next) => {
  try {
    const sessionId = readSessionCookie(request.cookies[COOKIE_NAME]);

    if (sessionId) {
      await deleteSession(sessionId);
    }

    clearSessionCookie(response);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', async (request, response, next) => {
  try {
    const sessionId = readSessionCookie(request.cookies[COOKIE_NAME]);

    if (!sessionId) {
      throw new AppError(401, 'Authentication required');
    }

    const userId = await getSessionUserId(sessionId);

    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const user = await findUserById(userId);

    if (!user) {
      throw new AppError(401, 'Authentication required');
    }

    response.json({ user: presentUser(user) });
  } catch (error) {
    next(error);
  }
});
