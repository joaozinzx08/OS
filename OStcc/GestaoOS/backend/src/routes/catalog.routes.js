import { Router } from 'express';
import { allow } from '../middlewares/auth.js';
import { validate, schemas, validId } from '../validators/index.js';
import * as service from '../services/catalog.service.js';
export function catalogRouter(type) {
  const router = Router(); const key = type === 'setores' ? 'sector' : 'category';
  router.get('/', async (req,res) => res.json(await service.list(type,req.user)));
  router.post('/', allow('administrador_principal'), validate(schemas[key+'Create']), async (req,res) => res.status(201).json(await service.create(type,req.user,req.data)));
  router.patch('/:id', allow('administrador_principal'), validId, validate(schemas[key+'Update']), async (req,res) => res.json(await service.update(type,req.user,req.params.id,req.data)));
  router.put('/:id', allow('administrador_principal'), validId, validate(schemas[key+'Replace']), async (req,res) => res.json(await service.update(type,req.user,req.params.id,req.data)));
  // Remoção lógica: mantém referências históricas e permite reativação.
  router.delete('/:id', allow('administrador_principal'), validId, async (req,res) => { await service.update(type,req.user,req.params.id,{ ativo: false }); res.status(204).end(); });
  return router;
}
