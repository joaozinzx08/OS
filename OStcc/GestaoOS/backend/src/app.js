import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { env, backendRoot } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.js';
import { HttpError } from './services/shared.js';
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || env.origins.includes(origin)), credentials: true }));
  app.use('/api', (req,res,next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
      const origin = req.headers.origin;
      if ((origin && !env.origins.includes(origin)) || (!origin && req.headers.cookie)) throw new HttpError(403, 'Origem da requisição não permitida.');
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Requisição entre sites bloqueada.');
    }
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', rateLimit({ windowMs: 15*60*1000, limit: 1000, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Limite de requisições atingido. Tente novamente mais tarde.' } }));
  app.use('/api', routes);
  app.use('/api', (req,res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  const frontend = path.resolve(backendRoot, '../frontend/dist');
  if (fs.existsSync(path.join(frontend, 'index.html'))) {
    app.use(express.static(frontend));
    app.get('/{*path}', (req,res) => res.sendFile(path.join(frontend, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}
