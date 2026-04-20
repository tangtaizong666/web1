import crypto from 'node:crypto';
import { promisify } from 'node:util';

const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';
const pbkdf2 = promisify(crypto.pbkdf2);

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)).toString('hex');

  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(':');

  if (!salt || !originalHash) {
    return false;
  }

  const hash = (await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)).toString('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const originalHashBuffer = Buffer.from(originalHash, 'hex');

  if (hashBuffer.length !== originalHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, originalHashBuffer);
}
