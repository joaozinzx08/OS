import { Auditoria, Setor, Categoria } from '../models/index.js';
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const fail = (condition, status, message) => { if (condition) throw new HttpError(status, message); };
export const audit = (user, acao, detalhes, transaction) => Auditoria.create({ empresaId: user.empresaId, usuarioId: user.id, acao, detalhes }, { transaction });
export async function tenantReference(model, id, empresaId, transaction, active = true) {
  const row = await model.findOne({ where: { id, empresaId, ...(active ? { ativo: true } : {}) }, transaction });
  fail(!row, 422, 'Referência inexistente, inativa ou pertencente a outra empresa.');
  return row;
}
export const roles = ['colaborador', 'gestor', 'administrador_setor', 'administrador_principal'];
export const statuses = ['Aberta', 'Em atendimento', 'Concluída', 'Cancelada'];
export const priorities = ['Baixa', 'Média', 'Alta', 'Urgente'];
export { Setor, Categoria };
