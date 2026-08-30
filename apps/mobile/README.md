# mynotes_mobile — Aplicativo Flutter

App Android e iOS do MyNotes, com foco em **offline-first**: escrever uma nota
sem rede é o caso normal, não a exceção.

| Item            | Valor                                              |
| --------------- | -------------------------------------------------- |
| SDK             | Flutter 3.41 (Dart 3)                              |
| Estado          | Riverpod                                           |
| Navegação       | go_router                                          |
| Banco local     | Drift (SQLite)                                     |
| HTTP            | Dio + cliente gerado a partir do OpenAPI           |
| Modelos         | freezed + json_serializable                        |
| Armazenamento seguro | flutter_secure_storage (Keychain / Keystore) |

## Estrutura prevista

```text
lib/
├── main.dart
├── app/                     # bootstrap, tema, rotas, injeção
├── core/
│   ├── network/             # Dio, interceptors, refresh automático de token
│   ├── storage/             # Drift, secure storage
│   ├── sync/                # motor de sincronização e fila de operações
│   └── error/
└── features/
    ├── auth/
    ├── notes/
    ├── notebooks/
    └── settings/
        ├── data/            # datasources local e remoto, repositório
        ├── domain/          # entidades e casos de uso
        └── presentation/    # telas, widgets, providers
```

Cada feature segue a mesma divisão `data / domain / presentation`.

## Sincronização

O motor de sync é a parte mais delicada do app. A estratégia — fila de operações,
delta sync por cursor, resolução de conflito e limites conhecidos — está descrita
em [docs/architecture/offline-sync.md](../../docs/architecture/offline-sync.md).
Leia antes de mexer em qualquer coisa sob `core/sync/`.

## Comandos previstos

```bash
cd apps/mobile
flutter pub get
dart run build_runner watch -d      # gera freezed / drift / json
flutter run --dart-define=API_URL=http://10.0.2.2:3333/api/v1
flutter test
flutter analyze
```

> `10.0.2.2` é como o emulador Android enxerga o `localhost` da máquina host.
> No simulador iOS, use `http://localhost:3333`.

## Leitura relacionada

- Arquitetura: [docs/architecture/mobile.md](../../docs/architecture/mobile.md)
- [ADR-0006](../../docs/adr/0006-mobile-flutter-riverpod.md)

> Aplicativo ainda não implementado. Fase 3 do [roadmap](../../docs/roadmap.md).
