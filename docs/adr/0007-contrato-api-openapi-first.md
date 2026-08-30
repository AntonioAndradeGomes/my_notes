# ADR-0007 — Contrato OpenAPI antes da implementação

- **Status**: Aceita
- **Data**: 2026-08-28

## Contexto

Três clientes consomem a mesma API, e dois deles (web e mobile) são escritos em
linguagens diferentes. Sem um contrato explícito, o comportamento real da API vira
conhecimento tácito — e cada cliente descobre à sua maneira que um campo pode ser
nulo.

Havia duas ordens possíveis: gerar a especificação a partir do código (com
decorators do `@nestjs/swagger`) ou escrever a especificação primeiro e gerar
tipos e clientes a partir dela.

## Decisão

**Design-first**: [`docs/api/openapi.yaml`](../api/openapi.yaml) é a fonte da
verdade. Escrito e revisado **antes** da implementação.

A partir dele são gerados:

| Alvo                                                      | Ferramenta           |
| --------------------------------------------------------- | -------------------- |
| Tipos e schemas Zod para API e web (`@mynotes/contracts`) | `openapi-zod-client` |
| Cliente Dart do app mobile                                | `openapi-generator`  |
| Documentação navegável                                    | Redoc                |

A CI valida a especificação (`pnpm api:validate`) e falha se a implementação
divergir do contrato (testes de contrato na Fase 1).

## Alternativas consideradas

### Code-first com `@nestjs/swagger`

Menos arquivos, spec sempre "atualizada". **Descartada**: a especificação vira um
subproduto do código, e mudanças de contrato entram sem discussão explícita —
alguém renomeia um campo e a spec acompanha silenciosamente. Design-first força
a conversa a acontecer na revisão da PR, **antes** de quebrar clientes.

### Sem especificação formal, só documentação em Markdown

**Descartada**: nada é gerado a partir de prosa, e prosa desatualiza sem que
nenhuma ferramenta perceba.

### tRPC

Excelente segurança de tipos ponta a ponta. **Descartada**: é TypeScript-only. O
app Flutter ficaria de fora — o que elimina justamente o cliente que mais se
beneficia de um contrato rígido.

## Consequências

### Positivas

- Um contrato, três clientes, zero divergência de interpretação.
- Mudança de contrato é visível em diff e discutível na PR.
- Frontend e mobile podem trabalhar contra um mock gerado antes de a API existir.
- Documentação da API sempre válida — a CI garante.

### Negativas

- Disciplina exigida: mexeu na API, atualiza o YAML na mesma PR.
- Um arquivo YAML grande, que precisa de organização (`components` bem fatiados).
- Risco de deriva se os testes de contrato não forem levados a sério.

## Quando revisitar

Se o custo de manter o YAML superar o benefício — sinal de que a API estabilizou e
a geração poderia passar a ser code-first, com a spec congelada como referência.
