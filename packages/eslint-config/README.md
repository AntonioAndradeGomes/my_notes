# @mynotes/eslint-config

Flat config do ESLint 9 compartilhada. Três presets:

| Preset   | Import                          | Usado por    |
| -------- | ------------------------------- | ------------ |
| `base`   | `@mynotes/eslint-config`        | `packages/*` |
| `nestjs` | `@mynotes/eslint-config/nestjs` | `apps/api`   |
| `nextjs` | `@mynotes/eslint-config/nextjs` | `apps/web`   |

Uso em `eslint.config.js` do pacote consumidor:

```js
import config from '@mynotes/eslint-config/nestjs';
export default config;
```

As regras e o raciocínio por trás delas estão em
[docs/guides/coding-standards.md](../../docs/guides/coding-standards.md).
Este pacote será implementado na Fase 1 — ver [docs/roadmap.md](../../docs/roadmap.md).
