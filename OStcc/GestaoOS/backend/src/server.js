import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app.js';
import { migrate } from './database/migrate.js';
import { db } from './database/connection.js';
import { env, backendRoot } from './config/env.js';
const keyFile = process.env.HTTPS_KEY_FILE, certFile = process.env.HTTPS_CERT_FILE;
if (!!keyFile !== !!certFile) throw new Error('Informe HTTPS_KEY_FILE e HTTPS_CERT_FILE juntos.');
await migrate();
const app = createApp();
const server = keyFile ? https.createServer({ key: fs.readFileSync(path.resolve(backendRoot,keyFile)), cert: fs.readFileSync(path.resolve(backendRoot,certFile)), minVersion: 'TLSv1.2' },app) : http.createServer(app);
server.listen(env.port,env.host,()=>console.log(`GestãoOS disponível em ${keyFile?'https':'http'}://${env.host}:${env.port}`));
async function shutdown(){server.close(async()=>{await db.close();process.exit(0);});}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
