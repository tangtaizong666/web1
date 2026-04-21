import { createApp } from './app';
import { env } from './config/env';
import { ensureServerReady } from './bootstrap';
import { databaseMode } from './db/pool';

async function main() {
  await ensureServerReady();
  const app = createApp();

  app.listen(env.SERVER_PORT, () => {
    console.log(`API listening on http://localhost:${env.SERVER_PORT}`);
    console.log(`[db] Using ${databaseMode === 'memory' ? 'in-memory PostgreSQL fallback' : 'PostgreSQL'}`);
  });
}

main().catch((error) => {
  console.error('Server startup failed.');
  console.error(error);
  process.exit(1);
});
