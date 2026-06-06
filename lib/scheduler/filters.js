import {
  getLocalHour,
  getLocalMinute,
  getLocalDayKey,
} from "../time/local-clock.js";

export function filterByArea(pool, area) {
  return pool.filter((a) => a.area === area);
}

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function localTimeOfDayMinutes(date, timeZone) {
  return getLocalHour(date, timeZone) * 60 + getLocalMinute(date, timeZone);
}

export function filterByHardConstraints(pool, { startAt, durationMinutes, timeZone }) {
  const dayKey = getLocalDayKey(startAt, timeZone);
  const startTod = localTimeOfDayMinutes(startAt, timeZone);
  const endTod = startTod + durationMinutes;

  return pool.filter((attraction) => {
    if (!Array.isArray(attraction.open_hours) || attraction.open_hours.length === 0) {
      return false;
    }
    const sameDay = attraction.open_hours.filter((slot) => slot.day === dayKey);
    if (sameDay.length === 0) return false;
    return sameDay.some((slot) => {
      const openTod = hhmmToMinutes(slot.open);
      const closeTod = hhmmToMinutes(slot.close);
      return openTod < endTod && closeTod > startTod;
    });
  });
}
