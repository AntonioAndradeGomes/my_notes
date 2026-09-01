// Preset para o frontend Next.js.
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import globals from 'globals';

import base from './base.js';

export default [
  ...base,

  // Regras de React, hooks e acessibilidade do próprio Next.
  ...nextVitals,
  ...nextTs,

  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  {
    files: ['**/*.tsx'],
    rules: {
      // Componentes de servidor são async por natureza e frequentemente não
      // aguardam nada além do que já retornam.
      '@typescript-eslint/require-await': 'off',
    },
  },
];
