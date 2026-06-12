import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

function loadDotEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, 'utf8');

  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim().replace(/^export\s+/, '');

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmedLine.slice(separatorIndex + 1).trim();
    const quote = value[0];

    if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, '\n');
  }
}

loadDotEnvFile();

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

const envSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.default('development'),
    PORT: z.coerce.number().optional(),
    SERVER_PORT: z.coerce.number().optional(),
    APP_URL: z.string().url().optional(),
    DATABASE_URL: z.string().min(1).optional(),
    SESSION_SECRET: z.string().min(32).optional(),
    AI_RELAY_BASE_URL: z.string().url().default('http://localhost:6543'),
    AI_RELAY_API_KEY: z.string().min(1).optional(),
    AI_MODEL: z.string().min(1).default('gpt-5'),
    UPLOAD_DIR: z.string().min(1).default('uploads'),
    MAX_UPLOAD_SIZE_MB: z.coerce.number().default(10),
  })
  .superRefine((rawEnv, context) => {
    const isProduction = rawEnv.NODE_ENV === 'production';

    const requiredInProduction = [
      ['DATABASE_URL', rawEnv.DATABASE_URL],
      ['SESSION_SECRET', rawEnv.SESSION_SECRET],
      ['AI_RELAY_API_KEY', rawEnv.AI_RELAY_API_KEY],
    ] as const;

    for (const [key, value] of requiredInProduction) {
      if (isProduction && (!value || value.trim().length === 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} must be set in production`,
        });
      }
    }

    if (isProduction && rawEnv.SESSION_SECRET === 'development-session-secret-change-me') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message: 'SESSION_SECRET must not use the development default in production',
      });
    }

    if (isProduction && rawEnv.AI_RELAY_API_KEY === 'development-key') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AI_RELAY_API_KEY'],
        message: 'AI_RELAY_API_KEY must not use the development default in production',
      });
    }
  });

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  SERVER_PORT: parsedEnv.SERVER_PORT ?? parsedEnv.PORT ?? 4000,
  APP_URL:
    parsedEnv.APP_URL?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    'http://localhost:3000',
  DATABASE_URL:
    parsedEnv.DATABASE_URL?.trim() || 'postgres://postgres:postgres@localhost:5432/campus_cycle',
  SESSION_SECRET: parsedEnv.SESSION_SECRET?.trim() || 'development-session-secret-change-me',
  AI_RELAY_API_KEY: parsedEnv.AI_RELAY_API_KEY?.trim() || 'development-key',
  APP_ORIGIN: new URL(
    parsedEnv.APP_URL?.trim() ||
      process.env.RENDER_EXTERNAL_URL?.trim() ||
      'http://localhost:3000',
  ).origin,
} as const;
