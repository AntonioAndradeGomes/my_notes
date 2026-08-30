// Configuração base compartilhada (ESLint 10, flat config).
// Regras comuns a todo código TypeScript do monorepo.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '**/*.d.ts',
      // Código gerado (Prisma Client, clientes de API) não é revisado nem lintado.
      '**/generated/**',
    ],
  },

  js.configs.recommended,

  // Regras que exigem informação de tipo. São mais lentas, e são justamente as
  // que pegam os bugs que importam: Promise não aguardada, comparação impossível,
  // condição sempre verdadeira.
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        // Descobre o tsconfig de cada arquivo sozinho — sem listar projetos à mão.
        projectService: true,
      },
    },

    rules: {
      // `any` desliga o compilador exatamente onde ele mais serviria.
      // Ver docs/guides/coding-standards.md.
      '@typescript-eslint/no-explicit-any': 'error',

      // Promise não aguardada é a causa nº 1 de erro que some sem rastro.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',

      // Variável não usada é resto de refactor. O prefixo _ marca o descarte
      // intencional (ex.: parâmetro exigido por assinatura).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Testes e seus arquivos de apoio: asserções e dublês legitimamente lidam com
  // tipos frouxos, e um dublê que implementa uma porta assíncrona não precisa
  // de `await` internamente.
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.e2e-spec.ts',
      'test/**/*.ts',
      '**/__tests__/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // Todo JavaScript neste monorepo é configuração ou preset — o código real é
  // TypeScript. Esses arquivos não pertencem a nenhum tsconfig, então as regras
  // que exigem informação de tipo não têm como rodar sobre eles.
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Precisa ser o último: desliga tudo que conflita com o Prettier.
  prettier,
);
