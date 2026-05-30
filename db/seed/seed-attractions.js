#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Pool } from "pg";
import { validateAttractionList } from "../../lib/attractions/validator.js";
import { AREAS } from "../../lib/stroll/areas.js";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
const ATTRACTIONS_PATH = path.join(PROJECT_ROOT, "data", "attractions.json");
const EDITIONS_PATH = path.join(PROJECT_ROOT, "data", "editions.json");

const UPSERT_EDITION_SQL = `
  INSERT INTO editions (id, name, en, currency, bboxes, max_walk_minutes, active)
  VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    en = EXCLUDED.en,
    currency = EXCLUDED.currency,
    bboxes = EXCLUDED.bboxes,
    max_walk_minutes = EXCLUDED.max_walk_minutes,
    active = EXCLUDED.active
`;

const UPSERT_AREA_SQL = `
  INSERT INTO areas (edition_id, id, name, en, active, sort_order)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (edition_id, id) DO UPDATE SET
    name = EXCLUDED.name,
    en = EXCLUDED.en,
    active = EXCLUDED.active,
    sort_order = EXCLUDED.sort_order
`;

const UPSERT_ATTRACTION_SQL = `
  INSERT INTO attractions (
    id, name, edition_id, area_id, area, tags,
    stay_min, stay_max,
    avg_cost, indoor, lat, lng,
    open_hours, rating, best_time_window
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    edition_id = EXCLUDED.edition_id,
    area_id = EXCLUDED.area_id,
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

function toEditionValues(e) {
  return [e.id, e.name, e.en, e.currency, JSON.stringify(e.bboxes), e.maxWalkMinutes, e.active];
}

function toAreaValues(a, sortOrder) {
  return [a.editionId, a.id, a.name, a.en ?? null, a.active, sortOrder];
}

function toAttractionValues(a) {
  const [stayMin, stayMax] = a.stay_range;
  return [
    a.id,
    a.name,
    a.edition_id,
    a.area_id,
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

  const editions = JSON.parse(await readFile(EDITIONS_PATH, "utf8"));
  const attractions = JSON.parse(await readFile(ATTRACTIONS_PATH, "utf8"));

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
    for (const edition of editions) {
      await client.query(UPSERT_EDITION_SQL, toEditionValues(edition));
    }
    for (let i = 0; i < AREAS.length; i++) {
      await client.query(UPSERT_AREA_SQL, toAreaValues(AREAS[i], i));
    }
    for (const attraction of attractions) {
      await client.query(UPSERT_ATTRACTION_SQL, toAttractionValues(attraction));
    }
    await client.query("COMMIT");
    console.log(
      `seeded: ${editions.length} editions, ${AREAS.length} areas, ${attractions.length} attractions`
    );
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
