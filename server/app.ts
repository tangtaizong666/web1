import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { conversationsRouter } from './routes/conversations';
import { guestRouter } from './routes/guest';
import { messagesRouter } from './routes/messages';
import { uploadsRouter } from './routes/uploads';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const distIndexPath = path.join(distDir, 'index.html');

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.APP_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/guest', guestRouter);
  app.use('/api/conversations', conversationsRouter);
  app.use('/api', messagesRouter);
  app.use('/api/uploads', uploadsRouter);

  app.use(express.static(distDir));

  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api')) {
      next();
      return;
    }

    response.sendFile(distIndexPath, (error) => {
      if (error) {
        next(error);
      }
    });
  });

  app.use((_request, response) => {
    response.status(404).json({ error: 'Not Found' });
  });

  app.use(errorHandler);

  return app;
}
