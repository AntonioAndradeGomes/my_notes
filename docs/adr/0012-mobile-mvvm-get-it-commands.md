# ADR-0012 — MVVM com get_it, Commands e Result no app Flutter

- **Status**: Aceita
- **Data**: 2026-08-31

## Contexto

Havia um documento anterior (ADR-0006) registrando uma stack para o app Flutter —
Riverpod, Drift, Clean Architecture em três camadas — que **nunca foi decidida por
ninguém**: era suposição de quem redigiu a documentação inicial, apresentada como
escolha do time. Foi removido, e não apenas substituído: uma ADR existe para
registrar decisões reais, e aquela não registrava nenhuma. O número 0006 fica vago.

Esta ADR estabelece a arquitetura do app pela primeira vez.

Mudaram também o alcance e as referências:

- O app é para **cinco plataformas**: iOS, Android, macOS, Windows e Linux. A
  documentação anterior falava em "Android e iOS a partir de uma base só".
- O time já tem uma organização de projeto Flutter em uso, com MVVM e injeção de
  dependências por módulo.
- O Flutter publicou um [guia oficial de arquitetura](https://docs.flutter.dev/app-architecture)
  com um estudo de caso completo, que estabelece vocabulário e padrões concretos.

## Decisão

**MVVM conforme o guia oficial do Flutter**, com a organização por módulo que o
time já pratica.

### Camadas e responsabilidades

Seguimos as definições do guia oficial:

| Componente     | Responsabilidade                        | Regra                                                      |
| -------------- | --------------------------------------- | ---------------------------------------------------------- |
| **View**       | Renderizar e capturar interação         | Sem lógica de dados; só conversa com o ViewModel           |
| **ViewModel**  | Estado da tela e transformação de dados | Depende de repositórios, nunca de services                 |
| **Repository** | **Fonte de verdade** de um tipo de dado | Único lugar que muta aquele dado; expõe modelos de domínio |
| **Service**    | Wrapper de uma fonte externa            | Sem estado; nunca acessado pela UI                         |

Fluxo de dependência: `View → ViewModel → Repository → Service`. Estado desce,
eventos sobem.

Modelos de API e modelos de domínio são coisas distintas: o service devolve o
modelo da API, o repositório traduz para o modelo de domínio. A UI só enxerga o
segundo.

### Stack

| Peça                        | Escolha                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| Injeção de dependências     | `get_it`, com registro por módulo                                 |
| Navegação                   | `go_router`                                                       |
| Estado                      | `ChangeNotifier` + `ListenableBuilder` / `ValueListenableBuilder` |
| Operações assíncronas na UI | Padrão **Command**                                                |
| Erros                       | `result_dart`                                                     |
| Cliente HTTP                | `dio`                                                             |
| Banco local                 | `drift` (SQLite)                                                  |
| Modelos                     | `freezed` + `json_serializable`                                   |

### Organização de diretórios

Módulo como unidade: cada funcionalidade reúne as próprias camadas e registra as
próprias dependências.

```text
lib/
├── core/
│   ├── ds/                     # design system
│   ├── i18n/
│   ├── services/               # api_service, storage_service
│   └── utils/
├── modules/
│   └── <modulo>/
│       ├── models/
│       ├── services/
│       ├── repositories/
│       ├── viewmodels/
│       ├── views/
│       └── <modulo>_module.dart   # initModule(getIt)
├── routing/
├── main_module.dart            # setupDependencies()
└── main.dart
```

## Alternativas consideradas

### `package:provider` para injeção de dependências

**É o que o guia oficial recomenda** — a documentação do Flutter afirma
explicitamente que times do Google recomendam `provider`, e o Compass app o usa.

**Descartada** conscientemente. O `provider` amarra a resolução de dependências à
árvore de widgets (`context.read()`), o que traz duas consequências que nos
incomodam: código fora da árvore — motor de sincronização, interceptors, jobs —
não tem `context` para resolver dependências, e testes de ViewModel passam a
depender de um `BuildContext` que nada tem a ver com a lógica testada.

O `get_it` é um service locator independente da árvore. Perde-se o escopo
automático por subárvore, que passa a ser responsabilidade do `initModule` de
cada módulo.

Esta é uma divergência deliberada da recomendação oficial, e é o tipo de coisa
que merece estar escrita: quem chegar depois vai comparar nosso código com a
documentação do Flutter e notar a diferença.

### Estrutura de diretórios do Compass app

O estudo de caso organiza por camada primeiro:

```text
lib/ui/<feature>/view_models/ · lib/data/repositories/ · lib/domain/models/
```

**Descartada** em favor da organização por módulo. As duas expressam exatamente
as mesmas camadas; a diferença é o eixo de agrupamento. Módulo coloca tudo de uma
funcionalidade junto, o que encurta a navegação no dia a dia e torna óbvio onde
registrar dependências — o `<modulo>_module.dart` fica ao lado do que registra.

### `http` em vez de `dio`

Mais leve e mantido pela própria equipe do Dart. **Descartado**: o `dio` traz
interceptors de primeira classe, e precisamos de três — injetar o `Bearer`,
renovar o token em `401` serializando as chamadas concorrentes, e repetir com
backoff em falha de rede. Com `http` isso viraria uma camada nossa em volta do
cliente, que é exatamente o que o `dio` já é.

### `sqflite`, `Isar` ou `Realm` em vez de `drift`

**Descartados.** O app é offline-first e precisa de consulta relacional (notas por
tag, via tabela de ligação), migrations versionadas e **streams reativas** — a
tela observa o banco e se atualiza sozinha quando o sync grava.

`sqflite` é SQL sem tipagem: as consultas viram string e o erro aparece em tempo
de execução. `Isar` e `Realm` são orientados a objeto e empurrariam as junções
para o código Dart. O `drift` dá SQL tipado sobre SQLite, com verificação em tempo
de compilação, e roda nas cinco plataformas.

O custo é `build_runner`: o `drift` gera código.

### `equatable` ou escrita à mão em vez de `freezed`

**Descartados**, por dois motivos concretos.

`copyWith` manual em um modelo de 11 campos falha em silêncio: esquecer um campo
não gera erro, gera uma nota que desarquiva sozinha ao ser editada. O `freezed`
gera o método completo.

Igualdade por valor interage direto com o `ValueListenableBuilder`, que só
notifica quando `newValue != oldValue`. Sem ela, toda atribuição notifica — mesmo
quando nada mudou.

`equatable` resolveria só o segundo ponto, deixando o `copyWith` à mão. O
argumento mais forte contra o `freezed` seria o custo de `build_runner`, mas o
`drift` já o exige: o ferramental está pago.

**Não** usaremos as uniões seladas do `freezed` para estado de tela. O `Command`
já expressa carregando/erro/pronto e o `Result` já é uma união para sucesso/erro
— uma terceira forma de dizer a mesma coisa só criaria ambiguidade.

### Riverpod, BLoC ou signals

**Descartadas.** O guia oficial reconhece que essas bibliotecas resolvem os mesmos
problemas com ferramentas próprias. `ChangeNotifier` mais Command resolve nosso
caso com o que já vem no framework, sem geração de código nem uma segunda
linguagem de estado para aprender.

A documentação anterior afirmava Riverpod sem que isso tivesse sido decidido.

## Sobre o padrão Command

Vale explicar, porque é a peça menos familiar.

Um `Command` é um objeto que envolve uma ação assíncrona e **carrega o próprio
estado**: `running`, `error`, `completed`, mais o `Result`. Ele vive no ViewModel,
não na View.

O problema que resolve: uma `Future` disparada no `initState` pode resolver antes
de o widget montar, ou a View pode reconstruir no meio da execução. Rastrear
"carregando / erro / pronto" à mão em cada tela produz o mesmo `if` triplicado em
toda parte — e erros de renderização quando o estado e a árvore saem de sincronia.

Como o Command persiste no ViewModel, não importa quando a ação foi disparada ou
quando resolveu: a View pergunta o estado atual e renderiza corretamente.

```dart
class NotesViewModel extends ChangeNotifier {
  NotesViewModel({required NotesRepository repository}) : _repository = repository {
    load = Command0(_load)..execute();
    deleteNote = Command1(_deleteNote);
  }

  late final Command0 load;
  late final Command1<void, String> deleteNote;
}
```

Na View, um `ListenableBuilder` sobre o command cobre os três estados sem
espalhar flags booleanas pela tela.

## Consequências

### Positivas

- A arquitetura passa a refletir o que o time de fato usa, e não uma suposição.
- Vocabulário alinhado ao guia oficial: quem consultar a documentação do Flutter
  encontra os mesmos nomes e os mesmos papéis.
- Command padroniza carregando/erro/pronto e remove uma classe inteira de bug de
  renderização.
- `result_dart` torna o erro parte do tipo de retorno, em vez de exceção que se
  esquece de capturar. Usamos `ResultDart<S, AppFailure>` e não o `Result<S>`
  padrão: este restringe a falha a `Exception`, o que obrigaria todo erro de
  domínio a herdar de `Exception` só para caber no tipo — e um `404` de nota
  inexistente é resultado esperado, não anomalia.
- `get_it` deixa a lógica testável sem `BuildContext`.

### Negativas

- Divergimos da recomendação oficial de DI; quem vier da documentação vai
  estranhar.
- Service locator esconde dependências: uma classe pode chamar `getIt<X>()` no
  meio do código em vez de recebê-la no construtor. **Convenção do projeto:
  dependências entram por construtor; `getIt` só aparece no `initModule` e na
  composição de rotas.**
- `ChangeNotifier` não tem seleção granular de rebuild: um `notifyListeners()`
  reconstrói tudo que escuta. Telas pesadas exigirão dividir o ViewModel ou usar
  `ValueNotifier` por campo.
- Command e Result são código nosso, a manter e testar.

## Em aberto

- **Armazenamento de tokens.** Ver a observação de segurança em
  [architecture/mobile.md](../architecture/mobile.md#armazenamento).

## Quando revisitar

Se o desempenho de `ChangeNotifier` virar problema medido em telas com listas
grandes, ou se o `get_it` levar a dependências ocultas apesar da convenção.
