import { toDisplayTime } from "./display-time.js";

export function formatEndTime(date, timeZone) {
  return `預計${toDisplayTime(date, timeZone)}結束`;
}
