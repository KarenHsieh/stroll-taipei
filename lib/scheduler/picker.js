import { estimateWalkingMinutes } from "./walking-time.js";
import { scoreAttraction } from "./scoring.js";
import { MAX_WALK_MINUTES } from "./score-weights.js";
import {
  getLocalHour,
  getLocalMinute,
  getLocalDayKey,
} from "../time/local-clock.js";

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function localTimeOfDayMinutes(date, timeZone) {
  return getLocalHour(date, timeZone) * 60 + getLocalMinute(date, timeZone);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function fitsOpenHours(attraction, arriveAt, leaveAt, timeZone) {
  const dayKey = getLocalDayKey(arriveAt, timeZone);
  const arriveTod = localTimeOfDayMinutes(arriveAt, timeZone);
  const leaveTod = localTimeOfDayMinutes(leaveAt, timeZone);
  return attraction.open_hours.some((slot) => {
    if (slot.day !== dayKey) return false;
    return hhmmToMinutes(slot.open) <= arriveTod && hhmmToMinutes(slot.close) >= leaveTod;
  });
}

export function pickNextStop(
  candidates,
  { previousStop, currentTime, selectedMoods, selectedActivities = [], timeZone },
  remainingMinutes,
  options = {}
) {
  const maxWalkMinutes = options.maxWalkMinutes ?? MAX_WALK_MINUTES;
  let best = null;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const walkInMinutes = previousStop
      ? estimateWalkingMinutes(
          { lat: previousStop.lat, lng: previousStop.lng },
          { lat: candidate.lat, lng: candidate.lng }
        )
      : 0;

    if (walkInMinutes > maxWalkMinutes) continue;

    const stayMinutes = candidate.stay_range[0];
    if (walkInMinutes + stayMinutes > remainingMinutes) continue;

    const arriveAt = addMinutes(currentTime, walkInMinutes);
    const leaveAt = addMinutes(arriveAt, stayMinutes);
    if (!fitsOpenHours(candidate, arriveAt, leaveAt, timeZone)) continue;

    const score = scoreAttraction(candidate, {
      selectedMoods,
      selectedActivities,
      walkInMinutes,
    });
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}
