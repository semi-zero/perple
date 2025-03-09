import { defineConfig } from 'drizzle-kit';

// local_experiment
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: 'postgresql://postgres:1234@localhost:5432/postgres',
  },
});

// export default defineConfig({
//   dialect: 'postgresql',
//   schema: './src/db/schema.ts',
//   out: './drizzle',
//   dbCredentials: {
//     url: 'postgresql://postgres:1234@perplexica-postgres:5432/postgres',
//   },
// });
