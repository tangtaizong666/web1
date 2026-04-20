import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { AppError } from './errors';
import { sanitizeFilename } from './uploads';

export async function saveUploadedBuffer(filename: string, buffer: Buffer) {
  const safeFilename = `${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
  const absoluteDir = path.resolve(env.UPLOAD_DIR);

  await fs.mkdir(absoluteDir, { recursive: true });

  const absolutePath = path.join(absoluteDir, safeFilename);
  await fs.writeFile(absolutePath, buffer);

  return path.join(env.UPLOAD_DIR, safeFilename);
}

export function resolveStoredFilePath(storagePath: string) {
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  const normalizedStoragePath = path.normalize(storagePath);
  const uploadDirName = path.basename(uploadDir);
  const relativeStoragePath = normalizedStoragePath === uploadDirName
    ? ''
    : normalizedStoragePath.startsWith(`${uploadDirName}${path.sep}`)
      ? normalizedStoragePath.slice(uploadDirName.length + 1)
      : normalizedStoragePath;
  const candidatePath = path.resolve(uploadDir, relativeStoragePath);
  const relativePath = path.relative(uploadDir, candidatePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new AppError(400, 'Invalid storage path');
  }

  return candidatePath;
}

export async function readStoredFile(storagePath: string) {
  return fs.readFile(resolveStoredFilePath(storagePath));
}
