# Arquitetura e regras

## Caminho de uma requisição

React chama `/api` → middleware de origem e limite de requisições → autenticação → autorização → validação → controller → service → Sequelize → SQLite.

Controllers traduzem entrada/saída HTTP. Services concentram as regras e usam transações. Modelos descrevem os registros. Migrations evoluem o schema, sem `sync({ force: true })` ou recriação destrutiva do banco.

## Modelo de dados

| Tabela | Campos principais | Relacionamentos |
|---|---|---|
| empresas | id, nome, email, ativo | Empresa possui setores, categorias e usuários |
| setores | id, empresaId, nome, descrição, ativo | Setor pertence à empresa |
| categorias | id, empresaId, nome, ativo | Categoria pertence à empresa |
| usuarios | id, empresaId, setorId, nome, email, senhaHash, role, ativo, tokenVersion | Usuário pertence à empresa e opcionalmente a setor |
| sessoes | id, usuarioId, expiresAt | Sessão pertence ao usuário |
| ordens | id, protocolo, empresaId, solicitanteId, setorResponsavelId, responsavelId, categoriaId, título, descrição, prioridade, status, prazo, sigilo | Referências compostas impedem associar registros de empresas diferentes |
| historicos | ordemId, empresaId, usuarioId, ação, descrição | Eventos append-only pela API |
| notificacoes | empresaId, usuarioId, ordemId, título, mensagem, lida | Atualizações destinadas a uma pessoa |
| auditorias | empresaId, usuarioId, ação, detalhes | Rastreia mutações e autenticação |
| migrations | name, appliedAt | Versiona a estrutura |

Todas as tabelas de negócio têm `createdAt` e `updatedAt`. IDs UUID; protocolo da ordem é uma referência legível e única. E-mail é único (sem diferenciar maiúsculas/minúsculas). Setor e categoria têm nome único por empresa.

Índices apoiam busca de ordens por empresa/status/setor/solicitante e consulta de históricos, notificações e sessões. As chaves estrangeiras compostas usam `(id, empresaId)`; não basta conhecer um ID para cruzar empresas.

## Matriz de permissões

| Ação | Colaborador | Gestor | Admin de setor | Admin principal |
|---|---|---|---|---|
| Abrir OS | Sim | Sim | Sim | Sim |
| Ver/comentar OS próprias | Sim | Sim | Sim | Sim |
| Ver/comentar OS do setor de destino | Não, salvo próprias | Sim | Sim | Sim, todos os setores da empresa |
| Mudar status/prioridade/prazo/responsável | Não | Somente do próprio setor de destino | Somente do próprio setor de destino | Toda a empresa |
| Cadastrar/editar usuários | Não | Não | Colaboradores e gestores do próprio setor | Toda a empresa |
| Gerenciar administradores | Não | Não | Não | Sim |
| Gerenciar setores/categorias | Não | Não | Não | Sim |
| Ver auditoria | Não | Não | Não | Sim |
| Perfil e notificações | Próprios | Próprios | Próprios | Próprios |

Regras adicionais:

- Gestor/admin de setor precisa de setor. O servidor falha de forma restritiva se um registro legado inválido não o tiver.
- Administrador não pode desativar ou rebaixar a própria conta. A última administração principal ativa não pode ser removida.
- Alteração de senha, papel, setor ou situação revoga as sessões do usuário afetado.
- Um responsável por OS em andamento deve ser reatribuído antes de desativar ou mover a pessoa de setor.
- Setor com pessoas ativas ou ordens abertas não pode ser desativado.
- Categorias inativas continuam no histórico, mas não recebem novas ordens.
- Cadastros são desativados, não apagados fisicamente. Ordens e históricos não possuem exclusão por API.
- Um responsável atribuído à OS deve ser gestor/admin do setor de destino e estar ativo.

## Fluxo de status

- Aberta → Em atendimento ou Cancelada.
- Em atendimento → Concluída, Cancelada ou Aberta.
- Concluída/Cancelada → Aberta (reabertura justificada).
- Mudança de status, prioridade, prazo ou responsável exige justificativa.
- Ao concluir, grava a data de conclusão; ao reabrir, remove essa data.

## Segurança aplicada

- Bcrypt para hashes de senha; novas senhas entre 10 caracteres e 72 bytes.
- JWT assinado HS256 com emissor, audiência, expiração e identificador de sessão.
- Cookie HttpOnly e SameSite Strict. Flag Secure em produção (necessita HTTPS).
- JWT não é salvo em localStorage nem devolvido no JSON de login.
- Sessão revogável no banco; checagem de conta e empresa ativas em cada requisição.
- Validação Zod, lista explícita de campos e consultas parametrizadas.
- CORS com origens configuradas; bloqueio de origem de escrita inesperada e proteção de cookie contra CSRF.
- Limites de tentativas de login, requisições e tamanho do JSON.
- Helmet, ausência de stack trace nas respostas e cache desabilitado para a API.
- Histórico, notificações e auditoria escritos junto com as mudanças, na mesma transação.
- Conteúdo do usuário renderizado como texto pelo React, sem `dangerouslySetInnerHTML`.

## Limites

Não é uma certificação de segurança. MFA, recuperação de senha por e-mail, antivírus para anexos, rate limit distribuído, monitoramento externo e backups automatizados ficam para evolução. A auditoria é protegida pela API, mas um administrador com acesso ao arquivo SQLite pode alterá-lo. HTTP local não fornece criptografia; HTTPS depende de certificado e configuração.
