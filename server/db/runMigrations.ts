import { runMigrations } from './migrate';
import { pool } from './pool';

async function main() {
  try {
    await runMigrations();
  } catch (error) {
    console.error('Migration run failed.');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
