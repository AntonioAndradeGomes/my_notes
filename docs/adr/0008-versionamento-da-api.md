# ADR-0008 — Versionamento da API por caminho de URL

- **Status**: Aceita
- **Data**: 2026-08-28

## Contexto

Apps móveis instalados não atualizam quando queremos. Um usuário pode ficar meses
com uma versão antiga — e ela precisa continuar funcionando. Isso torna o
versionamento da API um requisito, não um refinamento.

## Decisão

Versionamento por **caminho de URL**: `/api/v1/notes`.

Regras de compatibilidade:

- Mudanças **retrocompatíveis** (campo novo opcional, endpoint novo, valor novo em
  enum de resposta) entram na versão atual, sem nova versão.
- Mudanças **quebra-compatibilidade** (remover ou renomear campo, mudar tipo, tornar
  obrigatório o que era opcional, mudar semântica) exigem `v2`.
- Uma versão depreciada é mantida por **no mínimo 12 meses** após o anúncio, com
  cabeçalhos `Deprecation` e `Sunset` em toda resposta.

Cliente que envia um valor novo de enum que o servidor não conhece recebe `422`;
cliente que **recebe** um valor de enum desconhecido deve degradar graciosamente —
isso está documentado como contrato do cliente em [api/conventions.md](../api/conventions.md).

## Alternativas consideradas

### Versão por cabeçalho (`Accept: application/vnd.mynotes.v1+json`)

Mais "correto" segundo a ortodoxia REST. **Descartada**: URLs deixam de ser
autoexplicativas, testar com `curl` fica chato, cache de proxy fica mais sujeito a
erro e a maioria das ferramentas lida pior com isso. O ganho é estético.

### Versão por query string (`?version=1`)

**Descartada**: fácil de esquecer, fácil de cair num padrão implícito e ruim para
cache.

### Sem versionamento, só evolução compatível

**Descartada**: funciona até a primeira vez que não funciona. Com app instalado no
celular do usuário, não há como forçar a atualização no dia em que for preciso quebrar.

## Consequências

### Positivas

- Óbvio ao ler a URL, ao ler o log e ao depurar.
- Duas versões podem coexistir sem ambiguidade de roteamento.
- O NestJS suporta versionamento por URI nativamente, por controller.

### Negativas

- Duplicação de controllers e DTOs enquanto duas versões coexistem.
- Tentação de criar `v2` por conveniência em vez de necessidade — por isso a regra
  de compatibilidade acima é explícita.
- Clientes que fixam a URL precisam ser atualizados para migrar.

## Quando revisitar

Se a API se tornar pública para terceiros em escala, o versionamento por cabeçalho
com negociação de conteúdo pode voltar à discussão.
