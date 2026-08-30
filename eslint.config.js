// Configuração raiz do ESLint.
//
// Existe porque o lint-staged roda a partir da raiz do monorepo: sem ela, o
// hook de pre-commit falharia em qualquer arquivo fora de apps/api, que é o
// único pacote com config própria.
//
// Flat config não herda de diretórios pai, então cada preset é aplicado ao
// conjunto de caminhos que ele governa.
import base from '@mynotes/eslint-config';
import nestjs from '@mynotes/eslint-config/nestjs';

/**
 * Restringe um preset a um conjunto de caminhos.
 *
 * Blocos que já declaram `files` (como as exceções de teste) mantêm o próprio
 * escopo; blocos que só declaram `ignores` são globais por definição e não
 * podem receber `files`.
 */
function scopeTo(configs, files) {
  return configs.map((config) =>
    config.files || (config.ignores && Object.keys(config).length === 1)
      ? config
      : { ...config, files },
  );
}

export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/generated/**',
      // Dart tem ferramental próprio (dart analyze).
      'apps/mobile/**',
    ],
  },

  ...scopeTo(nestjs, ['apps/api/**/*.ts']),
  ...scopeTo(base, ['packages/**/*.{js,ts}', '*.js']),
];
