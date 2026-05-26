import { estimateWalkingMinutes } from "./walking-time.js";
import { scoreAttraction } from "./scoring.js";
import { MAX_WALK_MINUTES } from "./score-weights.js";

const DAY_INDEX_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function timeOfDayMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function fitsOpenHours(attraction, arriveAt, leaveAt) {
  const dayKey = DAY_INDEX_TO_KEY[arriveAt.getDay()];
  const arriveTod = timeOfDayMinutes(arriveAt);
  const leaveTod = timeOfDayMinutes(leaveAt);
  return attraction.open_hours.some((slot) => {
    if (slot.day !== dayKey) return false;
    return hhmmToMinutes(slot.open) <= arriveTod && hhmmToMinutes(slot.close) >= leaveTod;
  });
}

export function pickNextStop(candidates, { previousStop, currentTime, selectedMoods }, remainingMinutes) {
  let best = null;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const walkInMinutes = previousStop
      ? estimateWalkingMinutes(
          { lat: previousStop.lat, lng: previousStop.lng },
          { lat: candidate.lat, lng: candidate.lng }
        )
      : 0;

    if (walkInMinutes > MAX_WALK_MINUTES) continue;

    const stayMinutes = candidate.stay_range[0];
    if (walkInMinutes + stayMinutes > remainingMinutes) continue;

    const arriveAt = addMinutes(currentTime, walkInMinutes);
    const leaveAt = addMinutes(arriveAt, stayMinutes);
    if (!fitsOpenHours(candidate, arriveAt, leaveAt)) continue;

    const score = scoreAttraction(candidate, { selectedMoods, walkInMinutes });
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}
