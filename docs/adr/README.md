# Registro de Decisões Arquiteturais (ADR)

Uma ADR registra **uma decisão**, o contexto em que ela foi tomada e o que foi
descartado. Não é documentação de como o sistema funciona — isso é o papel de
[architecture/](../architecture/). ADR responde à pergunta que aparece seis meses
depois: _"por que diabos isso é assim?"_.

## Índice

| #                                             | Decisão                                        | Status | Data       |
| --------------------------------------------- | ---------------------------------------------- | ------ | ---------- |
| [0001](0001-monorepo-pnpm-turborepo.md)       | Monorepo com pnpm workspaces e Turborepo       | Aceita | 2026-08-28 |
| [0002](0002-backend-nestjs.md)                | NestJS como framework do backend               | Aceita | 2026-08-28 |
| [0003](0003-postgresql-prisma.md)             | PostgreSQL com Prisma                          | Aceita | 2026-08-28 |
| [0004](0004-auth-jwt-refresh-rotativo.md)     | Autenticação JWT com refresh rotativo          | Aceita | 2026-08-28 |
| [0005](0005-frontend-nextjs-app-router.md)    | Next.js com App Router no frontend             | Aceita | 2026-08-28 |
| [0006](0006-mobile-flutter-riverpod.md)       | Flutter com Riverpod e Drift no mobile         | Aceita | 2026-08-28 |
| [0007](0007-contrato-api-openapi-first.md)    | Contrato OpenAPI antes da implementação        | Aceita | 2026-08-28 |
| [0008](0008-versionamento-da-api.md)          | Versionamento da API por caminho de URL        | Aceita | 2026-08-28 |
| [0009](0009-erros-problem-details.md)         | Erros em `application/problem+json` (RFC 9457) | Aceita | 2026-08-28 |
| [0010](0010-observabilidade-opentelemetry.md) | Observabilidade com OpenTelemetry              | Aceita | 2026-08-28 |

## Status possíveis

- **Proposta** — em discussão, ainda não vale.
- **Aceita** — vale hoje.
- **Depreciada** — não vale mais, e nada a substituiu.
- **Substituída por ADR-XXXX** — foi trocada por outra decisão.

## Quando escrever uma ADR

Quando a decisão é **cara de reverter** ou **não é óbvia para quem chega depois**:

- Adotar, trocar ou remover uma tecnologia estrutural
- Mudar um padrão que atravessa vários módulos
- Escolher entre duas abordagens em que a perdedora também era defensável
- Aceitar conscientemente uma dívida técnica

Não escreva ADR para escolha de biblioteca utilitária, formatação de código ou
qualquer coisa que uma PR resolve sozinha.

## Como escrever

```bash
cp docs/adr/template.md docs/adr/00XX-titulo-curto.md
```

Numeração sequencial, nunca reaproveitada. **ADR aceita não se edita**: se a
decisão mudou, escreva uma nova e marque a antiga como substituída. O registro
histórico é o valor — reescrevê-lo o destrói.
