import * as service from '../services/users.service.js';
export const list = async (req, res) => res.json(await service.listUsers(req.user, req.query));
export const create = async (req, res) => res.status(201).json(await service.createUser(req.user, req.data));
export const update = async (req, res) => res.json(await service.updateUser(req.user, req.params.id, req.data));
