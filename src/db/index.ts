import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

export const createPool = () => {
  const host = process.env.SQL_HOST;
  const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER;
  const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD;
  const database = process.env.SQL_DB_NAME;

  console.log("Initializing PostgreSQL Pool with host:", host ? "present" : "undefined", "user:", user ? "present" : "undefined");
  return new Pool({
    host,
    user,
    password,
    database,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 10000, // Close idle clients after 10 seconds to prevent stale idle connections
    max: 20,                  // Allow more concurrent connections
    keepAlive: true,          // Enable TCP keep-alive
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
