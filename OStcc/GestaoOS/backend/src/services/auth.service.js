import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import { Usuario, Empresa, Sessao, publicUser } from '../models/index.js';
import { env } from '../config/env.js';
import { write } from '../database/connection.js';
import { fail, audit } from './shared.js';
const dummyHash = bcrypt.hashSync(randomUUID(), 12);
export async function login({ email, senha }) {
  const user = await Usuario.findOne({ where: { email } });
  const matches = await bcrypt.compare(senha, user?.senhaHash || dummyHash);
  fail(!user?.ativo || !matches, 401, 'E-mail ou senha inválidos.');
  const company = await Empresa.findByPk(user.empresaId);
  fail(!company?.ativo, 403, 'Empresa inativa.');
  const sessionId = randomUUID();
  await write(async transaction => {
    const current = await Usuario.findByPk(user.id, { transaction });
    fail(!current?.ativo || current.tokenVersion !== user.tokenVersion, 401, 'Conta alterada. Faça login novamente.');
    await Sessao.destroy({ where: { expiresAt: { [Op.lt]: new Date() } }, transaction });
    await Sessao.create({ id: sessionId, usuarioId: user.id, expiresAt: new Date(Date.now() + env.sessionHours * 3600000) }, { transaction });
    await audit(user, 'Login', 'Sessão iniciada.', transaction);
  });
  const token = jwt.sign({ version: user.tokenVersion }, env.secret, { algorithm: 'HS256', subject: user.id, jwtid: sessionId, issuer: 'gestao-os', audience: 'gestao-web', expiresIn: env.sessionHours * 3600 });
  return { token, usuario: publicUser(user), empresa: { id: company.id, nome: company.nome } };
}
export async function logout(user, sessionId) {
  await write(async transaction => { await Sessao.destroy({ where: { id: sessionId, usuarioId: user.id }, transaction }); await audit(user, 'Logout', 'Sessão encerrada.', transaction); });
}
export async function updateProfile(user, data) {
  const hash = data.novaSenha ? await bcrypt.hash(data.novaSenha, 12) : undefined;
  return write(async transaction => {
    const current = await Usuario.findByPk(user.id, { transaction });
    if (data.novaSenha) {
      fail(!await bcrypt.compare(data.senhaAtual, current.senhaHash), 422, 'Senha atual incorreta.');
      current.senhaHash = hash; current.tokenVersion += 1;
      await Sessao.destroy({ where: { usuarioId: current.id }, transaction });
    }
    if (data.nome) current.nome = data.nome;
    await current.save({ transaction });
    await audit(current, 'Perfil atualizado', data.novaSenha ? 'Senha alterada e sessões revogadas.' : 'Nome atualizado.', transaction);
    return publicUser(current);
  });
}
