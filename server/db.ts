import { DatabaseSync } from 'node:sqlite';
import { Pool, type PoolClient } from 'pg';

export type DbRow = Record<string, unknown>;
export type DbStatement = {
  get: (...params: any[]) => Promise<DbRow | undefined>;
  all: (...params: any[]) => Promise<DbRow[]>;
  run: (...params: any[]) => Promise<{ lastInsertRowid?: number | string | bigint; changes: number | bigint }>;
};
export type AppDatabase = {
  dialect: 'sqlite' | 'postgres';
  prepare: (sql: string) => DbStatement;
  exec: (sql: string) => Promise<void>;
  transaction: <T>(callback: (database: AppDatabase) => Promise<T>) => Promise<T>;
  close: () => Promise<void>;
};

function postgresSql(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function sqliteAdapter(database: DatabaseSync): AppDatabase {
  return {
    dialect: 'sqlite',
    prepare(sql) {
      const statement = database.prepare(sql);
      return {
        get: async (...params) => statement.get(...params) as DbRow | undefined,
        all: async (...params) => statement.all(...params) as DbRow[],
        run: async (...params) => { const result = statement.run(...params); return { lastInsertRowid: result.lastInsertRowid, changes: result.changes }; }
      };
    },
    exec: async (sql) => { database.exec(sql); },
    transaction: async (callback) => { database.exec('BEGIN IMMEDIATE'); try { const result = await callback(sqliteAdapter(database)); database.exec('COMMIT'); return result; } catch (error) { database.exec('ROLLBACK'); throw error; } },
    close: async () => { database.close(); }
  };
}

function postgresAdapter(clientOrPool: Pool | PoolClient): AppDatabase {
  return {
    dialect: 'postgres',
    prepare(sql) {
      const query = postgresSql(sql);
      return {
        get: async (...params) => (await clientOrPool.query(query, params)).rows[0] as DbRow | undefined,
        all: async (...params) => (await clientOrPool.query(query, params)).rows as DbRow[],
        run: async (...params) => { const insertQuery = /^\s*INSERT\b/i.test(query) && !/\bRETURNING\b/i.test(query) ? `${query} RETURNING id` : query; const result = await clientOrPool.query(insertQuery, params); return { lastInsertRowid: result.rows[0]?.id, changes: result.rowCount || 0 }; }
      };
    },
    exec: async (sql) => { await clientOrPool.query(sql); },
    transaction: async (callback) => { if (!(clientOrPool instanceof Pool)) throw new Error('Nested PostgreSQL transactions are not supported.'); const client = await clientOrPool.connect(); const transactionDatabase = postgresAdapter(client); await client.query('BEGIN'); try { const result = await callback(transactionDatabase); await client.query('COMMIT'); return result; } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } },
    close: async () => { if ('end' in clientOrPool) await clientOrPool.end(); }
  };
}

export function adaptDatabase(database: AppDatabase | DatabaseSync): AppDatabase { return database instanceof DatabaseSync ? sqliteAdapter(database) : database; }

const SQLITE_SCHEMA = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE); CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, owner_id INTEGER NOT NULL REFERENCES users(id), updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS shares (document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY (document_id, user_id)); CREATE TABLE IF NOT EXISTS import_usage (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, import_date TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, import_date));`;
const POSTGRES_SCHEMA = `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, subscription_tier TEXT NOT NULL DEFAULT 'free'); CREATE TABLE IF NOT EXISTS documents (id SERIAL PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, owner_id INTEGER NOT NULL REFERENCES users(id), updated_at TIMESTAMPTZ NOT NULL); CREATE TABLE IF NOT EXISTS shares (document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY (document_id, user_id)); CREATE TABLE IF NOT EXISTS import_usage (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, import_date DATE NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, import_date));`;

export async function initializeDatabase(file = process.env.DB_FILE || 'papertrail.db'): Promise<AppDatabase> {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
    const database = postgresAdapter(pool);
    await database.exec(POSTGRES_SCHEMA);
    await database.exec("INSERT INTO users (id, name, email, subscription_tier) VALUES (1, 'Maya Chen', 'maya@example.com', 'free'), (2, 'Theo Brooks', 'theo@example.com', 'free') ON CONFLICT (id) DO NOTHING");
    return database;
  }
  const sqlite = new DatabaseSync(file);
  sqlite.exec('PRAGMA foreign_keys = ON');
  const database = sqliteAdapter(sqlite);
  await database.exec(SQLITE_SCHEMA);
  try { await database.exec("ALTER TABLE users ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free'"); } catch { /* column already exists */ }
  await database.exec("INSERT OR IGNORE INTO users (id, name, email, subscription_tier) VALUES (1, 'Maya Chen', 'maya@example.com', 'free'), (2, 'Theo Brooks', 'theo@example.com', 'free')");
  return database;
}
