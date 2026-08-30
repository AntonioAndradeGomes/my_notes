# Contribuindo com o MyNotes

Obrigado pelo interesse. Este documento cobre o essencial; os guias em
[`docs/guides/`](docs/guides/) trazem o detalhe.

## Antes de começar

1. Configure o ambiente: [docs/guides/getting-started.md](docs/guides/getting-started.md)
2. Entenda o desenho: [docs/architecture/overview.md](docs/architecture/overview.md)
3. Leia os padrões: [docs/guides/coding-standards.md](docs/guides/coding-standards.md)

## O caminho de uma contribuição

### 1. Comece por uma issue

Toda mudança nasce em uma issue. Para bug, use o template e descreva como
reproduzir. Para funcionalidade, descreva **o problema** antes da solução.

Isso não é burocracia — é onde se descobre que a mudança precisa ser outra, antes
de você gastar um dia com a primeira ideia.

Se a mudança envolve uma decisão cara de reverter, escreva a
[ADR](docs/adr/README.md) antes de codar.

### 2. Branch

```bash
git checkout -b feat/descricao-curta
```

### 3. Código e testes juntos

Teste escrito depois testa o que o código faz. Teste escrito junto testa o que ele
deveria fazer. Ver [docs/guides/testing.md](docs/guides/testing.md).

### 4. Verificação local

```bash
make check
```

Roda exatamente o que a CI roda. Se passa aqui, passa lá.

### 5. Commit

[Conventional Commits](docs/guides/git-workflow.md), validado por hook:

```bash
git commit -m "feat(api): busca de notas por múltiplas tags"
```

### 6. Pull Request

Preencha o template. Três coisas que fazem diferença:

- **Explique o porquê.** O diff já mostra o quê.
- **Diga como verificar.** O revisor precisa reproduzir.
- **Mantenha pequena.** Acima de ~400 linhas, a revisão perde qualidade. Quebre em
  uma sequência de PRs.

## O que a revisão vai cobrar

- [ ] Comportamento novo tem teste
- [ ] Mudança de API atualiza o [OpenAPI](docs/api/openapi.yaml)
- [ ] Mudança de schema traz migration reversível (ou plano de rollback escrito)
- [ ] Consulta ao banco escopada por usuário
- [ ] Sem `any`, sem `console.log`, sem segredo
- [ ] Documentação atualizada quando o comportamento muda
- [ ] Erro novo catalogado em [docs/api/errors.md](docs/api/errors.md)

## Revisando o código de outra pessoa

- Separe o que **bloqueia** do que é sugestão: prefixe `blocking:` ou `nit:`.
- Aponte o problema, não a pessoa.
- Elogie o que ficou bom. Revisão só negativa desgasta o time.
- Responda em até um dia útil — PR parada é trabalho parado.

## Onde ajudar

| Interesse       | Por onde                                                      |
| --------------- | ------------------------------------------------------------- |
| Backend         | Fase 1 do [roadmap](docs/roadmap.md)                          |
| Frontend        | Fase 2                                                        |
| Mobile          | Fase 3                                                        |
| Documentação    | Qualquer trecho confuso é um bug de documentação — abra issue |
| Bom primeiro PR | Issues marcadas `good first issue`                            |

## Dúvidas

Discussões de arquitetura e perguntas abertas: GitHub Discussions. Issues são para
bugs e propostas concretas.

## Código de conduta

Ao participar, você concorda com o [Código de Conduta](CODE_OF_CONDUCT.md).
