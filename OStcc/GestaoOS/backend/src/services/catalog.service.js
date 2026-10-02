import { Op } from 'sequelize';
import { Setor, Categoria, Usuario, Ordem } from '../models/index.js';
import { write } from '../database/connection.js';
import { fail, audit } from './shared.js';
const models = { setores: Setor, categorias: Categoria };
export const list = (type, user) => models[type].findAll({ where: { empresaId: user.empresaId }, order: [['nome','ASC']] });
export const create = (type, user, data) => write(async transaction => {
  const row = await models[type].create({ ...data, empresaId: user.empresaId }, { transaction });
  await audit(user, type + ': criação', row.id, transaction); return row;
});
export const update = (type, user, id, data) => write(async transaction => {
  const row = await models[type].findOne({ where: { id, empresaId: user.empresaId }, transaction });
  fail(!row, 404, 'Registro não encontrado.');
  if (type === 'setores' && data.ativo === false) {
    const people = await Usuario.count({ where: { empresaId: user.empresaId, setorId: id, ativo: true }, transaction });
    const orders = await Ordem.count({ where: { empresaId: user.empresaId, setorResponsavelId: id, status: { [Op.in]: ['Aberta','Em atendimento'] } }, transaction });
    fail(people > 0 || orders > 0, 409, 'O setor ainda possui usuários ativos ou ordens abertas.');
  }
  await row.update(data, { transaction }); await audit(user, type + ': atualização', row.id, transaction); return row;
});
