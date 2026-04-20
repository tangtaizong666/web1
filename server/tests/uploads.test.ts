import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sessionsState = new Map<string, string>();
const savedFiles: Array<{ filename: string; mimeType: string; size: number }> = [];

vi.mock('../lib/session', async () => {
  const actual = await vi.importActual<typeof import('../lib/session')>('../lib/session');

  return {
    ...actual,
    getSessionUserId: vi.fn(async (sessionId: string) => sessionsState.get(sessionId) ?? null),
  };
});

vi.mock('../lib/storage', () => ({
  saveUploadedBuffer: vi.fn(async (filename: string, buffer: Buffer) => {
    savedFiles.push({
      filename,
      mimeType: filename.endsWith('.webm') ? 'audio/webm' : filename.endsWith('.png') ? 'image/png' : 'text/plain',
      size: buffer.length,
    });
    return `uploads/${filename}`;
  }),
}));

vi.mock('../lib/transcription', () => ({
  transcribeAudio: vi.fn(async () => '音频转写内容'),
}));

import { COOKIE_NAME } from '../lib/session';
import { verifyAttachmentToken } from '../lib/uploads';
import { createApp } from '../app';

describe('upload routes', () => {
  beforeEach(() => {
    sessionsState.clear();
    savedFiles.length = 0;
    vi.clearAllMocks();
  });

  it('rejects unauthenticated upload access', async () => {
    const app = createApp();
    const response = await request(app).post('/api/uploads');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('accepts supported image and audio uploads and returns a signed attachment token', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');

    const imageResponse = await request(app)
      .post('/api/uploads')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .attach('file', Buffer.from('fake-png-data'), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(imageResponse.status).toBe(201);
    expect(imageResponse.body.attachment.kind).toBe('image');
    expect(imageResponse.body.attachment.extractedText).toBeNull();
    expect(imageResponse.body.attachment.token).toEqual(expect.any(String));
    expect(verifyAttachmentToken(imageResponse.body.attachment.token, 'user-1')).toMatchObject({
      kind: 'image',
      originalName: 'photo.png',
      mimeType: 'image/png',
      sizeBytes: 13,
      storagePath: 'uploads/photo.png',
      extractedText: null,
    });

    const audioResponse = await request(app)
      .post('/api/uploads')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .attach('file', Buffer.from('fake-audio-data'), {
        filename: 'voice.webm',
        contentType: 'audio/webm',
      });

    expect(audioResponse.status).toBe(201);
    expect(audioResponse.body.attachment.kind).toBe('audio');
    expect(audioResponse.body.attachment.extractedText).toBe('音频转写内容');
    expect(verifyAttachmentToken(audioResponse.body.attachment.token, 'user-1')).toMatchObject({
      kind: 'audio',
      originalName: 'voice.webm',
      mimeType: 'audio/webm',
      sizeBytes: 15,
      storagePath: 'uploads/voice.webm',
      extractedText: '音频转写内容',
    });
  });

  it('extracts readable text from plain text uploads', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');

    const response = await request(app)
      .post('/api/uploads')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .attach('file', Buffer.from('可回收衣物说明', 'utf-8'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(201);
    expect(response.body.attachment.kind).toBe('file');
    expect(response.body.attachment.extractedText).toBe('可回收衣物说明');
    expect(response.body.attachment.token).toEqual(expect.any(String));
  });

  it('rejects unsupported mime types', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');

    const response = await request(app)
      .post('/api/uploads')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .attach('file', Buffer.from('%PDF-1.7 fake'), {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Unsupported file type' });
  });

  it('rejects other unsupported mime types', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');

    const response = await request(app)
      .post('/api/uploads')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .attach('file', Buffer.from('zip-data'), {
        filename: 'archive.zip',
        contentType: 'application/zip',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Unsupported file type' });
  });
});
