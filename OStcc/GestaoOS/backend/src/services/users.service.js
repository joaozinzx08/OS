import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Usuario, Setor, Sessao, Ordem, publicUser } from '../models/index.js';
import { write } from '../database/connection.js';
import { fail, audit, tenantReference } from './shared.js';
import { pagination } from '../validators/index.js';
function scope(user) {
  return { empresaId: user.empresaId, ...(user.role === 'administrador_setor' ? { setorId: user.setorId || '__none__' } : {}) };
}
export async function listUsers(user, query) {
  const { page, limit, offset } = pagination(query);
  const where = scope(user);
  if (query.q) where[Op.or] = [{ nome: { [Op.like]: '%' + String(query.q).slice(0,100) + '%' } }, { email: { [Op.like]: '%' + String(query.q).slice(0,100) + '%' } }];
  const result = await Usuario.findAndCountAll({ where, attributes: { exclude: ['senhaHash', 'tokenVersion'] }, order: [['nome','ASC']], limit, offset });
  return { items: result.rows, total: result.count, page, limit };
}
async function check(user, data, target, transaction) {
  const role = data.role ?? target?.role ?? 'colaborador';
  const setorId = data.setorId === undefined ? target?.setorId : data.setorId;
  if (user.role === 'administrador_setor') {
    fail(!user.setorId || setorId !== user.setorId, 403, 'Você só gerencia usuários do seu setor.');
    fail(!['colaborador','gestor'].includes(role) || (target && !['colaborador','gestor'].includes(target.role)), 403, 'Somente o administrador principal gerencia administradores.');
  }
  fail(role !== 'administrador_principal' && !setorId, 422, 'Este perfil precisa de um setor.');
  if (setorId) await tenantReference(Setor, setorId, user.empresaId, transaction);
  if (target?.id === user.id) fail(data.ativo === false || (data.role && data.role !== user.role), 422, 'Não é permitido desativar ou rebaixar sua própria conta.');
  if (target?.role === 'administrador_principal' && (data.ativo === false || role !== 'administrador_principal')) {
    const count = await Usuario.count({ where: { empresaId: user.empresaId, role: 'administrador_principal', ativo: true, id: { [Op.ne]: target.id } }, transaction });
    fail(!count, 422, 'A empresa precisa manter um administrador principal ativo.');
  }
  if (target && ((data.setorId !== undefined && data.setorId !== target.setorId) || data.ativo === false || role === 'colaborador')) {
    const assigned = await Ordem.count({ where: { responsavelId: target.id, status: { [Op.in]: ['Aberta','Em atendimento'] } }, transaction });
    fail(assigned > 0, 409, 'Reatribua as ordens abertas deste responsável antes de mudar setor, perfil ou desativá-lo.');
  }
}
export async function createUser(user, data) {
  const senhaHash = await bcrypt.hash(data.senha, 12);
  return write(async transaction => {
    await check(user, data, null, transaction);
    const target = await Usuario.create({ nome: data.nome, email: data.email, role: data.role, setorId: data.setorId, empresaId: user.empresaId, senhaHash }, { transaction });
    await audit(user, 'Usuário criado', target.id, transaction);
    return publicUser(target);
  });
}
export async function updateUser(user, id, data) {
  const senhaHash = data.senha ? await bcrypt.hash(data.senha, 12) : undefined;
  return write(async transaction => {
    const target = await Usuario.findOne({ where: { id, ...scope(user) }, transaction });
    fail(!target, 404, 'Usuário não encontrado.');
    await check(user, data, target, transaction);
    const { senha, ...allowed } = data;
    target.set(allowed);
    if (senhaHash) target.senhaHash = senhaHash;
    if (senhaHash || data.role !== undefined || data.setorId !== undefined || data.ativo !== undefined) {
      target.tokenVersion += 1;
      await Sessao.destroy({ where: { usuarioId: target.id }, transaction });
    }
    await target.save({ transaction });
    await audit(user, 'Usuário atualizado', target.id, transaction);
    return publicUser(target);
  });
}
