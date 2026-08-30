## O que muda

<!-- Descreva a mudança em uma ou duas frases. O "porquê" importa mais que o "como". -->

Closes #

## Tipo

- [ ] `feat` — nova funcionalidade
- [ ] `fix` — correção de bug
- [ ] `refactor` — mudança interna sem alterar comportamento
- [ ] `docs` — documentação
- [ ] `chore` / `ci` / `build`

## Escopo afetado

- [ ] `api` · [ ] `web` · [ ] `mobile` · [ ] `contracts` · [ ] `infra` · [ ] `docs`

## Como verificar

<!-- Passos para o revisor reproduzir. Se houve mudança visual, anexe capturas. -->

1.

## Checklist

- [ ] `make check` passa localmente
- [ ] Testes cobrindo o comportamento novo ou o bug corrigido
- [ ] Documentação atualizada (README, `docs/`, OpenAPI)
- [ ] Se muda o contrato da API: `docs/api/openapi.yaml` atualizado e versionado
- [ ] Se muda o schema: migration criada e reversível
- [ ] Se é breaking change: descrito abaixo, com plano de migração
- [ ] Nenhum segredo, token ou dado real foi commitado

## Breaking changes

<!-- Descreva o impacto e o caminho de migração, ou escreva "Nenhum". -->
