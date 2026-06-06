const WEEKDAY_SHORT_TO_KEY = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

const wallClockFormatterCache = new Map();
const calendarFormatterCache = new Map();

function requireTimeZone(timeZone) {
  if (timeZone === undefined || timeZone === null || timeZone === "") {
    throw new TypeError(
      "local-clock helpers require an IANA timeZone string (e.g. 'Asia/Taipei')"
    );
  }
}

function getWallClockFormatter(timeZone) {
  requireTimeZone(timeZone);
  let formatter = wallClockFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    wallClockFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function getCalendarFormatter(timeZone) {
  requireTimeZone(timeZone);
  let formatter = calendarFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    calendarFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function partsOf(formatter, date) {
  const parts = formatter.formatToParts(date);
  const out = {};
  for (const p of parts) out[p.type] = p.value;
  return out;
}

export function getLocalHour(date, timeZone) {
  return Number(partsOf(getWallClockFormatter(timeZone), date).hour);
}

export function getLocalMinute(date, timeZone) {
  return Number(partsOf(getWallClockFormatter(timeZone), date).minute);
}

export function getLocalDayKey(date, timeZone) {
  return WEEKDAY_SHORT_TO_KEY[
    partsOf(getWallClockFormatter(timeZone), date).weekday
  ];
}

export function todayInZone(now, timeZone) {
  const parts = partsOf(getCalendarFormatter(timeZone), now);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

export function buildDateInZone(year, month, day, hour, minute, timeZone) {
  requireTimeZone(timeZone);
  const wantUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const parts = partsOf(getCalendarFormatter(timeZone), new Date(wantUtcMs));
  const seenUtcMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  const deltaMs = wantUtcMs - seenUtcMs;
  return new Date(wantUtcMs + deltaMs);
}
