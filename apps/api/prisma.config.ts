// Configuração do Prisma CLI (v7+). A URL de conexão saiu do schema.prisma e
// passou a viver aqui — ver https://pris.ly/d/config-datasource.
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// O .env fica na raiz do monorepo, compartilhado com a aplicação web.
config({ path: '../../.env' });

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  // Falhar aqui é melhor que o Prisma receber `undefined` e produzir um erro de
  // conexão obscuro alguns passos adiante.
  throw new Error(
    'DATABASE_URL não definida. Copie o .env.example para .env na raiz do monorepo ' +
      '(ou rode `make setup`) — ver docs/guides/environment-variables.md.',
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
