import jwt from 'jsonwebtoken';
import { Usuario, Empresa, Sessao } from '../models/index.js';
import { env } from '../config/env.js';
import { HttpError } from '../services/shared.js';
export const cookieName = 'gestao_session';
export const cookieOptions = { httpOnly: true, secure: env.production, sameSite: 'strict', path: '/api' };
export async function authenticate(req, res, next) {
  const cookie = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  const bearer = req.headers.authorization?.match(/^Bearer ([^ ]+)$/)?.[1];
  const token = bearer || cookie;
  if (!token) throw new HttpError(401, 'Acesso negado. Faça login.');
  let payload;
  try { payload = jwt.verify(token, env.secret, { algorithms: ['HS256'], issuer: 'gestao-os', audience: 'gestao-web' }); }
  catch { throw new HttpError(401, 'Sessão inválida ou expirada.'); }
  const user = await Usuario.findByPk(payload.sub);
  const session = await Sessao.findByPk(payload.jti);
  if (!user?.ativo || !session || session.usuarioId !== user.id || session.expiresAt <= new Date() || user.tokenVersion !== payload.version) throw new HttpError(401, 'Sessão revogada. Faça login novamente.');
  const company = await Empresa.findByPk(user.empresaId);
  if (!company?.ativo) throw new HttpError(403, 'Empresa inativa.');
  req.user = user; req.sessionId = session.id; next();
}
export const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new HttpError(403, 'Seu perfil não tem permissão para esta ação.');
  next();
};
