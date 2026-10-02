# GestãoOS — versão 2

Plataforma de ordens de serviço com React + Vite, Express e SQLite + Sequelize.
Interface sem emojis, responsiva, com ícones SVG e componentes reutilizáveis.

## Começar no Windows

Instale Node.js 22.12 ou superior (versão LTS). Abra o terminal **na pasta que contém este README e o package.json principal**.

```powershell
npm ci
npm run setup
npm run admin:create
npm run dev
```

1. `npm ci` instala as versões registradas no package-lock.json.
2. `setup` cria `backend/.env` com segredo aleatório e o banco SQLite vazio. Não sobrescreve um `.env` existente.
3. `admin:create` pede empresa, nome, e-mail e senha (mínimo de 10 caracteres). A senha fica oculta no terminal. Cria também setor e categoria Geral. Não existe senha padrão.
4. `dev` inicia API e React juntos. Abra **http://localhost:5173**. A página inicial apresenta o GestãoOS; use **Acessar sistema** para entrar com os dados que você acabou de cadastrar.
5. Cadastre setores e categorias, depois usuários. Crie uma ordem, atribua prazo/responsável e acompanhe os comentários.

Se o PowerShell bloquear `npm.ps1`, execute os mesmos comandos usando `npm.cmd`.
Se a porta estiver ocupada, encerre a instância anterior. A configuração padrão usa 3000 para API e 5173 para React.
Não abra `index.html` diretamente e não execute os comandos dentro de `legado`.

## Dados antigos (opcional, antes de criar o administrador)

O importador preserva os hashes das senhas existentes. Ele exige um banco novo, sem empresas.
Faça `npm ci` e `npm run setup`, então, em vez de `admin:create`:

```powershell
npm run db:import -w backend -- "C:\CAMINHO\GestaoOS\legadoackend\db.json"
npm run dev
```

Substitua pelo caminho real. Use o e-mail e a senha que já existiam no projeto antigo. Se não souber essas senhas, prefira uma instalação nova. Não execute `admin:create` antes da importação.

Importa empresas, usuários, setores, categorias, ordens, histórico, notificações e auditoria em uma transação: ou tudo é salvo, ou tudo é revertido. A origem não é alterada. Importação repetida é recusada. Usuários não administrativos sem setor recebem Geral, para revisão posterior.

**Não migrados nesta etapa:** arquivos anexados, fotos, subcategorias, preferências, chats, artigos e verificações de e-mail. Esses dados permanecem nos arquivos de `legado`. A flag de sigilo é preservada, mas não significa anonimato: o solicitante continua identificado.

## O que está implementado

- Login real, sessão em cookie HttpOnly, logout com revogação no servidor e revalidação de usuário/empresa ativos.
- Quatro perfis: colaborador, gestor, administrador de setor e administrador principal.
- SQLite persistente, migrations versionadas, chaves estrangeiras compostas por empresa e transações.
- Gestão de usuários (inclui desativação, reativação e redefinição de senha), setores e categorias.
- Ordens com protocolo, busca, paginação, filtros, prioridade, prazo, responsável, mudanças justificadas e histórico.
- Painel com totais limitados ao acesso do usuário e contagem de prazos vencidos.
- Notificações internas, perfil e auditoria para o administrador principal.
- Frontend React com rotas protegidas, estados de carregamento/erro/vazio e layout responsivo.
- GET, POST, PUT, PATCH e DELETE aplicados conforme a operação. Exclusões de cadastros são lógicas para preservar históricos.
- HTTPS opcional com certificado: ver `docs/HTTPS.md`. O padrão local é HTTP.
- Documentação OpenAPI 3.1, exemplos de requisições e testes de integração.

## Escopo desta entrega

O núcleo acima está funcional. O projeto antigo é referência em `legado`, não é executado pela versão nova. Chat, calendário, kanban, base de conhecimento, envio de e-mails, cadastro público de empresas, upload de arquivos e relatórios exportáveis **ainda não foram migrados para React/API nova**. O contador de prazo vencido não é um motor completo de SLA: não calcula feriados, horários úteis ou metas por categoria. Não há reconhecimento facial ou aplicativo mobile.

Cadastro de empresa e primeiro administrador é feito pelo terminal; demais contas são criadas na área administrativa. Isso evita cadastro público e senhas compartilhadas. O projeto permite várias empresas isoladas, mas cada e-mail identifica uma única conta.

## Organização

| Pasta | Responsabilidade |
|---|---|
| backend/src/routes | Métodos, URLs e middlewares de cada recurso |
| backend/src/controllers | Entrada e resposta HTTP |
| backend/src/services | Regras de negócio, permissões, escopos e transações |
| backend/src/models | Modelos Sequelize |
| backend/src/database/migrations | Evolução explícita do schema SQLite |
| backend/src/middlewares | Autenticação, autorização e erros |
| backend/src/validators | Validação Zod e rejeição de campos extras |
| backend/scripts | Preparação, migrations, importação e primeiro admin |
| backend/tests | Testes automatizados da API |
| frontend/src/pages | Telas React |
| frontend/src/components | Componentes e estrutura visual reutilizáveis |
| frontend/src/context | Sessão do usuário |
| frontend/src/services | Cliente HTTP centralizado |
| docs | API, modelo de dados, permissões e apresentação do TCC |
| legado | Código e dados anteriores para consulta |

## Comandos

| Comando na raiz | Função |
|---|---|
| `npm run setup` | Configuração inicial e migrations |
| `npm run db:migrate` | Aplicar migrations pendentes, sem apagar dados |
| `npm run admin:create` | Criar uma nova empresa e seu administrador |
| `npm run dev` | API + frontend para desenvolvimento |
| `npm test` | Testes isolados em SQLite temporário |
| `npm run build` | Compilar frontend |
| `npm start` | API servindo o frontend compilado na porta 3000 |
| `npm audit` | Verificar alertas conhecidos nas dependências instaladas |

Para apresentar com um único servidor: `npm run build` e `npm start`; abra **http://localhost:3000**.
`vite preview` apenas visualiza arquivos compilados; prefira `npm start` para testar também a API.

## Persistência e backup

Banco: `backend/data/gestaoos.sqlite`. Não apague essa pasta para atualizar o código.
Para um backup simples e consistente, pare a API antes de copiar o arquivo SQLite; guarde a cópia em local restrito. Não copie apenas o `.sqlite` de um processo em execução com WAL ativo. Mantenha também o `.env` protegido. Nunca publique banco, `.env`, certificados privados ou dados de `legado` no GitHub.

O código foi preparado para um único processo de API escrevendo no arquivo SQLite. Para múltiplas instâncias ou volume alto de gravações, reavaliar o banco e a concorrência.

## Materiais para apresentar

- `docs/API.md`: métodos, endpoints e códigos HTTP.
- `docs/openapi.json`: contrato importável no Postman e ferramentas OpenAPI.
- `docs/requests.http`: exemplos para REST Client.
- `docs/ARQUITETURA.md`: camadas, tabelas, regras e matriz de permissões.
- `docs/ROTEIRO-TCC.md`: roteiro de demonstração e explicação técnica.
- `docs/VALIDACAO.md`: verificações executadas e limites.
- `docs/HTTPS.md`: configuração com certificado e implantação.

Referências técnicas: [Sequelize](https://sequelize.org/docs/v6/), [migrations](https://sequelize.org/docs/v6/other-topics/migrations/), [transações](https://sequelize.org/docs/v6/other-topics/transactions/), [Vite](https://vite.dev/guide/).
