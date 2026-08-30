// Preset para o frontend Next.js.
// O plugin `eslint-config-next` (regras de React, hooks e acessibilidade) entra
// na Fase 2, junto com a aplicação web — ver docs/roadmap.md.
import globals from 'globals';

import base from './base.js';

export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
];
