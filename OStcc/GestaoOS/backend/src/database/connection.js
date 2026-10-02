import { Sequelize, Transaction } from 'sequelize';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
fs.mkdirSync(path.dirname(env.database), { recursive: true });
export const db = new Sequelize({ dialect: 'sqlite', storage: env.database, logging: false,
  retry: { max: 3, match: [/SQLITE_BUSY/] }, pool: { max: 1, min: 0 } });
export async function connect() {
  await db.authenticate();
  await db.query('PRAGMA foreign_keys = ON');
  await db.query('PRAGMA journal_mode = WAL');
  await db.query('PRAGMA busy_timeout = 5000');
}
// Um processo de API; serializa transações de escrita para evitar disputas no SQLite.
let pending = Promise.resolve();
export function write(work) {
  const next = pending.then(() => db.transaction({ type: Transaction.TYPES.IMMEDIATE }, work));
  pending = next.catch(() => {});
  return next;
}
