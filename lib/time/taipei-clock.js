const WEEKDAY_SHORT_TO_KEY = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Taipei",
  hourCycle: "h23",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function partsOf(date) {
  const parts = formatter.formatToParts(date);
  const out = {};
  for (const p of parts) out[p.type] = p.value;
  return out;
}

export function getTaipeiHour(date) {
  return Number(partsOf(date).hour);
}

export function getTaipeiMinute(date) {
  return Number(partsOf(date).minute);
}

export function getTaipeiDayKey(date) {
  return WEEKDAY_SHORT_TO_KEY[partsOf(date).weekday];
}
