# API GestãoOS v2

Base local: `http://localhost:3000/api`. O frontend usa `/api` por meio do proxy Vite.
Formato: JSON. A autenticação usa cookie `gestao_session` HttpOnly emitido no login.
Para escritas autenticadas via cookie, envie `Origin` correspondente a uma origem autorizada. O navegador envia automaticamente. No Postman/REST Client, habilite o cookie jar e informe `Origin: http://localhost:5173`.

## Métodos

| Método | Semântica nesta API |
|---|---|
| GET | Consultar, sem alterar dados |
| POST | Criar ordens, usuários, comentários ou iniciar/encerrar sessão |
| PUT | Substituir todos os campos editáveis de setor/categoria |
| PATCH | Atualizar parte do recurso, gerenciar ordem, perfil ou marcar notificação |
| DELETE | Desativar usuário/setor/categoria; preserva referências e histórico |

PUT exige o conjunto completo de campos editáveis do recurso. O servidor não fabrica endpoints de exclusão para ordens ou histórico, pois são registros rastreáveis.

## Endpoints

| Método | Rota (após /api) | Acesso e resultado |
|---|---|---|
| GET | /status | Público, saúde da API |
| GET | /docs | Público, contrato OpenAPI |
| POST | /auth/login | Público; email/senha; cookie e usuário público |
| GET | /auth/me | Usuário e empresa da sessão |
| POST | /auth/logout | Revoga sessão; 204 |
| PATCH | /auth/perfil | Nome e/ou senha; não aceita role, setor ou empresa |
| GET | /dashboard | Totais, prazos vencidos e últimas 5 OS visíveis |
| GET | /usuarios | Admin principal ou admin do setor; paginado |
| POST | /usuarios | Cadastrar conta dentro da autorização do admin |
| PATCH | /usuarios/{id} | Editar nome, role, setorId, ativo ou senha |
| DELETE | /usuarios/{id} | Desativar e revogar sessões; 200 com usuário |
| GET | /setores | Lista de setores da empresa |
| POST | /setores | Admin principal; nome e descrição |
| PUT | /setores/{id} | Admin principal; nome, descrição e ativo obrigatórios |
| PATCH | /setores/{id} | Admin principal; atualização parcial |
| DELETE | /setores/{id} | Admin principal; desativação; 204 |
| GET | /categorias | Lista de categorias da empresa |
| POST | /categorias | Admin principal; nome |
| PUT | /categorias/{id} | Admin principal; nome e ativo obrigatórios |
| PATCH | /categorias/{id} | Admin principal; atualização parcial |
| DELETE | /categorias/{id} | Admin principal; desativação; 204 |
| GET | /ordens | Lista paginada no escopo da pessoa |
| POST | /ordens | Criar OS; status inicial sempre Aberta |
| GET | /ordens/{id} | Dados, histórico, autores e podeGerenciar |
| PATCH | /ordens/{id} | Gestão autorizada; justificativa obrigatória |
| GET | /ordens/{id}/responsaveis | Gestão autorizada; responsáveis elegíveis |
| POST | /ordens/{id}/comentarios | Participantes autorizados; descrição |
| GET | /notificacoes | Notificações próprias; paginado |
| PATCH | /notificacoes/{id}/lida | Marcar notificação própria; 204 |
| GET | /auditoria | Admin principal; registros da empresa, paginados |

Listas paginadas: `page` (padrão 1), `limit` (padrão 20; máximo 100); retorno `{items,total,page,limit}`. Usuários aceitam `q`. Ordens aceitam `q`, `status`, `prioridade`, `setorId`.

## Exemplos de corpo

Login:
```json
{"email":"voce@empresa.com","senha":"sua-senha"}
```

Usuário:
```json
{"nome":"Pessoa Exemplo","email":"pessoa@empresa.com","senha":"senha-inicial-com-10-caracteres","role":"colaborador","setorId":"UUID_DO_SETOR"}
```

Ordem:
```json
{"titulo":"Computador não inicia","descricao":"O computador da recepção não liga desde a manhã.","setorResponsavelId":"UUID_DO_SETOR","categoriaId":"UUID_DA_CATEGORIA","prioridade":"Média","sigilo":false}
```

Atualização:
```json
{"status":"Em atendimento","justificativa":"Equipe iniciou a verificação do equipamento."}
```

Alteração de senha:
```json
{"senhaAtual":"senha-atual","novaSenha":"nova-senha-com-10-caracteres"}
```

Nova senha revoga todas as sessões e devolve `loginNecessario: true`.

## Status HTTP

| Código | Significado |
|---|---|
| 200 | Consulta ou alteração bem-sucedida |
| 201 | Recurso criado |
| 204 | Sucesso sem conteúdo |
| 400 | JSON inválido |
| 401 | Sem sessão, sessão expirada/revogada ou credenciais inválidas |
| 403 | Perfil/origem não autorizado ou empresa inativa |
| 404 | Rota/recurso não encontrado ou fora do escopo permitido |
| 409 | Duplicidade ou conflito (ex.: setor com registros ativos) |
| 413 | JSON maior que 100 KB |
| 422 | Campos, referências ou regra de negócio inválidos |
| 429 | Limite de requisições/tentativas |
| 500 | Falha interna sem detalhes sensíveis |

Erros seguem `{ "error": "mensagem" }`. Validação pode adicionar `details: [{field,message}]`. Campos extras são rejeitados.
