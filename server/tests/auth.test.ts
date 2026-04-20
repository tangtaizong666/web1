import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usersState = new Map<string, { id: string; email: string; password_hash: string }>();
const sessionsState = new Map<string, string>();
let sessionCounter = 0;

vi.mock('../repositories/users', () => ({
  createUser: vi.fn(async (email: string, passwordHash: string) => {
    const normalizedEmail = email.toLowerCase();
    const user = {
      id: `user-${usersState.size + 1}`,
      email: normalizedEmail,
      password_hash: passwordHash,
    };

    usersState.set(user.id, user);
    return user;
  }),
  findUserByEmail: vi.fn(async (email: string) => {
    const normalizedEmail = email.toLowerCase();
    return [...usersState.values()].find((user) => user.email === normalizedEmail) ?? null;
  }),
  findUserById: vi.fn(async (id: string) => usersState.get(id) ?? null),
}));

vi.mock('../lib/session', async () => {
  const actual = await vi.importActual<typeof import('../lib/session')>('../lib/session');

  return {
    ...actual,
    createSession: vi.fn(async (userId: string) => {
      sessionCounter += 1;
      const id = `session-${sessionCounter}`;
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
      sessionsState.set(id, userId);
      return { id, expiresAt };
    }),
    getSessionUserId: vi.fn(async (sessionId: string) => sessionsState.get(sessionId) ?? null),
    deleteSession: vi.fn(async (sessionId: string) => {
      sessionsState.delete(sessionId);
    }),
  };
});

import { createApp } from '../app';
import { authRequired } from '../middleware/authRequired';
import { getSessionUserId, COOKIE_NAME } from '../lib/session';

describe('auth routes', () => {
  beforeEach(() => {
    usersState.clear();
    sessionsState.clear();
    sessionCounter = 0;
    vi.clearAllMocks();
  });

  it('registers a user and returns the current user', async () => {
    const app = createApp();
    const agent = request.agent(app);

    const registerResponse = await agent.post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password1234',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.email).toBe('test@example.com');
    expect(registerResponse.headers['set-cookie']).toBeTruthy();

    const meResponse = await agent.get('/api/auth/me');

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe('test@example.com');
  });

  it('logs in an existing user', async () => {
    const app = createApp();
    const registerAgent = request.agent(app);

    await registerAgent.post('/api/auth/register').send({
      email: 'member@example.com',
      password: 'password1234',
    });

    const loginAgent = request.agent(app);
    const loginResponse = await loginAgent.post('/api/auth/login').send({
      email: 'member@example.com',
      password: 'password1234',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe('member@example.com');
    expect(loginResponse.headers['set-cookie']).toBeTruthy();

    const meResponse = await loginAgent.get('/api/auth/me');

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe('member@example.com');
  });

  it('rejects invalid login credentials', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: 'member@example.com',
      password: 'password1234',
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'member@example.com',
      password: 'wrongpass',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid email or password' });
  });

  it('returns 401 for me without a session', async () => {
    const app = createApp();

    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('logs out and clears the current session', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: 'logout@example.com',
      password: 'password1234',
    });

    const logoutResponse = await agent.post('/api/auth/logout');

    expect(logoutResponse.status).toBe(204);
    expect(logoutResponse.headers['set-cookie']).toBeTruthy();

    const meResponse = await agent.get('/api/auth/me');

    expect(meResponse.status).toBe(401);
    expect(meResponse.body).toEqual({ error: 'Authentication required' });
  });
});

describe('authRequired middleware', () => {
  beforeEach(() => {
    usersState.clear();
    sessionsState.clear();
    sessionCounter = 0;
    vi.clearAllMocks();
  });

  it('forwards async session lookup failures to next', async () => {
    const next = vi.fn();
    const sessionError = new Error('session lookup failed');
    vi.mocked(getSessionUserId).mockRejectedValueOnce(sessionError);

    authRequired(
      {
        cookies: {
        [COOKIE_NAME]: 'session-1',
        },
      } as never,
      {} as never,
      next,
    );

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledWith(sessionError);
    });
  });
});
