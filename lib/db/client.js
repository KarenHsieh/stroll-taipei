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

export async function query(text, values) {
  try {
    return await getPool().query(text, values);
  } catch (err) {
    if (isConnectionError(err)) {
      throw new Error(
        `無法連到 DATABASE_URL (${redactConnectionString(process.env.DATABASE_URL)}) — 確認 Postgres 在跑(本地: docker compose up -d)。`,
        { cause: err }
      );
    }
    throw err;
  }
}

const CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

function isConnectionError(err) {
  if (!err) return false;
  if (CONNECTION_ERROR_CODES.has(err.code)) return true;
  if (Array.isArray(err.errors)) {
    return err.errors.some((e) => CONNECTION_ERROR_CODES.has(e?.code));
  }
  return false;
}

function redactConnectionString(connectionString) {
  if (!connectionString) return "unset";
  try {
    const url = new URL(connectionString);
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return "unparseable";
  }
}
