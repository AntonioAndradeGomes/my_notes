# ADR-0006 — Flutter com Riverpod e Drift no mobile

- **Status**: Aceita
- **Data**: 2026-08-28

## Contexto

O app precisa rodar em Android e iOS, funcionar bem offline e sustentar um motor
de sincronização não trivial. O time é pequeno demais para manter dois apps
nativos em paralelo.

## Decisão

**Flutter 3.41**, com:

- **Riverpod** para estado e injeção de dependência
- **Drift** (SQLite) como banco local
- **go_router** para navegação
- **Dio** com cliente gerado a partir do [OpenAPI](../api/openapi.yaml)
- **freezed** para modelos imutáveis e uniões seladas

## Alternativas consideradas

### React Native

Compartilharia linguagem e parte da lógica com a web. **Descartada**: a ponte
nativa continua sendo fonte de imprevisibilidade de desempenho, e o ecossistema de
persistência local é mais fragmentado. Flutter entrega renderização mais consistente
entre plataformas — o que importa para um editor de texto.

### Nativo (Kotlin + Swift)

Melhor integração com a plataforma. **Descartada**: dobraria o custo de cada
funcionalidade, incluindo o motor de sync — a parte mais cara e mais arriscada de
duplicar.

### BLoC em vez de Riverpod

Padrão consagrado na comunidade Flutter. **Descartada**: muito boilerplate por
funcionalidade, e o Riverpod resolve estado e injeção de dependência com a mesma
peça, com segurança em tempo de compilação e sem depender de `BuildContext` — o
que torna a lógica testável fora da árvore de widgets.

### Hive ou Isar em vez de Drift

Mais simples de começar. **Descartada**: precisamos de consultas relacionais
(notas por caderno e por tag), migrations versionadas e streams reativas. Drift
entrega SQL tipado sobre SQLite; os outros nos empurrariam para junções na mão.

## Consequências

### Positivas

- Uma base de código para Android e iOS, incluindo o motor de sync.
- Drift dá SQL tipado, migrations e streams — a UI reage ao banco sem cola manual.
- Riverpod permite testar providers sem widgets.
- freezed elimina uma classe inteira de bug em objetos de estado.

### Negativas

- Dart é mais uma linguagem no projeto: contexto extra para quem transita.
- Geração de código (`build_runner`) é lenta e precisa rodar antes de compilar.
- Tamanho do app maior que um equivalente nativo.
- Integrações muito específicas de plataforma exigem canais nativos.

## Quando revisitar

Se o produto passar a depender de recursos profundamente nativos (widgets de tela
inicial ricos, integrações do sistema) a ponto de o código de canal nativo superar
o código Dart.
