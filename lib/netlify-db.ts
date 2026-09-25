import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

type SqliteStatement = {
  all(...args: unknown[]): unknown[];
  get(...args: unknown[]): unknown;
  run(...args: unknown[]): { changes: number | bigint };
};
type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
};

const require = createRequire(import.meta.url);

function sqlite() {
  const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: new (path: string) => SqliteDatabase };
  return DatabaseSync;
}

const DIR = process.env.MEDIA_HUB_DATA_DIR || "/tmp/vinconnect-media-hub";
const FILE = join(DIR, "hub.sqlite");
const DB_KEY = "hub.sqlite";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  media_json TEXT,
  job_json TEXT,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  approved_by TEXT,
  published_url TEXT,
  published_at TEXT
);
CREATE TABLE IF NOT EXISTS hub_secrets (
  id TEXT PRIMARY KEY,
  ciphertext TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS social_publications (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  receipt TEXT,
  post_url TEXT,
  provider_id TEXT,
  caption TEXT,
  image_url TEXT,
  revision INTEGER,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  size INTEGER NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS brand_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export type BoundStatement = {
  sql: string;
  params: unknown[];
  bind(...args: unknown[]): BoundStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
  raw(): Promise<unknown[][]>;
};

export type ArticleDatabase = {
  prepare(sql: string): BoundStatement;
  batch(statements: BoundStatement[]): Promise<Array<{ meta: { changes: number } }>>;
};

let chain: Promise<unknown> = Promise.resolve();

async function blobStore() {
  if (process.env.MEDIA_HUB_FILE_ONLY === "1") return null;
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name: "vinconnect-media-hub", consistency: "strong" });
  } catch {
    return null;
  }
}

async function hydrate() {
  mkdirSync(DIR, { recursive: true });
  const store = await blobStore();
  if (!store) return;
  const saved = await store.get(DB_KEY, { type: "arrayBuffer" });
  if (saved) writeFileSync(FILE, Buffer.from(saved));
}

async function persist() {
  const store = await blobStore();
  if (!store || !existsSync(FILE)) return;
  const bytes = readFileSync(FILE);
  await store.set(DB_KEY, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

function openDb() {
  mkdirSync(dirname(FILE), { recursive: true });
  const db = new (sqlite())(FILE);
  db.exec(SCHEMA);
  return db;
}

async function withDb<T>(work: (db: SqliteDatabase) => T, write: boolean): Promise<T> {
  const run = chain.then(async () => {
    await hydrate();
    const db = openDb();
    try {
      const result = work(db);
      db.close();
      if (write) await persist();
      return result;
    } catch (error) {
      try { db.close(); } catch { /* already closed */ }
      throw error;
    }
  });
  chain = run.then(() => undefined, () => undefined);
  return run;
}

function changes(info: { changes: number | bigint }) {
  return Number(info.changes);
}

export function netlifyArticleDb(): ArticleDatabase {
  return {
    prepare(sql: string): BoundStatement {
      const statement = {
        sql,
        params: [] as unknown[],
        bind(...args: unknown[]) {
          statement.params = args;
          return statement;
        },
        all<T = Record<string, unknown>>() {
          return withDb((db) => ({ results: db.prepare(sql).all(...statement.params) as T[] }), false);
        },
        first<T = Record<string, unknown>>() {
          return withDb((db) => (db.prepare(sql).get(...statement.params) as T | undefined) ?? null, false);
        },
        run() {
          return withDb((db) => ({ meta: { changes: changes(db.prepare(sql).run(...statement.params)) } }), true);
        },
        raw() {
          return withDb((db) => {
            const rows = db.prepare(sql).all(...statement.params) as Record<string, unknown>[];
            return rows.map((row) => Object.values(row));
          }, false);
        },
      };
      return statement;
    },
    batch(statements: BoundStatement[]) {
      return withDb((db) => {
        db.exec("BEGIN");
        try {
          const results = statements.map((statement) => ({ meta: { changes: changes(db.prepare(statement.sql).run(...statement.params)) } }));
          db.exec("COMMIT");
          return results;
        } catch (error) {
          try { db.exec("ROLLBACK"); } catch { /* ignore */ }
          throw error;
        }
      }, true);
    },
  };
}
