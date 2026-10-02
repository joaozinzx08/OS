export const name = '001-initial';
export async function up(db, transaction) {
  const statements = [
    `CREATE TABLE empresas (
      id TEXT PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
      createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL)`,
    `CREATE TABLE setores (
      id TEXT PRIMARY KEY, empresaId TEXT NOT NULL REFERENCES empresas(id),
      nome TEXT NOT NULL, descricao TEXT NOT NULL DEFAULT '', ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
      createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL,
      UNIQUE(id, empresaId), UNIQUE(empresaId, nome))`,
    `CREATE TABLE categorias (
      id TEXT PRIMARY KEY, empresaId TEXT NOT NULL REFERENCES empresas(id),
      nome TEXT NOT NULL, ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
      createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL,
      UNIQUE(id, empresaId), UNIQUE(empresaId, nome))`,
    `CREATE TABLE usuarios (
      id TEXT PRIMARY KEY, empresaId TEXT NOT NULL REFERENCES empresas(id), setorId TEXT,
      nome TEXT NOT NULL, email TEXT NOT NULL COLLATE NOCASE UNIQUE, senhaHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('colaborador','gestor','administrador_setor','administrador_principal')),
      ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)), tokenVersion INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL,
      UNIQUE(id, empresaId), FOREIGN KEY(setorId, empresaId) REFERENCES setores(id, empresaId))`,
    `CREATE TABLE sessoes (
      id TEXT PRIMARY KEY, usuarioId TEXT NOT NULL REFERENCES usuarios(id), expiresAt DATETIME NOT NULL,
      createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL)`,
    `CREATE TABLE ordens (
      id TEXT PRIMARY KEY, protocolo TEXT NOT NULL UNIQUE, empresaId TEXT NOT NULL REFERENCES empresas(id),
      solicitanteId TEXT NOT NULL, setorResponsavelId TEXT NOT NULL, responsavelId TEXT, categoriaId TEXT NOT NULL,
      titulo TEXT NOT NULL, descricao TEXT NOT NULL,
      prioridade TEXT NOT NULL CHECK (prioridade IN ('Baixa','Média','Alta','Urgente')),
      status TEXT NOT NULL CHECK (status IN ('Aberta','Em atendimento','Concluída','Cancelada')),
      sigilo INTEGER NOT NULL DEFAULT 0 CHECK (sigilo IN (0,1)), prazo DATETIME, dataConclusao DATETIME,
      createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL,
      UNIQUE(id, empresaId),
      FOREIGN KEY(solicitanteId, empresaId) REFERENCES usuarios(id, empresaId),
      FOREIGN KEY(responsavelId, empresaId) REFERENCES usuarios(id, empresaId),
      FOREIGN KEY(setorResponsavelId, empresaId) REFERENCES setores(id, empresaId),
      FOREIGN KEY(categoriaId, empresaId) REFERENCES categorias(id, empresaId))`,
    `CREATE TABLE historicos (
      id TEXT PRIMARY KEY, empresaId TEXT NOT NULL, ordemId TEXT NOT NULL, usuarioId TEXT NOT NULL,
      acao TEXT NOT NULL, descricao TEXT NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL,
      FOREIGN KEY(ordemId, empresaId) REFERENCES ordens(id, empresaId),
      FOREIGN KEY(usuarioId, empresaId) REFERENCES usuarios(id, empresaId))`,
    `CREATE TABLE notificacoes (
      id TEXT PRIMARY KEY, empresaId TEXT NOT NULL, usuarioId TEXT NOT NULL, ordemId TEXT,
      titulo TEXT NOT NULL, mensagem TEXT NOT NULL, lida INTEGER NOT NULL DEFAULT 0 CHECK (lida IN (0,1)),
      createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL,
      FOREIGN KEY(usuarioId, empresaId) REFERENCES usuarios(id, empresaId),
      FOREIGN KEY(ordemId, empresaId) REFERENCES ordens(id, empresaId))`,
    `CREATE TABLE auditorias (
      id TEXT PRIMARY KEY, empresaId TEXT NOT NULL, usuarioId TEXT NOT NULL,
      acao TEXT NOT NULL, detalhes TEXT NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL,
      FOREIGN KEY(usuarioId, empresaId) REFERENCES usuarios(id, empresaId))`,
    `CREATE INDEX ordens_empresa_status ON ordens(empresaId, status)`,
    `CREATE INDEX ordens_empresa_setor ON ordens(empresaId, setorResponsavelId)`,
    `CREATE INDEX ordens_solicitante ON ordens(empresaId, solicitanteId)`,
    `CREATE INDEX historico_ordem ON historicos(ordemId, createdAt)`,
    `CREATE INDEX notificacoes_usuario ON notificacoes(usuarioId, lida)`,
    `CREATE INDEX sessoes_usuario ON sessoes(usuarioId)`
  ];
  for (const sql of statements) await db.query(sql, { transaction });
}
