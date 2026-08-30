# Fluxo Git e commits

## Branches

| Branch               | Papel                               | Protegida |
| -------------------- | ----------------------------------- | --------- |
| `main`               | Sempre entregável; espelha produção | Sim       |
| `develop`            | Integração; espelha staging         | Sim       |
| `feat/*`, `fix/*`, … | Trabalho em andamento               | Não       |
| `hotfix/*`           | Correção urgente, sai de `main`     | Não       |

Trabalho normal sai de `develop` e volta para `develop`. `develop` vai para `main`
em cada release.

Hotfix é a exceção: sai de `main`, volta para `main` **e** para `develop` — esquecer
o segundo passo faz a correção sumir na próxima release.

## Nome de branch

```text
feat/busca-por-tags
fix/refresh-token-corrida
docs/adr-versionamento-api
refactor/extrai-caso-de-uso-de-nota
```

## Commits

[Conventional Commits](https://www.conventionalcommits.org/pt-br/), validados pelo
hook de `commit-msg`.

```text
<tipo>(<escopo>): <descrição no imperativo>

[corpo opcional]

[rodapé opcional]
```

### Tipos

| Tipo       | Uso                                          |
| ---------- | -------------------------------------------- |
| `feat`     | Nova funcionalidade                          |
| `fix`      | Correção de bug                              |
| `refactor` | Mudança interna sem alterar comportamento    |
| `perf`     | Melhoria de desempenho                       |
| `test`     | Testes                                       |
| `docs`     | Documentação                                 |
| `build`    | Build ou dependências                        |
| `ci`       | Pipelines                                    |
| `chore`    | Manutenção sem impacto em código de produção |
| `revert`   | Reversão de commit                           |

### Escopos

`api`, `web`, `mobile`, `contracts`, `ui`, `docs`, `infra`, `ci`, `deps`, `repo`.

### Bons e maus exemplos

```text
✅ feat(api): busca de notas por múltiplas tags
✅ fix(mobile): evita duplicação de nota quando o push sofre timeout
✅ docs(adr): registra a escolha de Prisma sobre Drizzle
✅ perf(api): substitui consulta em laço por um único IN na listagem

❌ update                        # atualiza o quê?
❌ feat: mudanças                # descrição vazia
❌ fix(api): Corrigido o bug.    # não é imperativo, não diz qual bug
```

A descrição completa a frase "este commit vai…": _"…adicionar busca por tags"_.

### Corpo

Use para explicar **por que**, quando não for óbvio:

```text
fix(api): serializa refreshes concorrentes do mesmo token

Duas requisições renovando ao mesmo tempo eram lidas como reuso de token
e derrubavam todas as sessões do usuário. Agora a segunda espera o
resultado da primeira dentro de uma janela de 5 segundos.

Closes #142
```

### Breaking change

```text
feat(api)!: remove o campo `folder` de Note

BREAKING CHANGE: `folder` foi substituído por `notebookId`. Clientes
anteriores à v1.4.0 do app precisam atualizar. `folder` continuou sendo
enviado por dois releases e agora foi removido.
```

## Merge

**Squash merge**, sempre. Um commit por mudança em `main` — o que torna `git log`
legível e `git revert` seguro.

Consequência: o histórico dentro da sua branch é seu. Commit "wip" durante o
trabalho é aceitável; a mensagem que sobrevive é a do PR.

## Rebase vs merge

Antes de abrir o PR, rebase na branch base para resolver conflitos:

```bash
git fetch origin
git rebase origin/develop
```

**Depois que a revisão começou, não force-push.** Isso quebra a visualização
incremental de mudanças. Faça commits novos.

## Tags e releases

Versionamento semântico, tag na `main`:

```bash
git tag -a v1.2.0 -m "Busca por tags e lixeira"
git push origin v1.2.0
```

O `CHANGELOG.md` é gerado a partir dos commits convencionais — mais um motivo para
escrevê-los com cuidado.
