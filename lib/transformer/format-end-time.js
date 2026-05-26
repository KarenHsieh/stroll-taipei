import { toDisplayTime } from "./display-time.js";

export function formatEndTime(date) {
  return `預計${toDisplayTime(date)}結束`;
}
