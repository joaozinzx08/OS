# Validação da entrega

Data: 28/09/2026. Ambiente de execução: Linux, Node.js 24.19.0 e npm 11.9.0. O roteiro Windows está documentado, mas não foi executado em uma máquina Windows nesta sessão.

## Resultados

| Verificação | Resultado |
|---|---|
| `npm test` | 20 testes passaram, 0 falhas |
| `npm run build` | Compilação React + Vite concluída |
| Instalação limpa do lockfile | `npm ci --ignore-scripts` concluído em diretório separado; instalação nativa inicial do SQLite e execução da API também verificadas |
| `npm audit` | 0 alertas conhecidos no relatório desta execução |
| Importação do JSON fornecido | Concluída em SQLite temporário, sem alterar a origem |
| Navegador desktop | Login, painel, criação de ordem, comentário, mudança justificada de status e cadastro de usuário funcionaram |
| Mobile 390 × 844 | Navegação lateral funcional e sem rolagem horizontal da página; tabelas usam rolagem interna |
| HTTPS local | Saúde 200 e login emitindo cookie Secure; certificado temporário validado por CA explícita, sem desligar a verificação TLS |

Os testes de interface rodaram em Chromium headless. Um defeito de overflow causado por elemento acessível oculto fora do contêiner da tabela foi encontrado e corrigido com posicionamento relativo no contêiner. Rótulos dos formulários receberam associação explícita por id. Capturas em `docs/preview` usam apenas dados fictícios de teste, que não acompanham o banco inicial.

O certificado temporário do teste HTTPS não acompanha a entrega e não foi instalado no computador do usuário. A configuração padrão continua em HTTP local. O arquivo `.env` e bancos usados nos testes também não acompanham o ZIP.

## Cobertura dos 20 testes da API

1. Negação de acesso sem autenticação.
2. Login inválido, cookie HttpOnly/SameSite e ausência de hash/token no JSON.
3. Criação e persistência de ordem com histórico.
4. Isolamento entre empresas e entre colaboradores.
5. Bloqueio de referências de outra empresa e campos extras.
6. Restrição de mudanças e usuários para colaborador.
7. Bloqueio de promoção indevida por admin de setor.
8. Escopo do gestor ao editar ordem de outro setor.
9. Justificativa, sequência de status e histórico.
10. Comentários como texto e autorização de acesso.
11. Cadastro, e-mail duplicado e ausência de hash em respostas.
12. Revogação de sessão após desativação.
13. Bloqueio de auto-desativação e elevação pelo perfil.
14. Origem/CSRF e JSON inválido.
15. Dono da notificação e acesso restrito à auditoria.
16. Rollback e chaves estrangeiras entre empresas.
17. Paginação limitada e busca parametrizada.
18. Senha atual e revogação após troca de senha.
19. Logout invalida a sessão no servidor.
20. PUT completo e DELETE lógico, com bloqueio de setor em uso.

## Dependências

Foram aplicados overrides explícitos para dependências transitivas de Sequelize/SQLite (uuid, node-gyp e tar), pois as versões antigas trouxeram alertas no primeiro audit. O conjunto final passou novamente nos testes e na compilação. O lockfile registra as versões efetivas. `docs/dependency-audit.json` contém o relatório da execução. Ausência de alertas conhecidos não significa ausência de vulnerabilidades.

## Limites

Não foram feitos teste de carga, revisão externa de segurança, execução em vários servidores, implantação pública, teste de recuperação de desastre ou validação com usuários reais. Funções ainda não migradas estão listadas no README. O projeto antigo em `legado` não recebe estas garantias e não é executado pelo novo servidor.
