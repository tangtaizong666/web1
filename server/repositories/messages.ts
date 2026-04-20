import { pool } from '../db/pool';
import type { MessageRecord, MessageRole } from '../types';

export async function createMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  createdAt?: string,
) {
  const result = createdAt
    ? await pool.query<MessageRecord>(
        `insert into messages (conversation_id, role, content, created_at) values ($1, $2, $3, $4) returning *`,
        [conversationId, role, content, createdAt],
      )
    : await pool.query<MessageRecord>(
        `insert into messages (conversation_id, role, content) values ($1, $2, $3) returning *`,
        [conversationId, role, content],
      );

  return result.rows[0];
}

export async function listMessages(conversationId: string) {
  const result = await pool.query<MessageRecord>(
    `select * from messages where conversation_id = $1 order by created_at asc`,
    [conversationId],
  );

  return result.rows;
}
