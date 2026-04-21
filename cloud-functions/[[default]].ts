import { createApp } from '../server/app';
import { ensureServerReady } from '../server/bootstrap';

const app = createApp({
  onRequestStart: ensureServerReady,
  serveStaticAssets: true,
});

export default app;
