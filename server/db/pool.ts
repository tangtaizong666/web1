import crypto from 'node:crypto';

import { DataType, newDb } from 'pg-mem';
import { Pool } from 'pg';

import { env } from '../config/env';

type DatabaseMode = 'postgres' | 'memory';

function createMemoryPool() {
  const database = newDb({
    autoCreateForeignKeyIndices: true,
  });

  database.public.registerFunction({
    name: 'now',
    returns: DataType.timestamptz,
    implementation: () => new Date(),
    impure: true,
  });

  database.registerExtension('pgcrypto', (schema) => {
    schema.registerFunction({
      name: 'gen_random_uuid',
      returns: DataType.uuid,
      implementation: () => crypto.randomUUID(),
      impure: true,
    });
  });

  const adapter = database.adapters.createPg();
  return new adapter.Pool() as unknown as Pool;
}

async function createPool() {
  if (env.NODE_ENV === 'test') {
    return {
      pool: createMemoryPool(),
      mode: 'memory' as const,
    };
  }

  const postgresPool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  try {
    await postgresPool.query('select 1');

    return {
      pool: postgresPool,
      mode: 'postgres' as const,
    };
  } catch (error) {
    await postgresPool.end().catch(() => undefined);

    if (env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn(
      '[db] PostgreSQL unavailable, falling back to an in-memory database for local development.',
    );

    return {
      pool: createMemoryPool(),
      mode: 'memory' as const,
    };
  }
}

const database: { pool: Pool; mode: DatabaseMode } = await createPool();

export const pool = database.pool;
export const databaseMode: DatabaseMode = database.mode;
