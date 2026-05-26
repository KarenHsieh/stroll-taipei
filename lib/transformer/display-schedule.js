import { toDisplayTime } from "./display-time.js";
import { formatStayRange } from "./format-stay-range.js";
import { formatWalkingTime } from "./format-walking-time.js";
import { formatEndTime } from "./format-end-time.js";
import { formatCost } from "./format-cost.js";
import { formatTodayOpenHours } from "./format-open-hours.js";

export function toDisplaySchedule(internalSchedule, area, today) {
  const areaTitle = `${area}散策`;

  if (!internalSchedule.stops || internalSchedule.stops.length === 0) {
    return { areaTitle, stops: [], endText: null };
  }

  const stops = internalSchedule.stops.map((stop) => ({
    name: stop.attraction.name,
    tags: stop.attraction.tags,
    timeText: toDisplayTime(stop.arriveAt),
    stayText: formatStayRange(stop.attraction.stay_range),
    walkInText: formatWalkingTime(stop.walkInMinutes),
    isOpenEnded: stop.isOpenEnded,
    attraction: stop.attraction,
    costText: formatCost(stop.attraction.avg_cost),
    todayOpenHoursText: formatTodayOpenHours(stop.attraction.open_hours, today),
    indoor: stop.attraction.indoor,
    isPast: false,
  }));

  const lastStop = internalSchedule.stops[internalSchedule.stops.length - 1];
  const endText = formatEndTime(lastStop.leaveAt);

  return { areaTitle, stops, endText };
}
