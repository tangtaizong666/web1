import crypto from 'node:crypto';
import multer from 'multer';
import path from 'node:path';
import { env } from '../config/env';
import { AppError } from './errors';

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, 'Unsupported file type'));
      return;
    }

    callback(null, true);
  },
});

export function detectAttachmentKind(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return 'image' as const;
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio' as const;
  }

  return 'file' as const;
}

export function sanitizeFilename(filename: string) {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}

type SignedAttachmentPayload = {
  userId: string;
  kind: ReturnType<typeof detectAttachmentKind>;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  extractedText: string | null;
};

export type VerifiedAttachment = SignedAttachmentPayload;

function encodeAttachmentPayload(payload: SignedAttachmentPayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeAttachmentPayload(token: string) {
  return JSON.parse(Buffer.from(token, 'base64url').toString('utf-8')) as SignedAttachmentPayload;
}

function signAttachmentToken(token: string) {
  return crypto.createHmac('sha256', env.SESSION_SECRET).update(token).digest('base64url');
}

export function createAttachmentToken(payload: SignedAttachmentPayload) {
  const encodedPayload = encodeAttachmentPayload(payload);
  const signature = signAttachmentToken(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAttachmentToken(token: string, userId: string): VerifiedAttachment {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    throw new AppError(400, 'Invalid attachment token');
  }

  const expectedSignature = signAttachmentToken(encodedPayload);
  const providedSignature = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    throw new AppError(400, 'Invalid attachment token');
  }

  let payload: SignedAttachmentPayload;

  try {
    payload = decodeAttachmentPayload(encodedPayload);
  } catch {
    throw new AppError(400, 'Invalid attachment token');
  }

  if (payload.userId !== userId) {
    throw new AppError(400, 'Invalid attachment token');
  }

  return payload;
}
