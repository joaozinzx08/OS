import { randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import { Ordem, Historico, Usuario, Setor, Categoria, Notificacao } from '../models/index.js';
import { write } from '../database/connection.js';
import { fail, audit, tenantReference, statuses, priorities } from './shared.js';
import { pagination } from '../validators/index.js';
export function orderScope(user) {
  const base = { empresaId: user.empresaId };
  if (user.role === 'colaborador') base.solicitanteId = user.id;
  else if (user.role !== 'administrador_principal') base[Op.or] = [{ setorResponsavelId: user.setorId || '__none__' }, { solicitanteId: user.id }];
  return base;
}
export const canManage = (user, order) => user.role === 'administrador_principal' || (['gestor','administrador_setor'].includes(user.role) && !!user.setorId && user.setorId === order.setorResponsavelId);
export async function findOrder(user, id, transaction) {
  const row = await Ordem.findOne({ where: { id, ...orderScope(user) }, transaction });
  fail(!row, 404, 'Ordem de serviço não encontrada.'); return row;
}
async function enrich(rows) {
  if (!rows.length) return [];
  const empresaId = rows[0].empresaId;
  const ids = [...new Set(rows.flatMap(r => [r.solicitanteId, r.responsavelId]).filter(Boolean))];
  const [users, sectors, categories] = await Promise.all([
    Usuario.findAll({ where: { empresaId, id: ids }, attributes: ['id','nome'] }),
    Setor.findAll({ where: { empresaId }, attributes: ['id','nome'] }),
    Categoria.findAll({ where: { empresaId }, attributes: ['id','nome'] })
  ]);
  const map = items => Object.fromEntries(items.map(i => [i.id, i.nome]));
  const u = map(users), s = map(sectors), c = map(categories);
  return rows.map(row => ({ ...row.toJSON(), solicitante: u[row.solicitanteId], responsavel: u[row.responsavelId] || null, setor: s[row.setorResponsavelId], categoria: c[row.categoriaId] }));
}
export async function listOrders(user, query) {
  const { page, limit, offset } = pagination(query);
  const where = { ...orderScope(user) };
  for (const [key, options] of [['status', statuses], ['prioridade', priorities]]) if (query[key]) {
    fail(!options.includes(query[key]), 422, 'Filtro inválido: ' + key); where[key] = query[key];
  }
  if (query.setorId) where.setorResponsavelId = String(query.setorId);
  if (query.q) where[Op.and] = [{ [Op.or]: ['titulo','protocolo'].map(key => ({ [key]: { [Op.like]: '%' + String(query.q).slice(0,100) + '%' } })) }];
  const result = await Ordem.findAndCountAll({ where, order: [['createdAt','DESC']], limit, offset });
  return { items: await enrich(result.rows), total: result.count, page, limit };
}
export async function detail(user, id) {
  const row = await findOrder(user, id);
  const history = await Historico.findAll({ where: { ordemId: id, empresaId: user.empresaId }, order: [['createdAt','ASC']] });
  const people = await Usuario.findAll({ where: { empresaId: user.empresaId, id: [...new Set(history.map(h => h.usuarioId))] }, attributes: ['id','nome'] });
  const names = Object.fromEntries(people.map(u => [u.id, u.nome]));
  return { ...(await enrich([row]))[0], podeGerenciar: canManage(user, row), historico: history.map(h => ({ ...h.toJSON(), autor: names[h.usuarioId] || 'Usuário' })) };
}
export async function createOrder(user, data) {
  return write(async transaction => {
    await tenantReference(Setor, data.setorResponsavelId, user.empresaId, transaction);
    await tenantReference(Categoria, data.categoriaId, user.empresaId, transaction);
    const row = await Ordem.create({ ...data, empresaId: user.empresaId, solicitanteId: user.id, status: 'Aberta', protocolo: 'OS-' + new Date().getFullYear() + '-' + randomBytes(5).toString('hex').toUpperCase() }, { transaction });
    await Historico.create({ empresaId: user.empresaId, ordemId: row.id, usuarioId: user.id, acao: 'Abertura', descricao: 'Ordem de serviço registrada.' }, { transaction });
    const managers = await Usuario.findAll({ where: { empresaId: user.empresaId, ativo: true, setorId: row.setorResponsavelId, role: { [Op.in]: ['gestor','administrador_setor'] } }, transaction });
    for (const manager of managers) await Notificacao.create({ empresaId: user.empresaId, usuarioId: manager.id, ordemId: row.id, titulo: 'Nova ordem de serviço', mensagem: row.protocolo }, { transaction });
    await audit(user, 'Ordem criada', row.protocolo, transaction);
    return row;
  });
}
const transitions = { 'Aberta': ['Em atendimento','Cancelada'], 'Em atendimento': ['Concluída','Cancelada','Aberta'], 'Concluída': ['Aberta'], 'Cancelada': ['Aberta'] };
export async function updateOrder(user, id, data) {
  return write(async transaction => {
    const row = await findOrder(user, id, transaction);
    fail(!canManage(user, row), 403, 'Somente a gestão responsável pode alterar esta ordem.');
    if (data.status && data.status !== row.status) fail(!transitions[row.status].includes(data.status), 422, 'Transição de status inválida. Inicie o atendimento antes de concluir.');
    if (data.responsavelId) {
      const assignee = await tenantReference(Usuario, data.responsavelId, user.empresaId, transaction);
      fail(assignee.setorId !== row.setorResponsavelId || !['gestor','administrador_setor'].includes(assignee.role), 422, 'O responsável precisa ser gestor ou administrador do setor de destino.');
    }
    const before = row.status;
    const changes = ['status','prioridade','prazo','responsavelId'].filter(k => data[k] !== undefined && String(data[k]) !== String(row[k]));
    fail(!changes.length, 422, 'Nenhuma alteração informada. Use os comentários para registrar uma mensagem.');
    if (data.status && data.status !== row.status) row.dataConclusao = data.status === 'Concluída' ? new Date() : null;
    const { justificativa, ...values } = data;
    await row.update(values, { transaction });
    await Historico.create({ empresaId: user.empresaId, ordemId: id, usuarioId: user.id, acao: 'Atualização', descricao: (before !== row.status ? before + ' → ' + row.status + '. ' : '') + 'Campos: ' + changes.join(', ') + '. ' + justificativa }, { transaction });
    if (row.solicitanteId !== user.id) await Notificacao.create({ empresaId: user.empresaId, usuarioId: row.solicitanteId, ordemId: id, titulo: 'Ordem atualizada', mensagem: row.protocolo + ': ' + row.status }, { transaction });
    await audit(user, 'Ordem atualizada', row.protocolo + ' / ' + changes.join(', '), transaction);
    return row;
  });
}
export async function comment(user, id, data) {
  return write(async transaction => {
    const row = await findOrder(user, id, transaction);
    const item = await Historico.create({ ...data, empresaId: user.empresaId, ordemId: id, usuarioId: user.id, acao: 'Comentário' }, { transaction });
    if (row.solicitanteId !== user.id) await Notificacao.create({ empresaId: user.empresaId, usuarioId: row.solicitanteId, ordemId: id, titulo: 'Nova resposta', mensagem: row.protocolo }, { transaction });
    await audit(user, 'Comentário', row.protocolo, transaction); return item;
  });
}
export async function assignees(user, id) {
  const row = await findOrder(user, id);
  fail(!canManage(user, row), 403, 'Sem permissão.');
  return Usuario.findAll({ where: { empresaId: user.empresaId, setorId: row.setorResponsavelId, ativo: true, role: { [Op.in]: ['gestor','administrador_setor'] } }, attributes: ['id','nome'] });
}
export async function dashboard(user) {
  const scope = orderScope(user);
  const counts = {};
  for (const status of statuses) counts[status] = await Ordem.count({ where: { ...scope, status } });
  const atrasadas = await Ordem.count({ where: { ...scope, status: { [Op.in]: ['Aberta','Em atendimento'] }, prazo: { [Op.lt]: new Date() } } });
  const recent = await Ordem.findAll({ where: scope, order: [['createdAt','DESC']], limit: 5 });
  return { counts, atrasadas, recentes: await enrich(recent), total: Object.values(counts).reduce((a,b) => a+b, 0) };
}
