# AI Backend + Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password authentication, user-isolated AI conversations, backend relay model access, and attachment-aware chat to the existing `/ai` experience.

**Architecture:** Keep the current Vite + React app as the frontend and add an Express API inside the same repository. Use PostgreSQL for users, conversations, messages, and attachments; keep the AI relay key on the server; scope AI memory to the active conversation only.

**Tech Stack:** Vite, React, TypeScript, Express, PostgreSQL, session cookies, multipart uploads

---

## File structure map

### Existing files to modify
- `package.json` — add backend, database, auth, upload, and test scripts/dependencies
- `.env.example` — replace Gemini-only sample vars with backend/auth/database/relay env vars
- `src/App.tsx` — route auth-aware AI page and any added auth pages
- `src/main.tsx` — wrap app with auth/query providers if added
- `src/pages/Home.tsx` — add top-left login entry and logged-in account actions
- `src/pages/AIAssistant.tsx` — replace mock state with authenticated chat UI wired to backend APIs
- `src/index.css` — add any auth/chat/loading styles only if needed

### New backend files
- `server/index.ts` — start Express server
- `server/app.ts` — assemble middleware and routes
- `server/config/env.ts` — read and validate environment variables
- `server/db/pool.ts` — PostgreSQL connection pool
- `server/db/migrations/001_init.sql` — users, conversations, messages, attachments, sessions tables
- `server/db/runMigrations.ts` — simple migration runner
- `server/lib/passwords.ts` — password hash/verify helpers
- `server/lib/session.ts` — cookie/session helpers
- `server/lib/uploads.ts` — file upload config and validation
- `server/lib/storage.ts` — attachment storage boundary
- `server/lib/relayClient.ts` — AI relay API client
- `server/lib/transcription.ts` — audio-to-text boundary
- `server/lib/errors.ts` — HTTP-safe app error helpers
- `server/middleware/authRequired.ts` — require authenticated user
- `server/middleware/errorHandler.ts` — consistent JSON errors
- `server/routes/auth.ts` — register/login/logout/me endpoints
- `server/routes/conversations.ts` — list/create/read conversation endpoints
- `server/routes/messages.ts` — list/send message endpoints
- `server/routes/uploads.ts` — image/file/audio upload endpoints
- `server/repositories/users.ts` — users table queries
- `server/repositories/conversations.ts` — conversations table queries
- `server/repositories/messages.ts` — messages table queries
- `server/repositories/attachments.ts` — attachments table queries
- `server/types/index.ts` — shared backend types

### New frontend files
- `src/lib/api.ts` — frontend fetch wrapper with credentials included
- `src/lib/auth.ts` — auth API calls
- `src/lib/chat.ts` — conversations/messages/upload API calls
- `src/types/chat.ts` — frontend chat/auth types
- `src/components/auth/AuthModal.tsx` — register/login modal
- `src/components/auth/AuthGate.tsx` — block unauthenticated AI access with login prompt
- `src/components/ai/ConversationSidebar.tsx` — conversation list and new chat button
- `src/components/ai/ChatComposer.tsx` — text + attachment input UI
- `src/components/ai/MessageList.tsx` — message rendering
- `src/components/ai/AttachmentPreview.tsx` — uploaded attachment UI
- `src/hooks/useAuth.ts` — current-user auth state and actions
- `src/hooks/useConversations.ts` — list/create/select conversation state
- `src/hooks/useConversationMessages.ts` — load/send messages for one conversation

### New tests
- `server/tests/auth.test.ts` — register/login/logout/me
- `server/tests/conversations.test.ts` — ownership and list/create/read flows
- `server/tests/messages.test.ts` — message send and reply persistence
- `server/tests/uploads.test.ts` — file type/size validation
- `src/components/auth/AuthModal.test.tsx` — auth modal behavior
- `src/pages/AIAssistant.test.tsx` — new chat, switch chat, unauthenticated gate

## Common commands

Use these commands once the corresponding scripts are added in Task 1:

- Install deps: `npm install`
- Frontend dev server: `npm run dev`
- Backend dev server: `npm run dev:server`
- Run both in parallel: `npm run dev:full`
- Typecheck frontend + backend: `npm run lint`
- Run backend tests: `npm run test:server`
- Run frontend tests: `npm run test:client`
- Run all tests: `npm run test`
- Run one backend test file: `npm run test:server -- auth.test.ts`
- Run one frontend test file: `npm run test:client -- AIAssistant.test.tsx`
- Run migrations: `npm run db:migrate`

---

### Task 0: Initialize git metadata if the directory is still not a repository

**Files:**
- Create: `.git/` metadata via `git init`

- [ ] **Step 1: Check whether git is already initialized**

Run: `git rev-parse --is-inside-work-tree`
Expected: prints `true` if git is already initialized, otherwise exits non-zero.

- [ ] **Step 2: Initialize git only if needed**

Run: `git init`
Expected: prints `Initialized empty Git repository`.

- [ ] **Step 3: Create the first baseline commit after Task 1 instead of before it**

Use the Task 1 commit as the first repository commit if this directory was not previously under git.

### Task 1: Set up backend, test, and environment scaffolding

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `.gitignore`
- Create: `server/index.ts`
- Create: `server/app.ts`
- Create: `server/config/env.ts`
- Create: `server/db/pool.ts`
- Create: `server/db/runMigrations.ts`
- Create: `server/lib/errors.ts`
- Create: `server/middleware/errorHandler.ts`
- Test: `server/tests/app.smoke.test.ts`

- [ ] **Step 1: Write the failing smoke test**

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('app smoke test', () => {
  it('returns 404 json for unknown routes', async () => {
    const app = createApp();
    const response = await request(app).get('/missing-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Not Found',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:server -- app.smoke.test.ts`
Expected: FAIL because `test:server`, `server/app.ts`, or test runner is not configured.

- [ ] **Step 3: Update `package.json` scripts and dependencies**

```json
{
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "dev:server": "tsx watch server/index.ts",
    "dev:full": "concurrently \"npm run dev\" \"npm run dev:server\"",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit && tsc -p server/tsconfig.json --noEmit",
    "test": "npm run test:server && npm run test:client",
    "test:server": "vitest run --config server/vitest.config.ts",
    "test:client": "vitest run --config vitest.config.ts",
    "db:migrate": "tsx server/db/runMigrations.ts"
  },
  "dependencies": {
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.13.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "concurrently": "^9.1.2",
    "supertest": "^7.0.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 4: Add backend TypeScript config**

Create `server/tsconfig.json`:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "rootDir": ".",
    "outDir": "../build/server",
    "noEmit": true
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 5: Add shared app bootstrap files**

Create `server/app.ts`:

```ts
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.use((_request, response) => {
    response.status(404).json({ error: 'Not Found' });
  });

  app.use(errorHandler);

  return app;
}
```

Create `server/index.ts`:

```ts
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.SERVER_PORT, () => {
  console.log(`API listening on http://localhost:${env.SERVER_PORT}`);
});
```

Create `server/config/env.ts`:

```ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVER_PORT: z.coerce.number().default(4000),
  APP_URL: z.string().min(1).default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1).default('postgres://postgres:postgres@localhost:5432/campus_cycle'),
  SESSION_SECRET: z.string().min(32).default('development-session-secret-change-me'),
  AI_RELAY_BASE_URL: z.string().min(1).default('http://localhost:6543'),
  AI_RELAY_API_KEY: z.string().min(1).default('development-key'),
  AI_MODEL: z.string().min(1).default('gpt-5'),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(10),
});

export const env = envSchema.parse(process.env);
```

Create `server/lib/errors.ts`:

```ts
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

Create `server/middleware/errorHandler.ts`:

```ts
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: 'Internal Server Error' });
}
```

Create `server/db/pool.ts`:

```ts
import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
```

Create `server/db/runMigrations.ts`:

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './pool';

async function run() {
  const migrationsDir = path.resolve('server/db/migrations');
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`Applied ${file}`);
  }

  await pool.end();
}

void run();
```

- [ ] **Step 6: Update `.env.example` for the new backend shape**

```env
APP_URL="http://localhost:3000"
SERVER_PORT="4000"
DATABASE_URL="postgres://postgres:postgres@localhost:5432/campus_cycle"
SESSION_SECRET="replace-with-a-long-random-string"
AI_RELAY_BASE_URL="http://wucur.com:6543"
AI_RELAY_API_KEY="replace-me"
AI_MODEL="gpt-5"
UPLOAD_DIR="uploads"
MAX_UPLOAD_SIZE_MB="10"
```

- [ ] **Step 7: Keep uploads out of git**

Update `.gitignore` to include:

```gitignore
uploads/
build/
```

- [ ] **Step 8: Add test configs**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

Create `server/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
});
```

- [ ] **Step 9: Run the smoke test and typecheck**

Run: `npm run test:server -- app.smoke.test.ts && npm run lint`
Expected: PASS for `app.smoke.test.ts`; typecheck may still fail later files not yet added, but Task 1 files should be valid.

- [ ] **Step 10: Commit**

```bash
git add package.json .env.example .gitignore server/index.ts server/app.ts server/config/env.ts server/db/pool.ts server/db/runMigrations.ts server/lib/errors.ts server/middleware/errorHandler.ts server/tsconfig.json vitest.config.ts server/vitest.config.ts server/tests/app.smoke.test.ts
git commit -m "chore: scaffold backend app and tooling"
```

### Task 2: Add database schema and repository layer

**Files:**
- Create: `server/db/migrations/001_init.sql`
- Create: `server/repositories/users.ts`
- Create: `server/repositories/conversations.ts`
- Create: `server/repositories/messages.ts`
- Create: `server/repositories/attachments.ts`
- Create: `server/types/index.ts`
- Test: `server/tests/repositories.test.ts`

- [ ] **Step 1: Write the failing repository test**

```ts
import { describe, expect, it } from 'vitest';
import { buildConversationTitle } from '../repositories/conversations';

describe('buildConversationTitle', () => {
  it('trims long prompts for default titles', () => {
    expect(
      buildConversationTitle('这是一个很长很长的首条消息，用于验证标题只截取前二十个字符'),
    ).toBe('这是一个很长很长的首条消息，用于验证标题…');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:server -- repositories.test.ts`
Expected: FAIL because repository files do not exist.

- [ ] **Step 3: Add initial SQL schema**

Create `server/db/migrations/001_init.sql`:

```sql
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  kind text not null check (kind in ('image', 'file', 'audio')),
  original_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  storage_path text not null,
  extracted_text text,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 4: Add backend shared types**

Create `server/types/index.ts`:

```ts
export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

export type ConversationRecord = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type MessageRole = 'user' | 'assistant';

export type MessageRecord = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
};

export type AttachmentKind = 'image' | 'file' | 'audio';

export type AttachmentRecord = {
  id: string;
  message_id: string;
  kind: AttachmentKind;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  extracted_text: string | null;
  created_at: string;
};
```

- [ ] **Step 5: Add repository files**

Create `server/repositories/conversations.ts`:

```ts
import { pool } from '../db/pool';
import type { ConversationRecord } from '../types';

export function buildConversationTitle(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return '新对话';
  }
  return trimmed.length > 20 ? `${trimmed.slice(0, 20)}…` : trimmed;
}

export async function createConversation(userId: string, title = '新对话') {
  const result = await pool.query<ConversationRecord>(
    `insert into conversations (user_id, title) values ($1, $2) returning *`,
    [userId, title],
  );

  return result.rows[0];
}

export async function listConversations(userId: string) {
  const result = await pool.query<ConversationRecord>(
    `select * from conversations where user_id = $1 order by coalesce(last_message_at, created_at) desc`,
    [userId],
  );

  return result.rows;
}

export async function findConversationById(id: string) {
  const result = await pool.query<ConversationRecord>(`select * from conversations where id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function updateConversationTitle(id: string, title: string) {
  const result = await pool.query<ConversationRecord>(
    `update conversations set title = $2, updated_at = now() where id = $1 returning *`,
    [id, title],
  );
  return result.rows[0];
}

export async function touchConversation(id: string) {
  await pool.query(
    `update conversations set updated_at = now(), last_message_at = now() where id = $1`,
    [id],
  );
}
```

Create `server/repositories/users.ts`:

```ts
import { pool } from '../db/pool';
import type { UserRecord } from '../types';

export async function createUser(email: string, passwordHash: string) {
  const result = await pool.query<UserRecord>(
    `insert into users (email, password_hash) values ($1, $2) returning *`,
    [email.toLowerCase(), passwordHash],
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string) {
  const result = await pool.query<UserRecord>(`select * from users where email = $1`, [email.toLowerCase()]);
  return result.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await pool.query<UserRecord>(`select * from users where id = $1`, [id]);
  return result.rows[0] ?? null;
}
```

Create `server/repositories/messages.ts`:

```ts
import { pool } from '../db/pool';
import type { MessageRecord, MessageRole } from '../types';

export async function createMessage(conversationId: string, role: MessageRole, content: string) {
  const result = await pool.query<MessageRecord>(
    `insert into messages (conversation_id, role, content) values ($1, $2, $3) returning *`,
    [conversationId, role, content],
  );
  return result.rows[0];
}

export async function listMessages(conversationId: string) {
  const result = await pool.query<MessageRecord>(
    `select * from messages where conversation_id = $1 order by created_at asc`,
    [conversationId],
  );
  return result.rows;
}
```

Create `server/repositories/attachments.ts`:

```ts
import { pool } from '../db/pool';
import type { AttachmentKind, AttachmentRecord } from '../types';

export async function createAttachment(
  messageId: string,
  kind: AttachmentKind,
  originalName: string,
  mimeType: string,
  sizeBytes: number,
  storagePath: string,
  extractedText: string | null = null,
) {
  const result = await pool.query<AttachmentRecord>(
    `insert into attachments (message_id, kind, original_name, mime_type, size_bytes, storage_path, extracted_text)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [messageId, kind, originalName, mimeType, sizeBytes, storagePath, extractedText],
  );

  return result.rows[0];
}

export async function listAttachments(messageId: string) {
  const result = await pool.query<AttachmentRecord>(
    `select * from attachments where message_id = $1 order by created_at asc`,
    [messageId],
  );
  return result.rows;
}
```

- [ ] **Step 6: Run the repository test and migration command**

Run: `npm run test:server -- repositories.test.ts && npm run db:migrate`
Expected: PASS for `repositories.test.ts`; migration prints `Applied 001_init.sql`.

- [ ] **Step 7: Commit**

```bash
git add server/db/migrations/001_init.sql server/repositories/users.ts server/repositories/conversations.ts server/repositories/messages.ts server/repositories/attachments.ts server/types/index.ts server/tests/repositories.test.ts
git commit -m "feat: add chat persistence schema"
```

### Task 3: Add authentication backend

**Files:**
- Create: `server/lib/passwords.ts`
- Create: `server/lib/session.ts`
- Create: `server/middleware/authRequired.ts`
- Create: `server/routes/auth.ts`
- Modify: `server/app.ts`
- Test: `server/tests/auth.test.ts`

- [ ] **Step 1: Write the failing auth test**

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('auth routes', () => {
  it('registers a user and returns the current user', async () => {
    const app = createApp();

    const registerResponse = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password1234',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.email).toBe('test@example.com');
    expect(registerResponse.headers['set-cookie']).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:server -- auth.test.ts`
Expected: FAIL because auth routes are not registered.

- [ ] **Step 3: Add password and session helpers**

Create `server/lib/passwords.ts`:

```ts
import crypto from 'node:crypto';

const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}
```

Create `server/lib/session.ts`:

```ts
import crypto from 'node:crypto';
import type { Response } from 'express';
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
    secure: false,
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(COOKIE_NAME);
}

export function readSessionCookie(cookieValue: unknown) {
  return typeof cookieValue === 'string' && cookieValue ? cookieValue : null;
}

export { COOKIE_NAME };
```

Create `server/middleware/authRequired.ts`:

```ts
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { readSessionCookie, getSessionUserId, COOKIE_NAME } from '../lib/session';

declare module 'express-serve-static-core' {
  interface Request {
    authUserId?: string;
  }
}

export async function authRequired(request: Request, _response: Response, next: NextFunction) {
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
}
```

- [ ] **Step 4: Add auth routes**

Create `server/routes/auth.ts`:

```ts
import { Router } from 'express';
import { z } from 'zod';
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

authRouter.post('/register', async (request, response, next) => {
  try {
    const { email, password } = credentialsSchema.parse(request.body);
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }

    const user = await createUser(email, hashPassword(password));
    const session = await createSession(user.id);
    setSessionCookie(response, session.id, session.expiresAt);

    response.status(201).json({
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
  try {
    const { email, password } = credentialsSchema.parse(request.body);
    const user = await findUserByEmail(email);

    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new AppError(401, 'Invalid email or password');
    }

    const session = await createSession(user.id);
    setSessionCookie(response, session.id, session.expiresAt);

    response.json({
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
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
      response.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userId = await getSessionUserId(sessionId);
    if (!userId) {
      response.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      response.status(401).json({ error: 'Authentication required' });
      return;
    }

    response.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 5: Register auth routes in the app**

Update `server/app.ts` to include:

```ts
import { authRouter } from './routes/auth';

app.use('/api/auth', authRouter);
```

Insert it after JSON middleware and before the 404 handler.

- [ ] **Step 6: Run auth test**

Run: `npm run test:server -- auth.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/lib/passwords.ts server/lib/session.ts server/middleware/authRequired.ts server/routes/auth.ts server/app.ts server/tests/auth.test.ts
git commit -m "feat: add email authentication"
```

### Task 4: Add conversations and message APIs with per-conversation memory

**Files:**
- Create: `server/lib/relayClient.ts`
- Create: `server/routes/conversations.ts`
- Create: `server/routes/messages.ts`
- Modify: `server/app.ts`
- Modify: `server/repositories/conversations.ts`
- Test: `server/tests/conversations.test.ts`
- Test: `server/tests/messages.test.ts`

- [ ] **Step 1: Write failing conversation API test**

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('conversation routes', () => {
  it('rejects unauthenticated conversation listing', async () => {
    const app = createApp();
    const response = await request(app).get('/api/conversations');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });
});
```

- [ ] **Step 2: Write failing message API test**

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('message routes', () => {
  it('rejects unauthenticated message posting', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/conversations/conversation-id/messages')
      .send({ content: '你好' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:server -- conversations.test.ts && npm run test:server -- messages.test.ts`
Expected: FAIL because routes do not exist.

- [ ] **Step 4: Add relay client**

Create `server/lib/relayClient.ts`:

```ts
import { env } from '../config/env';
import { AppError } from './errors';

type RelayMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function generateAssistantReply(messages: RelayMessage[]) {
  const response = await fetch(`${env.AI_RELAY_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_RELAY_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      messages,
    }),
  });

  if (!response.ok) {
    throw new AppError(502, 'AI relay request failed');
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new AppError(502, 'AI relay returned empty content');
  }

  return content;
}
```

- [ ] **Step 5: Add conversation and message routes**

Create `server/routes/conversations.ts`:

```ts
import { Router } from 'express';
import { authRequired } from '../middleware/authRequired';
import { AppError } from '../lib/errors';
import { createConversation, findConversationById, listConversations } from '../repositories/conversations';

export const conversationsRouter = Router();

conversationsRouter.use(authRequired);

conversationsRouter.get('/', async (request, response, next) => {
  try {
    const conversations = await listConversations(request.authUserId!);
    response.json({ conversations });
  } catch (error) {
    next(error);
  }
});

conversationsRouter.post('/', async (request, response, next) => {
  try {
    const conversation = await createConversation(request.authUserId!);
    response.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
});

conversationsRouter.get('/:id', async (request, response, next) => {
  try {
    const conversation = await findConversationById(request.params.id);
    if (!conversation || conversation.user_id !== request.authUserId) {
      throw new AppError(404, 'Conversation not found');
    }

    response.json({ conversation });
  } catch (error) {
    next(error);
  }
});
```

Create `server/routes/messages.ts`:

```ts
import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/authRequired';
import { AppError } from '../lib/errors';
import { generateAssistantReply } from '../lib/relayClient';
import { findConversationById, buildConversationTitle, touchConversation, updateConversationTitle } from '../repositories/conversations';
import { createMessage, listMessages } from '../repositories/messages';

const sendMessageSchema = z.object({
  content: z.string().trim().min(1),
});

export const messagesRouter = Router();

messagesRouter.use(authRequired);

messagesRouter.get('/conversations/:id/messages', async (request, response, next) => {
  try {
    const conversation = await findConversationById(request.params.id);
    if (!conversation || conversation.user_id !== request.authUserId) {
      throw new AppError(404, 'Conversation not found');
    }

    const messages = await listMessages(conversation.id);
    response.json({ messages });
  } catch (error) {
    next(error);
  }
});

messagesRouter.post('/conversations/:id/messages', async (request, response, next) => {
  try {
    const conversation = await findConversationById(request.params.id);
    if (!conversation || conversation.user_id !== request.authUserId) {
      throw new AppError(404, 'Conversation not found');
    }

    const { content } = sendMessageSchema.parse(request.body);
    const existingMessages = await listMessages(conversation.id);
    const userMessage = await createMessage(conversation.id, 'user', content);

    if (existingMessages.length === 0 && conversation.title === '新对话') {
      await updateConversationTitle(conversation.id, buildConversationTitle(content));
    }

    const relayMessages = [
      {
        role: 'system' as const,
        content: '你是校园旧衣循环平台的 AI 助手，回答应简洁、友好、对环保主题有帮助。',
      },
      ...existingMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: 'user' as const, content },
    ];

    const assistantContent = await generateAssistantReply(relayMessages);
    const assistantMessage = await createMessage(conversation.id, 'assistant', assistantContent);
    await touchConversation(conversation.id);

    response.status(201).json({ userMessage, assistantMessage });
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 6: Register routes in `server/app.ts`**

Add imports and route registration:

```ts
import { conversationsRouter } from './routes/conversations';
import { messagesRouter } from './routes/messages';

app.use('/api/conversations', conversationsRouter);
app.use('/api', messagesRouter);
```

- [ ] **Step 7: Run conversation and message tests**

Run: `npm run test:server -- conversations.test.ts && npm run test:server -- messages.test.ts`
Expected: PASS for unauthenticated coverage; add authenticated/ownership assertions in the same files before closing the task.

- [ ] **Step 8: Commit**

```bash
git add server/lib/relayClient.ts server/routes/conversations.ts server/routes/messages.ts server/app.ts server/tests/conversations.test.ts server/tests/messages.test.ts server/repositories/conversations.ts
git commit -m "feat: add ai conversation endpoints"
```

### Task 5: Add upload pipeline for file, image, and audio inputs

**Files:**
- Create: `server/lib/uploads.ts`
- Create: `server/lib/storage.ts`
- Create: `server/lib/transcription.ts`
- Create: `server/routes/uploads.ts`
- Modify: `server/app.ts`
- Test: `server/tests/uploads.test.ts`

- [ ] **Step 1: Write the failing upload validation test**

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('upload routes', () => {
  it('rejects unauthenticated upload access', async () => {
    const app = createApp();
    const response = await request(app).post('/api/uploads');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:server -- uploads.test.ts`
Expected: FAIL because upload routes do not exist.

- [ ] **Step 3: Add upload and storage helpers**

Create `server/lib/uploads.ts`:

```ts
import multer from 'multer';
import path from 'node:path';
import { env } from '../config/env';
import { AppError } from './errors';

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/pdf',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, 'Unsupported file type'));
      return;
    }
    callback(null, true);
  },
});

export function detectAttachmentKind(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'image' as const;
  if (mimeType.startsWith('audio/')) return 'audio' as const;
  return 'file' as const;
}

export function sanitizeFilename(filename: string) {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}
```

Create `server/lib/storage.ts`:

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { sanitizeFilename } from './uploads';

export async function saveUploadedBuffer(filename: string, buffer: Buffer) {
  const safeFilename = `${Date.now()}-${sanitizeFilename(filename)}`;
  const absoluteDir = path.resolve(env.UPLOAD_DIR);
  await fs.mkdir(absoluteDir, { recursive: true });
  const absolutePath = path.join(absoluteDir, safeFilename);
  await fs.writeFile(absolutePath, buffer);
  return path.join(env.UPLOAD_DIR, safeFilename);
}
```

Create `server/lib/transcription.ts`:

```ts
import fs from 'node:fs/promises';
import { env } from '../config/env';
import { AppError } from './errors';

export async function transcribeAudio(filePath: string) {
  const fileBuffer = await fs.readFile(filePath);
  const response = await fetch(`${env.AI_RELAY_BASE_URL}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.AI_RELAY_API_KEY}`,
    },
    body: (() => {
      const formData = new FormData();
      formData.append('model', env.AI_MODEL);
      formData.append('file', new Blob([fileBuffer]), filePath.split('/').pop() ?? 'audio.webm');
      return formData;
    })(),
  });

  if (!response.ok) {
    throw new AppError(502, 'Audio transcription failed');
  }

  const data = (await response.json()) as { text?: string };
  const text = data.text?.trim();
  if (!text) {
    throw new AppError(502, 'Audio transcription returned empty text');
  }

  return text;
}
```

- [ ] **Step 4: Add upload route**

Create `server/routes/uploads.ts`:

```ts
import { Router } from 'express';
import { authRequired } from '../middleware/authRequired';
import { upload, detectAttachmentKind } from '../lib/uploads';
import { saveUploadedBuffer } from '../lib/storage';
import { transcribeAudio } from '../lib/transcription';

export const uploadsRouter = Router();

uploadsRouter.use(authRequired);

uploadsRouter.post('/', upload.single('file'), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: 'File is required' });
      return;
    }

    const kind = detectAttachmentKind(request.file.mimetype);
    const storagePath = await saveUploadedBuffer(request.file.originalname, request.file.buffer);
    const extractedText = kind === 'audio' ? await transcribeAudio(storagePath) : null;

    response.status(201).json({
      attachment: {
        kind,
        originalName: request.file.originalname,
        mimeType: request.file.mimetype,
        sizeBytes: request.file.size,
        storagePath,
        extractedText,
      },
    });
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 5: Register route in app**

Add to `server/app.ts`:

```ts
import { uploadsRouter } from './routes/uploads';

app.use('/api/uploads', uploadsRouter);
```

- [ ] **Step 6: Run upload tests**

Run: `npm run test:server -- uploads.test.ts`
Expected: PASS for unauthenticated coverage; extend test file with supported/unsupported MIME assertions before closing the task.

- [ ] **Step 7: Commit**

```bash
git add server/lib/uploads.ts server/lib/storage.ts server/lib/transcription.ts server/routes/uploads.ts server/app.ts server/tests/uploads.test.ts
git commit -m "feat: add upload pipeline"
```

### Task 6: Add frontend auth state and homepage login entry

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/lib/auth.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/components/auth/AuthModal.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/main.tsx`
- Test: `src/components/auth/AuthModal.test.tsx`

- [ ] **Step 1: Write the failing auth modal test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';

describe('AuthModal', () => {
  it('submits email and password for login', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AuthModal mode="login" onClose={() => {}} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@example.com', password: 'password123' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:client -- AuthModal.test.tsx`
Expected: FAIL because auth modal does not exist.

- [ ] **Step 3: Add frontend API and auth helpers**

Create `src/lib/api.ts`:

```ts
export async function apiRequest<T>(input: string, init?: RequestInit) {
  const response = await fetch(`http://localhost:4000${input}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
```

Create `src/lib/auth.ts`:

```ts
import { apiRequest } from './api';

export type AuthPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

export async function fetchCurrentUser() {
  return apiRequest<{ user: AuthUser }>('/api/auth/me');
}

export async function login(payload: AuthPayload) {
  return apiRequest<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function register(payload: AuthPayload) {
  return apiRequest<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  });
}
```

- [ ] **Step 4: Add auth hook and modal**

Create `src/hooks/useAuth.ts`:

```ts
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, login, logout, register, type AuthPayload, type AuthUser } from '../lib/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  loginUser: (payload: AuthPayload) => Promise<void>;
  registerUser: (payload: AuthPayload) => Promise<void>;
  logoutUser: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    try {
      const result = await fetchCurrentUser();
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async loginUser(payload) {
        const result = await login(payload);
        setUser(result.user);
      },
      async registerUser(payload) {
        const result = await register(payload);
        setUser(result.user);
      },
      async logoutUser() {
        await logout();
        setUser(null);
      },
      refresh,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
```

Create `src/components/auth/AuthModal.tsx`:

```tsx
import { useState } from 'react';
import type { AuthPayload } from '../../lib/auth';

export function AuthModal({
  mode,
  onClose,
  onSubmit,
}: {
  mode: 'login' | 'register';
  onClose: () => void;
  onSubmit: (payload: AuthPayload) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const title = mode === 'login' ? '登录' : '注册';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-serif text-brand-900">{title}</h2>
          <button onClick={onClose} className="text-sm text-brand-500">关闭</button>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            setError('');
            try {
              await onSubmit({ email, password });
              onClose();
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : '提交失败');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <label className="block text-sm text-brand-700">
            邮箱
            <input
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-3"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block text-sm text-brand-700">
            密码
            <input
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-3"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-900 px-4 py-3 text-brand-50"
          >
            {submitting ? '提交中...' : title}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wrap the app with auth provider**

Update `src/main.tsx` to:

```tsx
import { AuthProvider } from './hooks/useAuth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
```

- [ ] **Step 6: Add top-left login entry in `src/pages/Home.tsx`**

Insert near the top of the page layout:

```tsx
import { useState } from 'react';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../hooks/useAuth';
```

Add state and auth access inside `Home()`:

```tsx
const { user, loginUser, registerUser, logoutUser } = useAuth();
const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
```

Add top-left floating account block inside the main wrapper:

```tsx
<div className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/90 px-3 py-2 shadow-sm backdrop-blur">
  {user ? (
    <>
      <span className="text-sm text-brand-700">{user.email}</span>
      <button onClick={() => void logoutUser()} className="text-sm text-brand-900">
        退出
      </button>
    </>
  ) : (
    <>
      <button onClick={() => setAuthMode('login')} className="text-sm text-brand-900">
        登录
      </button>
      <button onClick={() => setAuthMode('register')} className="text-sm text-brand-500">
        注册
      </button>
    </>
  )}
</div>

{authMode ? (
  <AuthModal
    mode={authMode}
    onClose={() => setAuthMode(null)}
    onSubmit={authMode === 'login' ? loginUser : registerUser}
  />
) : null}
```

- [ ] **Step 7: Run frontend auth test**

Run: `npm run test:client -- AuthModal.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/api.ts src/lib/auth.ts src/hooks/useAuth.ts src/components/auth/AuthModal.tsx src/pages/Home.tsx src/main.tsx src/components/auth/AuthModal.test.tsx
git commit -m "feat: add frontend auth flow"
```

### Task 7: Replace mock AI page with real conversation UI

**Files:**
- Create: `src/types/chat.ts`
- Create: `src/lib/chat.ts`
- Create: `src/hooks/useConversations.ts`
- Create: `src/hooks/useConversationMessages.ts`
- Create: `src/components/auth/AuthGate.tsx`
- Create: `src/components/ai/ConversationSidebar.tsx`
- Create: `src/components/ai/MessageList.tsx`
- Create: `src/components/ai/ChatComposer.tsx`
- Create: `src/components/ai/AttachmentPreview.tsx`
- Modify: `src/pages/AIAssistant.tsx`
- Test: `src/pages/AIAssistant.test.tsx`

- [ ] **Step 1: Write the failing AI page test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AIAssistant from './AIAssistant';

describe('AIAssistant', () => {
  it('shows login prompt when no user is present', () => {
    render(<AIAssistant />);
    expect(screen.getByText('请先登录后使用 AI 助手')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:client -- AIAssistant.test.tsx`
Expected: FAIL because AI page is still mock-driven.

- [ ] **Step 3: Add chat API/types/hooks**

Create `src/types/chat.ts`:

```ts
export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type PendingAttachment = {
  id: string;
  originalName: string;
  mimeType: string;
  kind: 'image' | 'file' | 'audio';
  storagePath: string;
  extractedText: string | null;
};
```

Create `src/lib/chat.ts`:

```ts
import { apiRequest } from './api';
import type { Conversation, Message, PendingAttachment } from '../types/chat';

export function fetchConversations() {
  return apiRequest<{ conversations: Conversation[] }>('/api/conversations');
}

export function createConversation() {
  return apiRequest<{ conversation: Conversation }>('/api/conversations', { method: 'POST' });
}

export function fetchMessages(conversationId: string) {
  return apiRequest<{ messages: Message[] }>(`/api/conversations/${conversationId}/messages`);
}

export function sendMessage(conversationId: string, content: string) {
  return apiRequest<{ userMessage: Message; assistantMessage: Message }>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
  );
}

export async function uploadAttachment(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:4000/api/uploads', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(data.error ?? 'Upload failed');
  }

  const data = (await response.json()) as { attachment: PendingAttachment };
  return data.attachment;
}
```

- [ ] **Step 4: Add auth gate and presentational components**

Create `src/components/auth/AuthGate.tsx`:

```tsx
export function AuthGate() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] p-6">
      <div className="max-w-md rounded-3xl border border-[#DECFBE] bg-white p-8 text-center shadow-xl">
        <h1 className="font-serif text-3xl text-[#362A1F]">请先登录后使用 AI 助手</h1>
        <p className="mt-3 text-sm text-[#7F6B58]">登录后即可查看你的聊天记录、新建对话，并上传图片、文件和语音。</p>
      </div>
    </div>
  );
}
```

Create `src/components/ai/ConversationSidebar.tsx`:

```tsx
import type { Conversation } from '../../types/chat';

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onCreate,
  onSelect,
}: {
  conversations: Conversation[];
  activeConversationId: string | null;
  onCreate: () => void;
  onSelect: (conversationId: string) => void;
}) {
  return (
    <aside className="w-72 shrink-0 border-r border-[#DECFBE] bg-[#FAF8F4]/90 p-4">
      <button onClick={onCreate} className="mb-4 w-full rounded-xl border border-[#DECFBE] bg-white px-4 py-3 text-sm">
        新聊天
      </button>
      <div className="space-y-2 overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm ${activeConversationId === conversation.id ? 'bg-[#EAE3D4]' : 'bg-transparent hover:bg-[#F4F0E8]'}`}
          >
            <div className="truncate font-medium text-[#362A1F]">{conversation.title}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
```

Create `src/components/ai/MessageList.tsx`:

```tsx
import type { Message } from '../../types/chat';

export function MessageList({ messages, pageError }: { messages: Message[]; pageError: string }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {pageError ? <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div> : null}
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {messages.map((message) => (
          <div key={message.id} className={message.role === 'user' ? 'self-end' : 'self-start'}>
            <div className={`max-w-[80%] rounded-[2rem] px-5 py-4 text-sm leading-relaxed ${message.role === 'user' ? 'bg-[#986E4B] text-white' : 'bg-white text-[#362A1F] border border-[#DECFBE]'}`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Create `src/components/ai/AttachmentPreview.tsx`:

```tsx
import type { PendingAttachment } from '../../types/chat';

export function AttachmentPreview({
  attachments,
  onRemove,
}: {
  attachments: PendingAttachment[];
  onRemove: (attachmentId: string) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-2 rounded-full border border-[#DECFBE] bg-[#F4F0E8] px-3 py-1.5 text-xs text-[#4A3D30]">
          <span>{attachment.originalName}</span>
          <button onClick={() => onRemove(attachment.id)} className="text-[#986E4B]">移除</button>
        </div>
      ))}
    </div>
  );
}
```

Create `src/components/ai/ChatComposer.tsx`:

```tsx
import { useRef, useState } from 'react';
import type { PendingAttachment } from '../../types/chat';
import { AttachmentPreview } from './AttachmentPreview';

export function ChatComposer({
  sending,
  attachments,
  onUpload,
  onRemoveAttachment,
  onSubmit,
}: {
  sending: boolean;
  attachments: PendingAttachment[];
  onUpload: (file: File) => Promise<void>;
  onRemoveAttachment: (attachmentId: string) => void;
  onSubmit: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="border-t border-[#DECFBE] bg-[#FDFBF7] p-4">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#DECFBE] bg-white p-4 shadow-sm">
        <AttachmentPreview attachments={attachments} onRemove={onRemoveAttachment} />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="给 AI 智能环保助手发送消息..."
          className="min-h-[88px] w-full resize-none bg-transparent outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void onUpload(file);
                }
                event.currentTarget.value = '';
              }}
            />
            <button onClick={() => fileInputRef.current?.click()} className="rounded-full border border-[#DECFBE] px-3 py-2 text-sm text-[#986E4B]">
              上传附件
            </button>
          </div>
          <button
            disabled={sending || !content.trim()}
            onClick={() => {
              void onSubmit(content.trim());
              setContent('');
            }}
            className="rounded-full bg-[#986E4B] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add focused conversation hooks**

Create `src/hooks/useConversations.ts`:

```ts
import { useEffect, useState } from 'react';
import { createConversation, fetchConversations } from '../lib/chat';
import type { Conversation } from '../types/chat';

export function useConversations(enabled: boolean) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void (async () => {
      try {
        const result = await fetchConversations();
        setConversations(result.conversations);
        setActiveConversationId((current) => current ?? result.conversations[0]?.id ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载对话失败');
      }
    })();
  }, [enabled]);

  async function createNewConversation() {
    const result = await createConversation();
    setConversations((current) => [result.conversation, ...current]);
    setActiveConversationId(result.conversation.id);
    return result.conversation;
  }

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    conversationsError: error,
  };
}
```

Create `src/hooks/useConversationMessages.ts`:

```ts
import { useEffect, useState } from 'react';
import { fetchMessages, sendMessage, uploadAttachment } from '../lib/chat';
import type { Message, PendingAttachment } from '../types/chat';

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    void (async () => {
      try {
        const result = await fetchMessages(conversationId);
        setMessages(result.messages);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载消息失败');
      }
    })();
  }, [conversationId]);

  async function addAttachment(file: File) {
    const attachment = await uploadAttachment(file);
    setAttachments((current) => [...current, attachment]);
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  }

  async function submitMessage(content: string) {
    if (!conversationId) {
      return;
    }

    setSending(true);
    try {
      const result = await sendMessage(conversationId, content);
      setMessages((current) => [...current, result.userMessage, result.assistantMessage]);
      setAttachments([]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '发送失败');
    } finally {
      setSending(false);
    }
  }

  return {
    messages,
    attachments,
    sending,
    messagesError: error,
    addAttachment,
    removeAttachment,
    submitMessage,
  };
}
```

- [ ] **Step 6: Rewrite `src/pages/AIAssistant.tsx` around real state**

Replace mock-driven sections with this structure:

```tsx
import { AuthGate } from '../components/auth/AuthGate';
import { ConversationSidebar } from '../components/ai/ConversationSidebar';
import { MessageList } from '../components/ai/MessageList';
import { ChatComposer } from '../components/ai/ChatComposer';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useConversationMessages } from '../hooks/useConversationMessages';

export default function AIAssistant() {
  const { user, isLoading } = useAuth();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    conversationsError,
  } = useConversations(Boolean(user));
  const {
    messages,
    attachments,
    sending,
    messagesError,
    addAttachment,
    removeAttachment,
    submitMessage,
  } = useConversationMessages(activeConversationId);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">加载中...</div>;
  }

  if (!user) {
    return <AuthGate />;
  }

  return (
    <div className="flex h-screen bg-[#FDFBF7]">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onCreate={() => {
          void createNewConversation();
        }}
        onSelect={setActiveConversationId}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MessageList messages={messages} pageError={conversationsError || messagesError} />
        <ChatComposer
          sending={sending}
          attachments={attachments}
          onUpload={addAttachment}
          onRemoveAttachment={removeAttachment}
          onSubmit={submitMessage}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run AI page test and browser-check the feature**

Run: `npm run test:client -- AIAssistant.test.tsx`
Expected: PASS.

Then run both apps:
- `npm run dev:server`
- `npm run dev`

Manual browser check:
- unauthenticated `/ai` shows auth gate
- after login, sidebar loads
- can create a new conversation
- can switch to previous conversation
- can attach a file and send a message

- [ ] **Step 7: Commit**

```bash
git add src/types/chat.ts src/lib/chat.ts src/hooks/useConversations.ts src/hooks/useConversationMessages.ts src/components/auth/AuthGate.tsx src/components/ai/ConversationSidebar.tsx src/components/ai/MessageList.tsx src/components/ai/ChatComposer.tsx src/components/ai/AttachmentPreview.tsx src/pages/AIAssistant.tsx src/pages/AIAssistant.test.tsx
git commit -m "feat: wire ai page to backend chat"
```

### Task 8: Final verification and docs sync

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-04-19-ai-backend-login-design.md` (only if implementation diverges)

- [ ] **Step 1: Add the new local run instructions to `README.md`**

Append a short backend section:

```md
## Full-stack local development

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env`
3. Start PostgreSQL and create the database in `DATABASE_URL`
4. Run `npm run db:migrate`
5. Start the API with `npm run dev:server`
6. Start the frontend with `npm run dev`
```

- [ ] **Step 2: Run the full verification pass**

Run:
- `npm run lint`
- `npm run test`

Expected: PASS.

Manual verification checklist:
- register works
- login works
- logout works
- homepage top-left account entry updates correctly
- unauthenticated `/ai` is blocked
- authenticated user sees only their own conversations
- new conversation works
- historical conversation switching works
- text message roundtrip works through backend relay
- image/file/audio upload endpoint accepts supported types and rejects unsupported ones

- [ ] **Step 3: Commit**

```bash
git add README.md docs/superpowers/specs/2026-04-19-ai-backend-login-design.md
git commit -m "docs: add full-stack development guide"
```

## Self-review

### Spec coverage
- Email register/login/logout: covered in Task 3 and Task 6.
- Homepage login entry at top-left: covered in Task 6.
- User-isolated conversation history in `/ai`: covered in Task 4 and Task 7.
- New conversation + switch conversation: covered in Task 4 and Task 7.
- Per-conversation memory only: covered in Task 4 via replaying only active conversation history.
- Backend-only relay model access: covered in Task 4.
- File/image/audio inputs: covered in Task 5 and Task 7.
- PostgreSQL persistence: covered in Task 2.

### Placeholder scan
- Task 4 tests must include authenticated success and cross-user ownership-denied cases before the task is considered complete.
- Task 5 tests must include supported MIME success cases and unsupported MIME rejection cases before the task is considered complete.
- Task 7 browser verification must include uploading one image, one text/PDF file, and one audio file to confirm all three input paths behave correctly.

### Type consistency
- Shared route shape uses `conversationId` from URL and `Message.role` as `'user' | 'assistant'` throughout.
- Frontend `Conversation` and backend `ConversationRecord` align on fields used by the client.
- Attachment kind is consistently `image | file | audio`.
