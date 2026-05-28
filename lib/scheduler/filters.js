import {
  getTaipeiHour,
  getTaipeiMinute,
  getTaipeiDayKey,
} from "../time/taipei-clock.js";

export function filterByArea(pool, area) {
  return pool.filter((a) => a.area === area);
}

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function taipeiTimeOfDayMinutes(date) {
  return getTaipeiHour(date) * 60 + getTaipeiMinute(date);
}

export function filterByHardConstraints(pool, { startAt, durationMinutes }) {
  const dayKey = getTaipeiDayKey(startAt);
  const startTod = taipeiTimeOfDayMinutes(startAt);
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
