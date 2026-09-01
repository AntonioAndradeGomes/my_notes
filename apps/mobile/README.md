# mynotes_app — Aplicativo Flutter

Uma base de código para **cinco plataformas**: iOS, Android, macOS, Windows e
Linux. Desktop é alvo de primeira classe, não um mobile esticado.

Foco em **offline-first**: escrever uma nota sem rede é o caso normal, não a
exceção.

| Item | Valor |
| --- | --- |
| SDK | Flutter 3.41 (Dart 3) |
| Arquitetura | MVVM por módulo — [ADR-0012](../../docs/adr/0012-mobile-mvvm-get-it-commands.md) |
| Injeção de dependências | `get_it`, com `initModule` por módulo |
| Navegação | `go_router` |
| Estado | `ChangeNotifier` + `ListenableBuilder` / `ValueListenableBuilder` |
| Assíncrono na UI | Padrão **Command** |
| Erros | `result_dart` (`ResultDart<S, AppFailure>`) |
| HTTP | `dio` |
| Banco local | `drift` (SQLite) |
| Modelos | `freezed` + `json_serializable` |

## Estrutura prevista

```text
lib/
├── core/
│   ├── ds/                          # design system: tokens, temas, widgets base
│   ├── i18n/
│   ├── services/
│   │   ├── api_service.dart         # dio, interceptors, refresh de token
│   │   └── storage_service.dart
│   └── utils/
│       ├── command.dart             # Command0, Command1
│       └── result.dart
├── modules/
│   └── <modulo>/
│       ├── models/
│       ├── services/
│       ├── repositories/
│       ├── viewmodels/
│       ├── views/
│       └── <modulo>_module.dart     # initModule(getIt)
├── routing/
├── main_module.dart                 # setupDependencies()
└── main.dart
```

Módulos previstos: `auth`, `notes`, `tags`, `settings`.

## Regras que a revisão cobra

- View fala com ViewModel. Só. Nunca com repositório nem com rede.
- ViewModel fala com repositório. Nunca com service.
- Repositório é a **fonte de verdade** de um tipo de dado — o único lugar que o muta.
- Service não guarda estado.
- Dependência entra por **construtor**; `getIt` só aparece no `initModule` e nas rotas.
- Ação assíncrona disparada pela UI vira `Command`, não `Future` solta.
- Erro esperado volta como `Result`, não como exceção — e se consome com `fold`,
  não com `getOrNull`.

## Comandos previstos

```bash
cd apps/mobile
flutter pub get
flutter run -d macos    --dart-define=API_URL=http://localhost:3333/api/v1
flutter run -d android  --dart-define=API_URL=http://10.0.2.2:3333/api/v1
flutter test
flutter analyze
```

> `10.0.2.2` é como o emulador Android enxerga o `localhost` da máquina host. No
> simulador iOS e nos desktops, use `http://localhost:3333`.

## Leitura relacionada

- Arquitetura: [docs/architecture/mobile.md](../../docs/architecture/mobile.md)
- Sincronização: [docs/architecture/offline-sync.md](../../docs/architecture/offline-sync.md)
- [ADR-0012](../../docs/adr/0012-mobile-mvvm-get-it-commands.md) — a stack e o que foi descartado

## Estado

Aplicativo ainda não implementado — Fase 3 do [roadmap](../../docs/roadmap.md).

Uma escolha segue **em aberto**, registrada como tal na ADR-0012: o pacote de
armazenamento seguro dos tokens.
