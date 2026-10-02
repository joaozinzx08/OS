# Roteiro de demonstração do TCC

A qualidade depende de atender aos critérios da professora, explicar as decisões e demonstrar funcionamento. A tecnologia sozinha não garante nota.

## Demonstração sugerida (5–8 minutos)

1. Mostre o problema: solicitações dispersas, sem responsável ou acompanhamento claro.
2. Entre como administrador e explique que os dados vêm da API e do SQLite, não de listas fixas no HTML.
3. Cadastre um setor, uma categoria, um gestor e um colaborador.
4. Entre como colaborador em outra janela/perfil de navegador e crie uma ordem. Explique título, setor, categoria, prioridade e protocolo.
5. Entre como gestor do setor, inicie atendimento e escreva uma justificativa. Atribua responsável e prazo.
6. Responda pelo histórico e conclua a ordem. Mostre a notificação e o painel atualizados.
7. Demonstre uma regra de segurança: colaborador não gerencia usuários; gestor de outro setor não consegue editar a ordem, nem chamando a API diretamente.
8. Reinicie o servidor e mostre que os dados continuam no SQLite.
9. Execute `npm test` e mostre os testes de isolamento, autenticação, transações e permissões.
10. Abra `docs/API.md` e uma migration; explique como a API se separa da interface e como o banco evolui.

## Pontos técnicos para explicar com suas palavras

- **React:** componentes e estados, formulários, rotas e reaproveitamento de layout.
- **Vite:** servidor de desenvolvimento, proxy de API e compilação de produção.
- **API REST:** recursos, métodos e códigos HTTP coerentes.
- **MVC adaptado à API:** controllers HTTP, models Sequelize e services para regras.
- **Modelagem relacional:** chaves primárias/estrangeiras, restrições, índices e isolamento entre empresas.
- **Transações:** uma alteração de OS e seu histórico são confirmados juntos; falha desfaz tudo.
- **Autenticação x autorização:** identificar a sessão é diferente de permitir uma ação.
- **Bcrypt:** senha armazenada como hash; não é criptografia reversível.
- **JWT e sessão:** assinatura e expiração, com sessão no banco para logout e revogação.
- **HTTP x HTTPS:** métodos não criptografam; TLS exige certificado e configuração.
- **Testes:** demonstram comportamentos específicos, não provam ausência de todos os defeitos.

## Divisão possível do grupo

| Frente | Entrega/explicação |
|---|---|
| Banco | Modelo, migrations, relacionamentos e backup |
| Backend | Rotas, validação, regras de OS e testes |
| Segurança | Perfis, sessão, escopos, demonstrações de acesso negado |
| Frontend | Componentes, formulários, responsividade e integração |
| Documentação | Requisitos, casos de uso, limites e roteiro |

## Próximas etapas reais

Validar regras com a empresa-alvo e professora; desenvolver anexos protegidos, relatórios exportáveis e SLA por horários úteis; depois avaliar kanban, calendário e chat conforme prioridade. Marcar no texto do TCC o que está implementado e o que ainda é proposta. Manter registros de testes com resultado, data e versão. Identificar adequadamente o uso de assistência de IA conforme as regras da escola e garantir que o grupo compreenda o código apresentado.
