import { drizzle } from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import * as schema from './schema';

// local_experiment
const pool = new Pool({
  host: 'localhost',
  port: 5432, 
  user: 'postgres',
  password: '1234',
  database: 'postgres',
});

// const pool = new Pool({
//   host: 'perplexica-postgres',
//   port: 5432, 
//   user: 'postgres',
//   password: '1234',
//   database: 'postgres',
// });


pool.on('connect', () => {
  console.log('데이터베이스에 연결되었습니다.');
});

const db = drizzle(pool, {
  schema: schema,
});

export default db;
