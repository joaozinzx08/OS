import * as service from '../services/orders.service.js';
export const list = async (req,res) => res.json(await service.listOrders(req.user,req.query));
export const detail = async (req,res) => res.json(await service.detail(req.user,req.params.id));
export const create = async (req,res) => res.status(201).json(await service.createOrder(req.user,req.data));
export const update = async (req,res) => res.json(await service.updateOrder(req.user,req.params.id,req.data));
export const comment = async (req,res) => res.status(201).json(await service.comment(req.user,req.params.id,req.data));
export const assignees = async (req,res) => res.json(await service.assignees(req.user,req.params.id));
export const dashboard = async (req,res) => res.json(await service.dashboard(req.user));
