# ADR-0010 — Observabilidade com OpenTelemetry

- **Status**: Aceita
- **Data**: 2026-08-28

## Contexto

Quando um usuário diz "o app não sincronizou", precisamos responder o que
aconteceu — em qual requisição, em qual dispositivo, quanto tempo levou e onde
falhou. Isso atravessa três aplicações e vários serviços.

Sem correlação entre elas, a investigação vira `grep` em três lugares e adivinhação.

## Decisão

**OpenTelemetry** como camada de instrumentação, com o backend de observabilidade
tratado como detalhe substituível.

| Sinal    | Como                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------- |
| Traces   | Instrumentação automática de HTTP, Prisma e BullMQ, mais spans manuais no motor de sync           |
| Métricas | RED (Rate, Errors, Duration) por rota, mais métricas de negócio (notas criadas, syncs, conflitos) |
| Logs     | Pino em JSON, com `traceId` e `requestId` em toda linha                                           |

Todo request recebe um `requestId` (UUID v7), propagado no cabeçalho `traceparent`
para os clientes e devolvido em todo erro ([ADR-0009](0009-erros-problem-details.md)).

Em desenvolvimento: exportador OTLP para um Jaeger local. Em produção: qualquer
backend compatível com OTLP.

## Alternativas consideradas

### SDK proprietário (Datadog, New Relic, Sentry APM)

Menos configuração inicial, dashboards prontos. **Descartada como camada primária**:
acopla o código à ferramenta e torna a troca de fornecedor uma refatoração. Com
OTLP, trocar de backend é mudar uma variável de ambiente.

O Sentry continua em uso, mas **apenas para captura de exceções** — onde entrega
valor que o OTel não cobre sozinho (agrupamento, source maps, contexto de release).

### Só logs, sem traces

**Descartada**: log não responde "onde o tempo foi gasto nesta requisição". Em um
fluxo de sync com dezenas de operações, essa é exatamente a pergunta.

### Métricas com Prometheus puro

**Descartada como escolha exclusiva**: resolveria métricas, não traces. O OTel
exporta para Prometheus se quisermos manter esse backend.

## Consequências

### Positivas

- Uma requisição rastreável de ponta a ponta: cliente → API → banco → job.
- Backend de observabilidade substituível sem tocar no código de aplicação.
- Log estruturado correlacionado com trace: do sintoma à causa em um salto.
- Métricas de negócio no mesmo lugar das técnicas.

### Negativas

- Overhead de instrumentação (mitigado com amostragem: 100% de erros, 10% do resto).
- Configuração inicial mais trabalhosa que instalar um SDK proprietário.
- É preciso cuidar para que atributo de span nunca carregue conteúdo de nota — o
  que seria vazamento de dado pessoal para o backend de observabilidade.

## Quando revisitar

Se o custo de operar a coleta superar o de um SaaS integrado — cenário plausível se
o time crescer sem alguém dedicado a plataforma.
