// Preset para o backend NestJS.
import base from './base.js';

export default [
  ...base,
  {
    rules: {
      // Decorators do Nest (@Injectable, @Controller) são funções cujo retorno
      // não é usado — o padrão do TypeScript para metaprogramação.
      '@typescript-eslint/no-extraneous-class': 'off',

      // Módulos do Nest são classes vazias por definição.
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],

      // A DI do Nest injeta pelo tipo do parâmetro do construtor. `consistent-type-imports`
      // do base transformaria esses imports em `import type`, apagando a referência
      // em tempo de execução e quebrando a injeção.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
