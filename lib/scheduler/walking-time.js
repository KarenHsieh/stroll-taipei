export const DETOUR_FACTOR = 1.3;
export const WALKING_SPEED_M_PER_MIN = 80;
const EARTH_RADIUS_M = 6371000;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function haversine(a, b) {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

export function estimateWalkingMinutes(a, b) {
  const meters = haversine(a, b);
  return Math.ceil((meters * DETOUR_FACTOR) / WALKING_SPEED_M_PER_MIN);
}
