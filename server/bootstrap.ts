import { runMigrations } from './db/migrate';

let bootstrapPromise: Promise<void> | null = null;

export function ensureServerReady() {
  if (!bootstrapPromise) {
    bootstrapPromise = runMigrations().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}
