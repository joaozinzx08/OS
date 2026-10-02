import { Router } from 'express';
import fs from 'node:fs';
import auth from './auth.routes.js';
import users from './users.routes.js';
import orders from './orders.routes.js';
import { catalogRouter } from './catalog.routes.js';
import { authenticate, allow } from '../middlewares/auth.js';
import { dashboard } from '../controllers/orders.controller.js';
import { Auditoria, Notificacao } from '../models/index.js';
import { pagination, validId } from '../validators/index.js';
import { write } from '../database/connection.js';
import { fail } from '../services/shared.js';

const apiContractUrls = [
  new URL('../../../docs/openapi.json', import.meta.url),
  new URL('../../../../docs/openapi.json', import.meta.url),
];

const apiContractUrl = apiContractUrls.find(url => fs.existsSync(url));
if (!apiContractUrl) {
  throw new Error('docs/openapi.json não encontrado. Mantenha a pasta docs junto ao projeto GestãoOS.');
}

const apiContract = JSON.parse(fs.readFileSync(apiContractUrl, 'utf8'));
const router = Router();
router.get('/status', (req,res) => res.json({ status: 'ok', version: '2.0.0' }));
router.get('/docs', (req,res) => res.json(apiContract));
router.use('/auth', auth);
router.use(authenticate);
router.use('/usuarios', users);
router.use('/ordens', orders);
router.use('/setores', catalogRouter('setores'));
router.use('/categorias', catalogRouter('categorias'));
router.get('/dashboard', dashboard);
router.get('/notificacoes', async (req,res) => {
  const { page, limit, offset } = pagination(req.query);
  const result = await Notificacao.findAndCountAll({ where: { empresaId: req.user.empresaId, usuarioId: req.user.id }, order: [['createdAt','DESC']], limit, offset });
  res.json({ items: result.rows, total: result.count, page, limit });
});
router.patch('/notificacoes/:id/lida', validId, async (req,res) => {
  await write(async transaction => {
    const [count] = await Notificacao.update({ lida: true }, { where: { id: req.params.id, empresaId: req.user.empresaId, usuarioId: req.user.id }, transaction });
    fail(!count,404,'Notificação não encontrada.');
  }); res.status(204).end();
});
router.get('/auditoria', allow('administrador_principal'), async (req,res) => {
  const { page, limit, offset } = pagination(req.query);
  const result = await Auditoria.findAndCountAll({ where: { empresaId: req.user.empresaId }, order: [['createdAt','DESC']], limit, offset });
  res.json({ items: result.rows, total: result.count, page, limit });
});
export default router;
