import { estimateWalkingMinutes } from "./walking-time.js";
import { scoreAttraction } from "./scoring.js";
import { MAX_WALK_MINUTES } from "./score-weights.js";
import {
  getTaipeiHour,
  getTaipeiMinute,
  getTaipeiDayKey,
} from "../time/taipei-clock.js";

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function taipeiTimeOfDayMinutes(date) {
  return getTaipeiHour(date) * 60 + getTaipeiMinute(date);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function fitsOpenHours(attraction, arriveAt, leaveAt) {
  const dayKey = getTaipeiDayKey(arriveAt);
  const arriveTod = taipeiTimeOfDayMinutes(arriveAt);
  const leaveTod = taipeiTimeOfDayMinutes(leaveAt);
  return attraction.open_hours.some((slot) => {
    if (slot.day !== dayKey) return false;
    return hhmmToMinutes(slot.open) <= arriveTod && hhmmToMinutes(slot.close) >= leaveTod;
  });
}

export function pickNextStop(
  candidates,
  { previousStop, currentTime, selectedMoods, selectedActivities = [] },
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
    if (!fitsOpenHours(candidate, arriveAt, leaveAt)) continue;

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
