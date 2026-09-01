// Configuração do Prisma CLI (v7+). A URL de conexão saiu do schema.prisma e
// passou a viver aqui — ver https://pris.ly/d/config-datasource.
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// O .env fica na raiz do monorepo, compartilhado com a aplicação web.
config({ path: '../../.env' });

const databaseUrl = process.env['DATABASE_URL'];

// A datasource só é declarada quando há URL. `prisma generate` não toca o banco:
// exigir a variável aqui acoplaria a geração de código — e portanto o lint, o
// typecheck e o build — a uma conexão que ele não usa. Comandos que de fato
// precisam dela (`migrate`) falham com a mensagem do próprio Prisma.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
