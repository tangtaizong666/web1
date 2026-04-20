import fs from 'node:fs/promises';
import { env } from '../config/env';
import { AppError } from './errors';

export async function transcribeAudio(filePath: string) {
  const fileBuffer = await fs.readFile(filePath);
  const formData = new FormData();

  formData.append('model', env.AI_MODEL);
  formData.append('file', new Blob([fileBuffer]), filePath.split('/').pop() ?? 'audio.webm');

  const response = await fetch(`${env.AI_RELAY_BASE_URL}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.AI_RELAY_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new AppError(502, 'Audio transcription failed');
  }

  const data = (await response.json()) as { text?: string };
  const text = data.text?.trim();

  if (!text) {
    throw new AppError(502, 'Audio transcription returned empty text');
  }

  return text;
}
