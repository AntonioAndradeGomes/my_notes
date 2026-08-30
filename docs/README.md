# Documentação do MyNotes

Toda a documentação do projeto vive aqui, versionada junto com o código. Se uma
mudança de comportamento não aparece nesta pasta, ela ainda não está pronta.

## Por onde começar

| Se você quer…                         | Leia                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Rodar o projeto pela primeira vez     | [guides/getting-started.md](guides/getting-started.md)                          |
| Entender o desenho geral do sistema   | [architecture/overview.md](architecture/overview.md)                            |
| Saber _por que_ algo é do jeito que é | [adr/](adr/README.md)                                                           |
| Consumir a API                        | [api/openapi.yaml](api/openapi.yaml) e [api/conventions.md](api/conventions.md) |
| Abrir sua primeira PR                 | [guides/development-workflow.md](guides/development-workflow.md)                |
| Saber o que vem a seguir              | [roadmap.md](roadmap.md)                                                        |

## Mapa

### Arquitetura

- [Visão geral](architecture/overview.md) — contexto, contêineres e fluxos principais (C4)
- [Backend](architecture/backend.md) — camadas, módulos e convenções do NestJS
- [Frontend](architecture/frontend.md) — App Router, RSC, estado e sessão
- [Mobile](architecture/mobile.md) — Clean Architecture, Riverpod e armazenamento local
- [Modelo de dados](architecture/data-model.md) — entidades, relacionamentos e índices
- [Segurança](architecture/security.md) — autenticação, autorização e modelo de ameaças
- [Offline e sincronização](architecture/offline-sync.md) — delta sync, conflitos e limites

### Decisões

- [Índice de ADRs](adr/README.md) — o registro de decisões arquiteturais

### API

- [Contrato OpenAPI](api/openapi.yaml) — fonte da verdade do contrato HTTP
- [Convenções](api/conventions.md) — paginação, filtros, idempotência, versionamento
- [Erros](api/errors.md) — catálogo de códigos e formato `application/problem+json`

### Guias

- [Primeiros passos](guides/getting-started.md)
- [Fluxo de desenvolvimento](guides/development-workflow.md)
- [Padrões de código](guides/coding-standards.md)
- [Fluxo Git e commits](guides/git-workflow.md)
- [Estratégia de testes](guides/testing.md)
- [Variáveis de ambiente](guides/environment-variables.md)
- [Solução de problemas](guides/troubleshooting.md)

### Operação

- [CI/CD e deploy](operations/ci-cd.md)
- [Observabilidade](operations/observability.md)
- [Runbook de incidentes](operations/runbook.md)

## Convenções desta documentação

- **Idioma**: português do Brasil na prosa; identificadores, comandos e nomes de
  arquivo em inglês (como no código).
- **Diagramas**: Mermaid embutido no Markdown — renderiza no GitHub e não vira
  imagem desatualizada.
- **Decisões vão em ADR**, não em README. README descreve _o que é_; ADR explica
  _por que é assim_ e o que foi descartado.
- **Nada de "TODO" solto**: o que ainda não existe é marcado com a fase do
  [roadmap](roadmap.md) correspondente.
