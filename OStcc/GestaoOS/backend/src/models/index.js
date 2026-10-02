import { DataTypes as D } from 'sequelize';
import { db } from '../database/connection.js';

const id = () => ({
  type: D.UUID,
  primaryKey: true,
  defaultValue: D.UUIDV4,
});

const text = (required = true) => ({
  type: D.STRING,
  allowNull: !required,
});

const bool = () => ({
  type: D.BOOLEAN,
  allowNull: false,
  defaultValue: true,
});

const model = (name, fields) =>
  db.define(
    name,
    {
      id: id(),
      ...fields,
    },
    {
      tableName: name,
      timestamps: true,
    },
  );


export const Empresa = model('empresas', {
  nome: text(),

  email: text(),

  codigo: {
    type: D.STRING,
    allowNull: false,
    unique: true,
  },

  ativo: bool(),
});


export const Setor = model('setores', {
  empresaId: text(),

  nome: text(),

  descricao: {
    type: D.TEXT,
    defaultValue: '',
  },

  ativo: bool(),
});


export const Categoria = model('categorias', {
  empresaId: text(),

  nome: text(),

  ativo: bool(),
});


export const Usuario = model('usuarios', {
  empresaId: text(),

  setorId: text(false),

  nome: text(),

  email: text(),

  senhaHash: text(),

  role: text(),

  ativo: bool(),

  tokenVersion: {
    type: D.INTEGER,
    defaultValue: 0,
  },
});


export const Sessao = model('sessoes', {
  usuarioId: text(),

  expiresAt: {
    type: D.DATE,
    allowNull: false,
  },
});


export const Ordem = model('ordens', {
  protocolo: text(),

  empresaId: text(),

  solicitanteId: text(),

  setorResponsavelId: text(),

  responsavelId: text(false),

  categoriaId: text(),

  titulo: text(),

  descricao: {
    type: D.TEXT,
    allowNull: false,
  },

  prioridade: text(),

  status: text(),

  sigilo: {
    type: D.BOOLEAN,
    defaultValue: false,
  },

  prazo: D.DATE,

  dataConclusao: D.DATE,
});


export const Historico = model('historicos', {
  empresaId: text(),

  ordemId: text(),

  usuarioId: text(),

  acao: text(),

  descricao: {
    type: D.TEXT,
    allowNull: false,
  },
});


export const Notificacao = model('notificacoes', {
  empresaId: text(),

  usuarioId: text(),

  ordemId: text(false),

  titulo: text(),

  mensagem: {
    type: D.TEXT,
    allowNull: false,
  },

  lida: {
    type: D.BOOLEAN,
    defaultValue: false,
  },
});


export const Auditoria = model('auditorias', {
  empresaId: text(),

  usuarioId: text(),

  acao: text(),

  detalhes: {
    type: D.TEXT,
    allowNull: false,
  },
});


export const publicUser = u =>
  Object.fromEntries(
    [
      'id',
      'empresaId',
      'setorId',
      'nome',
      'email',
      'role',
      'ativo',
      'createdAt',
    ].map(k => [k, u[k]]),
  );