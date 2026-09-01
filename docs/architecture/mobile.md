# Arquitetura do aplicativo Flutter

Uma base de código para **cinco plataformas**: iOS, Android, macOS, Windows e
Linux. Não é um app "mobile" que roda em desktop por acidente — desktop é alvo de
primeira classe, com layout, navegação e atalhos próprios.

A arquitetura é **MVVM**, conforme o [guia oficial do Flutter](https://docs.flutter.dev/app-architecture),
com organização por módulo e injeção de dependências via `get_it`
([ADR-0012](../adr/0012-mobile-mvvm-get-it-commands.md)).

## Camadas

Duas camadas, quatro papéis:

```text
┌─ UI ──────────────────────────────────┐
│   View  ◄──────────►  ViewModel       │
└───────────────────────────┬───────────┘
                            │ depende de
┌─ Dados ───────────────────▼───────────┐
│   Repository  ◄──────►  Service       │
└───────────────────────────────────────┘
```

| Papel          | Faz                                                         | Não faz                                                   |
| -------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| **View**       | Renderiza, captura interação, layout responsivo             | Lógica de dados, chamada de API, estado complexo          |
| **ViewModel**  | Estado da tela, transforma dados para exibição              | Falar com service direto                                  |
| **Repository** | **Fonte de verdade** de um tipo de dado; cache, retry, sync | Ser acessado pela View; expor service como membro público |
| **Service**    | Envolve uma fonte externa (HTTP, banco local, plugin)       | Guardar estado; conhecer regra de negócio                 |

**Estado desce, eventos sobem.** A View chama um método do ViewModel; o ViewModel
chama o repositório; o repositório notifica; o estado volta pela mesma trilha.

### Modelo de API ≠ modelo de domínio

O service devolve o que a API mandou (`NoteApiModel`). O repositório traduz para
o modelo de domínio (`Note`). A UI só enxerga o segundo.

Isso não é cerimônia: o [contrato da API](../api/openapi.yaml) tem campos que a
tela não usa (`version`, `clientUpdatedAt`) e formatos que ela não quer (datas em
ISO 8601 UTC). Traduzir uma vez, no repositório, evita que cada tela lide com isso.

## Organização

Módulo é a unidade: uma funcionalidade reúne as próprias camadas e registra as
próprias dependências.

```text
lib/
├── core/
│   ├── ds/                          # design system: tokens, temas, widgets base
│   ├── i18n/
│   ├── services/
│   │   ├── api_service.dart         # cliente HTTP, interceptors, refresh de token
│   │   └── storage_service.dart
│   └── utils/
│       ├── command.dart             # Command0, Command1
│       └── result.dart              # reexporta result_dart
├── modules/
│   ├── auth/
│   │   ├── models/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── viewmodels/
│   │   ├── views/
│   │   └── auth_module.dart         # initAuthModule(getIt)
│   ├── notes/
│   ├── tags/
│   └── settings/
├── routing/
├── main_module.dart                 # setupDependencies()
└── main.dart
```

O guia oficial agrupa por camada primeiro (`lib/ui/<feature>/`, `lib/data/`).
Optamos pelo eixo oposto — módulo primeiro — porque coloca tudo de uma
funcionalidade junto e deixa o registro de dependências ao lado do que ele
registra. As camadas são as mesmas; muda o agrupamento
([ADR-0012](../adr/0012-mobile-mvvm-get-it-commands.md)).

## Injeção de dependências

Cada módulo expõe um `initModule(getIt)`; o `main_module.dart` chama todos.

```dart
void initAuthModule(GetIt getIt) {
  getIt.registerLazySingleton<AuthService>(() => AuthService(getIt<ApiService>()));
  getIt.registerLazySingleton<AuthRepository>(() => AuthRepository(getIt<AuthService>()));
  getIt.registerFactory<AuthViewModel>(() => AuthViewModel(getIt<AuthRepository>()));
}
```

Repositório e service são `LazySingleton` — são fonte de verdade, e duas
instâncias significariam dois caches divergentes. ViewModel é `Factory` — cada
tela quer o seu, com ciclo de vida próprio.

> **Convenção**: dependências entram por **construtor**. `getIt<X>()` só aparece
> no `initModule` e na composição de rotas. Um service locator chamado no meio do
> código esconde a dependência de quem lê a classe e de quem escreve o teste.

## Command

A peça menos familiar, e a que mais evita bug.

Um `Command` envolve uma ação assíncrona e **carrega o próprio estado**:
`running`, `error`, `completed` e o `Result`. Vive no ViewModel.

O problema que resolve: uma `Future` disparada no `initState` pode resolver antes
de o widget montar, e a View pode reconstruir no meio. Rastrear
carregando/erro/pronto à mão repete o mesmo `if` triplo em toda tela — e produz
erro de renderização quando estado e árvore saem de sincronia.

```dart
class NotesViewModel extends ChangeNotifier {
  NotesViewModel({required NotesRepository repository}) : _repository = repository {
    load = Command0(_load)..execute();
    deleteNote = Command1(_deleteNote);
  }

  late final Command0 load;
  late final Command1<void, String> deleteNote;

  Future<Result<List<Note>>> _load() => _repository.list();
  Future<Result<void>> _deleteNote(String id) => _repository.delete(id);
}
```

Na View, um `ListenableBuilder` sobre o command cobre os três estados:

```dart
ListenableBuilder(
  listenable: viewModel.load,
  builder: (context, child) {
    if (viewModel.load.running) return const NotesSkeleton();
    if (viewModel.load.error) return ErrorView(onRetry: viewModel.load.execute);
    return child!;
  },
  child: const NotesList(),
)
```

Como o Command persiste no ViewModel, **não importa quando a ação foi disparada
nem quando resolveu** — a View pergunta o estado atual e acerta.

## Erros: o pacote `result_dart`

O erro é parte do **tipo de retorno**, não uma exceção que alguém esquece de
capturar. Quem lê a assinatura já sabe que a operação pode falhar; quem consome é
obrigado pelo compilador a tratar os dois caminhos.

### Os tipos

| Tipo                        | Uso                                                             |
| --------------------------- | --------------------------------------------------------------- |
| `Result<S>`                 | Sucesso de tipo `S`; a falha é obrigatoriamente uma `Exception` |
| `ResultDart<S, F>`          | Sucesso `S` e falha `F` — para tipo de erro próprio             |
| `Success<S>` / `Failure<F>` | As duas variantes concretas                                     |

**Usamos `ResultDart<S, AppFailure>`**, não o `Result<S>` padrão. O `Result`
restringe a falha a `Exception`, o que obrigaria todo erro de domínio a herdar de
`Exception` só para caber no tipo — e exceção existe para o que é excepcional.
Um `404` de nota inexistente é resultado esperado, não anomalia.

### Criando

```dart
// sucesso — três formas equivalentes
return Success(note);
return successOf(note);
return note.toSuccess();

// falha
return Failure(NoteNotFound());
return failureOf(NoteNotFound());
return NoteNotFound().toFailure();
```

`toSuccess()` e `toFailure()` são extensões e **não funcionam sobre um `Result`
nem sobre um `Future`** — só sobre o valor cru.

### Consumindo

| Método                              | Devolve                          |
| ----------------------------------- | -------------------------------- |
| `fold(onSuccess, onFailure)`        | O resultado de um dos dois ramos |
| `getOrNull()`                       | O valor, ou `null`               |
| `getOrElse(fn)` / `getOrDefault(v)` | O valor, ou uma alternativa      |
| `getOrThrow()`                      | O valor, ou lança                |
| `exceptionOrNull()`                 | A falha, ou `null`               |
| `isSuccess()` / `isFailure()`       | `bool`                           |

**Prefira `fold`.** Ele obriga a tratar os dois caminhos; `getOrNull` transforma
a falha em `null` e joga o problema para o próximo `if`, que é exatamente o que o
`Result` existe para evitar. `getOrThrow` só em teste.

### Encadeando

```dart
Future<ResultDart<Note, AppFailure>> publish(String id) async {
  final result = await _repository.getNote(id);

  return result
      .flatMap((note) => _validate(note))   // encadeia outro Result
      .map((note) => note.copyWith(isPinned: true));  // transforma só o sucesso
}
```

`map` transforma o sucesso e deixa a falha passar; `flatMap` encadeia uma operação
que também devolve `Result`, sem aninhar. Há ainda `mapError`, `recover`, `filter`,
`tap` e `zip`.

### Do `problem+json` ao `AppFailure`

O service traduz a resposta de erro da API ([errors.md](../api/errors.md)) para um
erro de domínio usando o campo **`code`**, que é estável por contrato — nunca o
`title`, que é texto para humanos e pode ser reescrito a qualquer momento.

```dart
AppFailure _mapProblem(ProblemDetails problem) => switch (problem.code) {
      'NOT_FOUND'            => NoteNotFound(),
      'VERSION_CONFLICT'     => NoteConflict(serverState: problem.serverState),
      'TOKEN_EXPIRED'        => SessionExpired(),
      'REFRESH_TOKEN_REUSED' => SessionRevoked(),
      _                      => UnexpectedFailure(problem.requestId),
    };
```

A tela nunca exibe `detail` cru: ela mapeia o `AppFailure` para uma mensagem de
produto. O `requestId` vai para o log local, que é o que permite ao suporte achar
a requisição exata no servidor.

### Relação com o Command

O `Command` guarda um `Result` internamente — é dele que saem `error` e
`completed`. Ou seja: repositório devolve `Result`, o Command o carrega, e a View
lê o estado. Uma única representação de falha atravessa as três camadas.

## Layouts

Três arranjos, um por faixa de largura:

| Formato | Largura     | Arranjo                                               |
| ------- | ----------- | ----------------------------------------------------- |
| Celular | < 600 dp    | Uma coluna; lista → editor em tela cheia              |
| Tablet  | 600–1024 dp | Duas colunas: lista + editor                          |
| Desktop | > 1024 dp   | Três colunas: navegação + lista + editor, com atalhos |

No desktop a janela é redimensionável: o layout precisa degradar continuamente,
não saltar entre três estados fixos.

## Armazenamento

O app é **offline-first**: escrever sem rede é o caso normal. A UI lê do banco
local e reage a ele; a rede atualiza o banco em segundo plano.

| O quê                     | Onde                               | Por quê                                                  |
| ------------------------- | ---------------------------------- | -------------------------------------------------------- |
| Notas, tags, fila de sync | Banco local — **em aberto**        | Precisa de consulta relacional, migrations e reatividade |
| Tokens de autenticação    | Armazenamento seguro da plataforma | Ver o aviso abaixo                                       |
| Preferências de UI        | `shared_preferences`               | Dados triviais, sem valor de segurança                   |

> **Aviso de segurança.** `shared_preferences` grava em **texto plano** —
> `NSUserDefaults` no Apple, XML no Android, arquivo no desktop. Serve para tema e
> tamanho de fonte; **não serve para o refresh token**, que dura 30 dias e permite
> emitir novos access tokens ([security.md](security.md)).
>
> O refresh token deve ir para Keychain (iOS/macOS), Keystore (Android) ou o
> cofre equivalente no Windows/Linux — `flutter_secure_storage` cobre os cinco.
> A escolha final está em aberto na [ADR-0012](../adr/0012-mobile-mvvm-get-it-commands.md).

## Sincronização

O motor de sync é a parte mais delicada do app: bug aqui vira **perda de nota do
usuário**. A estratégia — fila de operações, delta sync por cursor, resolução de
conflito e limites conhecidos — está em [offline-sync.md](offline-sync.md).
Leitura obrigatória antes de tocar nesse código.

## Testes

O guia oficial define os dublês por camada, e seguimos:

| Camada     | Tipo        | Dublê                                  |
| ---------- | ----------- | -------------------------------------- |
| ViewModel  | Unitário    | `Fake` do repositório                  |
| View       | Widget test | `Fake` do repositório + mock do router |
| Repository | Unitário    | `Fake` do service                      |
| Service    | Unitário    | Cliente HTTP mockado                   |

**Fakes, não mocks, para repositórios**: um fake com uma `List` em memória
implementa o contrato de verdade e não quebra quando a ordem das chamadas muda.

O motor de sincronização tem meta de 95% de cobertura — os cenários obrigatórios
estão listados em [offline-sync.md](offline-sync.md#casos-que-a-implementação-precisa-tratar).

## Decisões ainda em aberto

Registradas para não serem supostas de novo:

- Geração de modelos (`freezed`, só `json_serializable`, ou à mão)
- Pacote de armazenamento seguro
