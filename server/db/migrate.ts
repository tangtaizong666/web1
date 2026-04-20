import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool, PoolClient } from 'pg';

import { pool } from './pool';

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

async function ensureMigrationTable(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getMigrationFiles() {
  try {
    return (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function runMigrations(targetPool: Pool = pool) {
  const client = await targetPool.connect();

  try {
    await ensureMigrationTable(client);

    const files = await getMigrationFiles();

    for (const file of files) {
      const alreadyApplied = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);

      if (alreadyApplied.rowCount) {
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
  }
}
