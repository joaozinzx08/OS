import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32 || secret === 'gere_com_npm_run_setup') {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres. Execute npm run setup.');
}
export const env = {
  port: Number(process.env.PORT || 3000), host: process.env.HOST || '127.0.0.1',
  production: process.env.NODE_ENV === 'production', secret,
  database: path.resolve(backendRoot, process.env.DATABASE_PATH || './data/gestaoos.sqlite'),
  origins: (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s => s.trim()),
  sessionHours: Number(process.env.SESSION_HOURS || 8)
};
if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535 || !Number.isFinite(env.sessionHours) || env.sessionHours <= 0 || env.sessionHours > 24) {
  throw new Error('PORT ou SESSION_HOURS inválido. Sessões devem durar até 24 horas.');
}
