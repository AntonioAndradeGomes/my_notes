import { z } from 'zod';

/**
 * Mensagens padrão do Zod em português.
 *
 * Sem isto a API responde em duas línguas: as mensagens escritas nos schemas
 * saem em português, e as que o Zod gera sozinho — campo obrigatório, tipo
 * errado — saem em inglês. Num produto pt-BR isso vaza para o usuário final
 * assim que um formulário destaca o erro de um campo.
 *
 * O `message` é texto para humanos; quem programa contra o erro usa o `code`.
 * Ver docs/api/errors.md.
 */
export function installPortugueseErrorMap(): void {
  z.config({
    customError: (issue) => {
      switch (issue.code) {
        case 'invalid_type':
          return issue.input === undefined
            ? 'Campo obrigatório'
            : `Tipo inválido: esperado ${translateType(String(issue.expected))}`;

        case 'too_small':
          return issue.origin === 'string'
            ? `Precisa de ao menos ${String(issue.minimum)} caractere(s)`
            : `Valor mínimo: ${String(issue.minimum)}`;

        case 'too_big':
          return issue.origin === 'string'
            ? `Excede o máximo de ${String(issue.maximum)} caractere(s)`
            : `Valor máximo: ${String(issue.maximum)}`;

        case 'invalid_format':
          return 'Formato inválido';

        case 'invalid_value':
          return 'Valor não permitido';

        case 'unrecognized_keys':
          return 'Campo não reconhecido';

        default:
          return undefined; // deixa o Zod decidir
      }
    },
  });
}

const TYPES: Record<string, string> = {
  string: 'texto',
  number: 'número',
  boolean: 'booleano',
  object: 'objeto',
  array: 'lista',
};

function translateType(expected: string): string {
  return TYPES[expected] ?? expected;
}
