import attractionsData from "../../data/attractions.json" with { type: "json" };

function isWellFormedBbox(bbox) {
  if (!bbox || typeof bbox !== "object") return false;
  if (!Array.isArray(bbox.lat) || !Array.isArray(bbox.lng)) return false;
  if (bbox.lat.length !== 2 || bbox.lng.length !== 2) return false;
  const [s, n] = bbox.lat;
  const [w, e] = bbox.lng;
  if (
    typeof s !== "number" ||
    typeof n !== "number" ||
    typeof w !== "number" ||
    typeof e !== "number"
  ) {
    return false;
  }
  return s <= n && w <= e;
}

export function getAreaBoundary(area) {
  if (!area) return null;

  if (isWellFormedBbox(area.bbox)) {
    return { lat: [area.bbox.lat[0], area.bbox.lat[1]], lng: [area.bbox.lng[0], area.bbox.lng[1]] };
  }

  // Auto-fallback: derive bbox from the area's attractions. No caching — read
  // the canonical dataset every call so fixture / dev-tools edits are visible
  // immediately.
  const matched = attractionsData.filter(
    (a) => a.edition_id === area.editionId && a.area_id === area.id
  );
  if (matched.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const a of matched) {
    if (a.lat < minLat) minLat = a.lat;
    if (a.lat > maxLat) maxLat = a.lat;
    if (a.lng < minLng) minLng = a.lng;
    if (a.lng > maxLng) maxLng = a.lng;
  }
  return { lat: [minLat, maxLat], lng: [minLng, maxLng] };
}

export function isInsideAreaWithBuffer(area, lat, lng, bufferMeters = 400) {
  const boundary = getAreaBoundary(area);
  if (boundary === null) return false;

  const midLatRad = ((boundary.lat[0] + boundary.lat[1]) / 2) * (Math.PI / 180);
  const latBufferDeg = bufferMeters / 111000;
  const lngBufferDeg = bufferMeters / (111000 * Math.cos(midLatRad));

  const south = boundary.lat[0] - latBufferDeg;
  const north = boundary.lat[1] + latBufferDeg;
  const west = boundary.lng[0] - lngBufferDeg;
  const east = boundary.lng[1] + lngBufferDeg;

  return lat >= south && lat <= north && lng >= west && lng <= east;
}
