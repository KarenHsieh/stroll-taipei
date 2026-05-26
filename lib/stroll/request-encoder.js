export function encodeStrollRequest(state) {
  const params = new URLSearchParams();
  params.set("area", state.area ?? "");
  params.set("start", String(state.start ?? ""));
  params.set("duration", String(state.duration ?? ""));
  params.set("moods", (state.moods ?? []).join(","));
  return params;
}

export function decodeStrollRequest(searchParams) {
  const get = (key) =>
    typeof searchParams?.get === "function" ? searchParams.get(key) : searchParams?.[key];

  const areaRaw = get("area");
  const startRaw = get("start");
  const durationRaw = get("duration");
  const moodsRaw = get("moods");

  const area = areaRaw && areaRaw.length > 0 ? areaRaw : null;
  const startNum = Number(startRaw);
  const start = startRaw !== null && startRaw !== undefined && startRaw !== "" && !Number.isNaN(startNum) ? startNum : null;
  const durationNum = Number(durationRaw);
  const duration = durationRaw !== null && durationRaw !== undefined && durationRaw !== "" && !Number.isNaN(durationNum) ? durationNum : null;
  const moods = moodsRaw && moodsRaw.length > 0 ? moodsRaw.split(",").filter((m) => m.length > 0) : [];

  const valid =
    area !== null &&
    start !== null &&
    duration !== null &&
    moods.length > 0;

  return { valid, area, start, duration, moods };
}
