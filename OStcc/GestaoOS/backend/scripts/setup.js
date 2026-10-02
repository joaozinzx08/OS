import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, '.env');
if (fs.existsSync(target)) console.log('.env já existe e foi preservado.');
else {
  const template = fs.readFileSync(path.join(root,'.env.example'),'utf8');
  fs.writeFileSync(target,template.replace('gere_com_npm_run_setup',randomBytes(48).toString('hex')), { mode: 0o600, flag: 'wx' });
  console.log('Configuração criada com segredo exclusivo.');
}
const { migrate } = await import('../src/database/migrate.js');
const { db } = await import('../src/database/connection.js');
await migrate(); await db.close();
console.log('SQLite pronto. Execute npm run admin:create para criar o primeiro acesso.');
