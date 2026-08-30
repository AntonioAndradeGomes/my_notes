# Observabilidade

Instrumentação com OpenTelemetry ([ADR-0010](../adr/0010-observabilidade-opentelemetry.md)).
O objetivo prático: responder "o que aconteceu com a requisição do usuário X às
14h03" sem adivinhação.

## Os três sinais

### Logs

Pino, JSON estruturado, uma linha por evento:

```json
{
  "level": "info",
  "time": "2026-08-28T14:03:11.221Z",
  "requestId": "018f2e9a-7c3b-7000-8000-a1b2c3d4e5f6",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "userId": "018f2e12-...",
  "method": "POST",
  "route": "/api/v1/notes",
  "status": 201,
  "durationMs": 43
}
```

Regras:

- **Nunca logue conteúdo de nota.** É dado pessoal. Logue o `id`, o tamanho, nunca o texto.
- **Redação automática** de `password`, `token`, `authorization`, `refreshToken`.
- Nível `error` só para o que exige ação humana. Erro esperado do usuário
  (validação, `404`) é `info`.
- `console.log` não existe em produção — o linter bloqueia.

### Traces

Instrumentação automática de HTTP, Prisma e BullMQ; spans manuais onde o
detalhe importa:

```ts
await tracer.startActiveSpan('sync.push', async (span) => {
  span.setAttribute('sync.operation_count', operations.length);
  span.setAttribute('sync.conflict_count', conflicts.length);
  // nunca: span.setAttribute('note.content', ...)
});
```

Amostragem: **100% dos erros e das requisições lentas**, 10% do restante.

### Métricas

RED por rota — Rate, Errors, Duration — mais métricas de negócio:

| Métrica                         | Tipo       | Para quê                       |
| ------------------------------- | ---------- | ------------------------------ |
| `http_requests_total`           | contador   | Volume por rota e status       |
| `http_request_duration_seconds` | histograma | Latência p50, p95, p99         |
| `notes_created_total`           | contador   | Uso do produto                 |
| `sync_operations_total`         | contador   | Volume de sincronização        |
| `sync_conflicts_total`          | contador   | Saúde do motor de sync         |
| `auth_failures_total`           | contador   | Sinal de ataque de força bruta |
| `db_pool_active`                | gauge      | Saturação do pool de conexões  |
| `queue_depth`                   | gauge      | Acúmulo de jobs                |

`sync_conflicts_total` subindo é o alarme mais importante: significa que usuários
estão perdendo tempo reconciliando notas.

## Correlação

Todo request recebe um `requestId` (UUID v7), propagado via `traceparent`, presente
em toda linha de log, em todo span e em todo corpo de erro
([ADR-0009](../adr/0009-erros-problem-details.md)).

O caminho de investigação:

```text
usuário reporta o problema com o requestId
  → busca nos logs pelo requestId
  → do log, salta para o trace pelo traceId
  → no trace, vê exatamente onde o tempo foi gasto e o que falhou
```

## Alertas

Alerta que não exige ação é ruído — e ruído treina o time a ignorar alertas.

| Alerta                     | Condição                     | Severidade              |
| -------------------------- | ---------------------------- | ----------------------- |
| API fora do ar             | Readiness falhando por 2 min | Crítico — acorda alguém |
| Taxa de erro alta          | 5xx > 5% por 5 min           | Crítico                 |
| Latência degradada         | p95 > 2 s por 10 min         | Aviso                   |
| Pool de conexões saturado  | > 90% por 5 min              | Aviso                   |
| Fila acumulando            | Profundidade > 1000          | Aviso                   |
| Conflitos de sync anômalos | 3× a média da semana         | Aviso                   |
| Pico de falhas de login    | > 100/min                    | Aviso de segurança      |
| Certificado expirando      | < 14 dias                    | Aviso                   |

## Painéis

| Painel           | Público     | Conteúdo                                                |
| ---------------- | ----------- | ------------------------------------------------------- |
| Saúde do serviço | Plantão     | RED, saturação, dependências                            |
| Sincronização    | Time mobile | Volume, conflitos, latência, tamanho de fila            |
| Produto          | Todos       | Usuários ativos, notas criadas, uso das funcionalidades |
| Segurança        | Plantão     | Falhas de login, rate limit, reuso de refresh token     |

## Em desenvolvimento

```bash
docker run -d --name jaeger -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one
```

Com `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` no `.env`, os traces
aparecem em <http://localhost:16686>.

Os logs em dev saem formatados para leitura humana (`pino-pretty`), não em JSON.

## Privacidade

Observabilidade envia dados para fora da aplicação — às vezes para um terceiro.
Portanto:

- Conteúdo de nota **nunca** vai para log, span ou métrica.
- E-mail não aparece em log; o `userId` identifica sem expor.
- Retenção: logs por 90 dias, traces por 7, métricas agregadas por 13 meses.
- Painel de produção não expõe dado individual identificável.
