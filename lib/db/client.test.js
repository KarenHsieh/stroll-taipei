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

  it("query() wraps ECONNREFUSED into a readable message with the redacted connection string and keeps the original as cause", async () => {
    process.env.DATABASE_URL = "postgres://test:secret@localhost:5432/test";
    const pool = getPool();
    const original = Object.assign(new Error("connect ECONNREFUSED ::1:5432"), {
      code: "ECONNREFUSED",
    });
    pool.query.mockRejectedValueOnce(original);
    const caught = await query("SELECT 1").catch((e) => e);
    expect(caught.message).toMatch(/無法連到 DATABASE_URL/);
    expect(caught.message).toMatch(/postgres:\/\/test:\*\*\*@localhost:5432\/test/);
    expect(caught.cause).toBe(original);
  });

  it("query() unwraps AggregateError whose inner errors are ECONNREFUSED", async () => {
    process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
    const pool = getPool();
    const inner = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:5432"), {
      code: "ECONNREFUSED",
    });
    const aggregate = new AggregateError([inner], "All attempts failed");
    pool.query.mockRejectedValueOnce(aggregate);
    await expect(query("SELECT 1")).rejects.toThrow(/無法連到 DATABASE_URL/);
  });

  it("query() passes through non-connection errors unchanged", async () => {
    process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
    const pool = getPool();
    const syntaxErr = Object.assign(new Error('syntax error at or near "FOO"'), {
      code: "42601",
    });
    pool.query.mockRejectedValueOnce(syntaxErr);
    await expect(query("FOO")).rejects.toBe(syntaxErr);
  });
});
