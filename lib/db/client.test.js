/**
 * @jest-environment node
 */
jest.mock("pg", () => {
  const Pool = jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue({ rows: [] }),
  }));
  return { __esModule: true, Pool, default: { Pool } };
});

import { Pool } from "pg";
import { getPool, query } from "./client.js";

const POOL_KEY = "__strollPgPool";
const ORIGINAL_URL = process.env.DATABASE_URL;

beforeEach(() => {
  Pool.mockClear();
  delete globalThis[POOL_KEY];
});

afterEach(() => {
  if (ORIGINAL_URL === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = ORIGINAL_URL;
  }
  delete globalThis[POOL_KEY];
});

describe("lib/db/client", () => {
  it("getPool() returns the same pg.Pool reference across calls (cached on globalThis.__strollPgPool)", () => {
    process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
    const first = getPool();
    const second = getPool();
    expect(first).toBe(second);
    expect(Pool).toHaveBeenCalledTimes(1);
    expect(globalThis[POOL_KEY]).toBe(first);
  });

  it("getPool() throws with message containing 'Missing DATABASE_URL' when env is unset", () => {
    delete process.env.DATABASE_URL;
    expect(() => getPool()).toThrow(/Missing DATABASE_URL/);
    expect(Pool).not.toHaveBeenCalled();
  });

  it("query(text, values) delegates to the underlying pool with the same args", async () => {
    process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
    const pool = getPool();
    await query("SELECT $1::int AS n", [42]);
    expect(pool.query).toHaveBeenCalledWith("SELECT $1::int AS n", [42]);
  });
});
