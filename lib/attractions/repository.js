import { query } from "@/lib/db/client.js";

function rowToAttraction(row) {
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    tags: row.tags,
    stay_range: [Number(row.stay_min), Number(row.stay_max)],
    avg_cost: Number(row.avg_cost),
    indoor: row.indoor,
    lat: Number(row.lat),
    lng: Number(row.lng),
    open_hours: row.open_hours,
    rating: Number(row.rating),
    best_time_window: row.best_time_window,
  };
}

export async function listAttractions(filter = {}) {
  const hasArea = typeof filter.area === "string" && filter.area.length > 0;

  const sql = hasArea
    ? "SELECT * FROM attractions WHERE area = $1 ORDER BY id"
    : "SELECT * FROM attractions ORDER BY id";
  const values = hasArea ? [filter.area] : [];

  const { rows } = await query(sql, values);
  return rows.map(rowToAttraction);
}
