import { Pool } from "pg";

const POOL_KEY = "__strollPgPool";

export function getPool() {
  if (globalThis[POOL_KEY]) return globalThis[POOL_KEY];

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL — set it in .env (local) or via Zeabur service variables (production)."
    );
  }

  globalThis[POOL_KEY] = new Pool({ connectionString });
  return globalThis[POOL_KEY];
}

export function query(text, values) {
  return getPool().query(text, values);
}
