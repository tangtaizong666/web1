import { pool } from '../db/pool';
import type { UserRecord } from '../types';

export async function createUser(email: string, passwordHash: string) {
  const result = await pool.query<UserRecord>(
    `insert into users (email, password_hash) values ($1, $2) returning *`,
    [email.toLowerCase(), passwordHash],
  );

  return result.rows[0];
}

export async function findUserByEmail(email: string) {
  const result = await pool.query<UserRecord>(`select * from users where email = $1`, [email.toLowerCase()]);
  return result.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await pool.query<UserRecord>(`select * from users where id = $1`, [id]);
  return result.rows[0] ?? null;
}
