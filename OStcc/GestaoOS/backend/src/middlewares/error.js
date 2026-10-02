import { ZodError } from 'zod';
import { UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ZodError) return res.status(422).json({ error: 'Revise os campos informados.', details: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) });
  if (error instanceof UniqueConstraintError) return res.status(409).json({ error: 'Já existe um registro com estes dados (e-mail ou nome).'});
  if (error instanceof ForeignKeyConstraintError) return res.status(422).json({ error: 'Relacionamento inválido entre os registros.' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Requisição excede o tamanho permitido.' });
  if (error.status && error.status < 500) return res.status(error.status).json({ error: error.message });
  console.error('Falha interna:', error.name, error.message);
  res.status(500).json({ error: 'Não foi possível concluir a operação.' });
}
