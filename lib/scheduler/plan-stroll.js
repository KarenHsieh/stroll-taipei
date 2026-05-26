import { filterByArea, filterByHardConstraints } from "./filters.js";
import { pickNextStop } from "./picker.js";
import { estimateWalkingMinutes } from "./walking-time.js";

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function planStroll({ area, startAt, durationMinutes, moods }, attractionsPool) {
  const byArea = filterByArea(attractionsPool, area);
  const eligible = filterByHardConstraints(byArea, { startAt, durationMinutes });

  const stops = [];
  const visited = new Set();
  let currentTime = startAt;
  let previousStop = null;
  let remainingMinutes = durationMinutes;

  while (true) {
    const candidates = eligible.filter((a) => !visited.has(a.id));
    if (candidates.length === 0) break;

    const next = pickNextStop(
      candidates,
      { previousStop, currentTime, selectedMoods: moods },
      remainingMinutes
    );
    if (next === null) break;

    const walkInMinutes = previousStop
      ? estimateWalkingMinutes(
          { lat: previousStop.lat, lng: previousStop.lng },
          { lat: next.lat, lng: next.lng }
        )
      : 0;
    const stayMinutes = next.stay_range[0];
    const arriveAt = addMinutes(currentTime, walkInMinutes);
    const leaveAt = addMinutes(arriveAt, stayMinutes);

    stops.push({
      attraction: next,
      arriveAt,
      leaveAt,
      stayMinutes,
      walkInMinutes,
      isOpenEnded: false,
    });
    visited.add(next.id);
    previousStop = next;
    currentTime = leaveAt;
    remainingMinutes -= walkInMinutes + stayMinutes;
  }

  if (stops.length > 0) {
    stops[stops.length - 1].isOpenEnded = true;
  }

  return { stops };
}
