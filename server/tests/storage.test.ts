import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AppError } from '../lib/errors';
import { resolveStoredFilePath, saveUploadedBuffer } from '../lib/storage';

describe('storage path resolution', () => {
  const originalUploadDir = process.env.UPLOAD_DIR;
  const tempUploadDirs = new Set<string>();

  afterEach(async () => {
    if (originalUploadDir === undefined) {
      delete process.env.UPLOAD_DIR;
    } else {
      process.env.UPLOAD_DIR = originalUploadDir;
    }

    await Promise.all(
      Array.from(tempUploadDirs, (tempUploadDir) => fs.rm(tempUploadDir, { recursive: true, force: true })),
    );
    tempUploadDirs.clear();
  });

  it('resolves paths within the configured upload directory', () => {
    const resolved = resolveStoredFilePath('uploads/photo.png');

    expect(resolved).toBe(path.resolve('uploads', 'photo.png'));
  });

  it('rejects path escape attempts', () => {
    expect(() => resolveStoredFilePath('../../etc/passwd')).toThrowError(AppError);
    expect(() => resolveStoredFilePath('../../etc/passwd')).toThrow('Invalid storage path');
  });

  it('stores same-named uploads at distinct paths', async () => {
    const tempUploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-test-'));
    tempUploadDirs.add(tempUploadDir);
    process.env.UPLOAD_DIR = tempUploadDir;

    const firstPath = await saveUploadedBuffer('photo.png', Buffer.from('first-file'));
    const secondPath = await saveUploadedBuffer('photo.png', Buffer.from('second-file'));

    expect(firstPath).not.toBe(secondPath);
    expect(path.basename(firstPath)).toMatch(/^[0-9a-f-]+-photo\.png$/i);
    expect(path.basename(secondPath)).toMatch(/^[0-9a-f-]+-photo\.png$/i);
    expect(await fs.readFile(resolveStoredFilePath(firstPath), 'utf-8')).toBe('first-file');
    expect(await fs.readFile(resolveStoredFilePath(secondPath), 'utf-8')).toBe('second-file');
  });
});
