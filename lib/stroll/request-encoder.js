import attractionsData from "../../data/attractions.json" with { type: "json" };

// Build a Set of known attraction ids once at module-load. Used by
// decodeStrollRequest to silently drop unknown ids in the URL `stops` param
// (anti-tamper filter). Module-level cache is safe because the JSON file is
// imported as a const at build time.
const KNOWN_ATTRACTION_IDS = new Set(attractionsData.map((a) => a.id));

export function encodeStrollRequest(state) {
  const params = new URLSearchParams();
  params.set("area", state.area ?? "");
  params.set("start", String(state.start ?? ""));
  params.set("duration", String(state.duration ?? ""));
  params.set("moods", (state.moods ?? []).join(","));
  // activities is optional — only emit when at least one is selected, to keep URLs clean
  if (state.activities && state.activities.length > 0) {
    params.set("activities", state.activities.join(","));
  }
  // stops is optional — only emit when at least one id is present, mirroring
  // the activities convention. Empty array → omit, decoder returns [].
  if (Array.isArray(state.stops) && state.stops.length > 0) {
    params.set("stops", state.stops.join(","));
  }
  return params;
}

export function decodeStrollRequest(searchParams) {
  const get = (key) =>
    typeof searchParams?.get === "function" ? searchParams.get(key) : searchParams?.[key];

  const areaRaw = get("area");
  const startRaw = get("start");
  const durationRaw = get("duration");
  const moodsRaw = get("moods");
  const activitiesRaw = get("activities");
  const stopsRaw = get("stops");

  const area = areaRaw && areaRaw.length > 0 ? areaRaw : null;
  const startNum = Number(startRaw);
  const start = startRaw !== null && startRaw !== undefined && startRaw !== "" && !Number.isNaN(startNum) ? startNum : null;
  const durationNum = Number(durationRaw);
  const duration = durationRaw !== null && durationRaw !== undefined && durationRaw !== "" && !Number.isNaN(durationNum) ? durationNum : null;
  const moods = moodsRaw && moodsRaw.length > 0 ? moodsRaw.split(",").filter((m) => m.length > 0) : [];
  const activities =
    activitiesRaw && activitiesRaw.length > 0
      ? activitiesRaw.split(",").filter((a) => a.length > 0)
      : [];
  // Anti-tamper: drop any id absent from the dataset. Duplicates of known ids
  // are preserved (caller may have legitimate reasons to revisit).
  const stops =
    stopsRaw && stopsRaw.length > 0
      ? stopsRaw
          .split(",")
          .filter((s) => s.length > 0)
          .filter((id) => KNOWN_ATTRACTION_IDS.has(id))
      : [];

  const valid =
    area !== null &&
    start !== null &&
    duration !== null &&
    moods.length > 0;

  return { valid, area, start, duration, moods, activities, stops };
}
