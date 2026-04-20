import { pool } from '../db/pool';
import type { ConversationRecord } from '../types';

export function buildConversationTitle(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return '新对话';
  }

  return trimmed.length > 20 ? `${trimmed.slice(0, 20)}…` : trimmed;
}

export async function createConversation(userId: string, title = '新对话') {
  const result = await pool.query<ConversationRecord>(
    `insert into conversations (user_id, title) values ($1, $2) returning *`,
    [userId, title],
  );

  return result.rows[0];
}

export async function listConversations(userId: string) {
  const result = await pool.query<ConversationRecord>(
    `select * from conversations where user_id = $1 order by coalesce(last_message_at, created_at) desc`,
    [userId],
  );

  return result.rows;
}

export async function findBlankConversation(userId: string) {
  const result = await pool.query<ConversationRecord>(
    `select * from conversations
      where user_id = $1 and title = '新对话' and last_message_at is null
      order by created_at desc
      limit 1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function findConversationById(id: string) {
  const result = await pool.query<ConversationRecord>(`select * from conversations where id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function updateConversationTitle(id: string, title: string) {
  const result = await pool.query<ConversationRecord>(
    `update conversations set title = $2, updated_at = now() where id = $1 returning *`,
    [id, title],
  );

  return result.rows[0];
}

export async function touchConversation(id: string) {
  await pool.query(`update conversations set updated_at = now(), last_message_at = now() where id = $1`, [id]);
}

export async function touchConversationAt(id: string, timestamp: string) {
  await pool.query(`update conversations set updated_at = $2, last_message_at = $2 where id = $1`, [id, timestamp]);
}
