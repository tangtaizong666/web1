import { pool } from '../db/pool';
import type { AttachmentKind, AttachmentRecord } from '../types';

export async function createAttachment(
  messageId: string,
  kind: AttachmentKind,
  originalName: string,
  mimeType: string,
  sizeBytes: number,
  storagePath: string,
  extractedText: string | null = null,
) {
  const result = await pool.query<AttachmentRecord>(
    `insert into attachments (message_id, kind, original_name, mime_type, size_bytes, storage_path, extracted_text)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [messageId, kind, originalName, mimeType, sizeBytes, storagePath, extractedText],
  );

  return result.rows[0];
}

export async function listAttachments(messageId: string) {
  const result = await pool.query<AttachmentRecord>(
    `select * from attachments where message_id = $1 order by created_at asc`,
    [messageId],
  );

  return result.rows;
}

export async function listAttachmentsByMessageIds(messageIds: string[]) {
  if (messageIds.length === 0) {
    return [] as AttachmentRecord[];
  }

  const result = await pool.query<AttachmentRecord>(
    `select * from attachments where message_id = any($1::uuid[]) order by created_at asc`,
    [messageIds],
  );

  return result.rows;
}
