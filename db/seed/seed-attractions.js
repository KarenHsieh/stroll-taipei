#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Pool } from "pg";
import { validateAttractionList } from "../../lib/attractions/validator.js";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
const JSON_PATH = path.join(PROJECT_ROOT, "data", "attractions.json");

const UPSERT_SQL = `
  INSERT INTO attractions (
    id, name, area, tags,
    stay_min, stay_max,
    avg_cost, indoor, lat, lng,
    open_hours, rating, best_time_window
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    area = EXCLUDED.area,
    tags = EXCLUDED.tags,
    stay_min = EXCLUDED.stay_min,
    stay_max = EXCLUDED.stay_max,
    avg_cost = EXCLUDED.avg_cost,
    indoor = EXCLUDED.indoor,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    open_hours = EXCLUDED.open_hours,
    rating = EXCLUDED.rating,
    best_time_window = EXCLUDED.best_time_window
`;

function toUpsertValues(a) {
  const [stayMin, stayMax] = a.stay_range;
  return [
    a.id,
    a.name,
    a.area,
    a.tags,
    stayMin,
    stayMax,
    a.avg_cost,
    a.indoor,
    a.lat,
    a.lng,
    JSON.stringify(a.open_hours),
    a.rating,
    a.best_time_window,
  ];
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const raw = await readFile(JSON_PATH, "utf8");
  const attractions = JSON.parse(raw);

  const validation = validateAttractionList(attractions);
  if (!validation.valid) {
    console.error("Seed aborted — data/attractions.json failed validation:");
    for (const err of validation.errors) console.error(`  ${err}`);
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const attraction of attractions) {
      await client.query(UPSERT_SQL, toUpsertValues(attraction));
    }
    await client.query("COMMIT");
    console.log(`seeded: ${attractions.length} rows`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});
