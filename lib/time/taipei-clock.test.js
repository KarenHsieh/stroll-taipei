import {
  getTaipeiHour,
  getTaipeiMinute,
  getTaipeiDayKey,
} from "./taipei-clock.js";

describe("taipei-clock — helpers return Asia/Taipei wall-clock values regardless of process TZ", () => {
  const cases = [
    {
      label: "Taipei 凌晨 (Wed 02:00) from UTC instant 18:00 previous day",
      instant: "2026-05-26T18:00:00Z",
      hour: 2,
      minute: 0,
      dayKey: "wed",
    },
    {
      label: "Taipei 白天 (Thu 13:00) from UTC instant 05:00 same day",
      instant: "2026-05-28T05:00:00Z",
      hour: 13,
      minute: 0,
      dayKey: "thu",
    },
    {
      label: "Taipei 深夜 (Thu 23:30) from UTC instant 15:30 same day",
      instant: "2026-05-28T15:30:00Z",
      hour: 23,
      minute: 30,
      dayKey: "thu",
    },
    {
      label: "Cross-UTC-day boundary, Taipei same day (Fri 23:00) from UTC Fri 15:00",
      instant: "2026-05-29T15:00:00Z",
      hour: 23,
      minute: 0,
      dayKey: "fri",
    },
  ];

  it.each(cases)("$label", ({ instant, hour, minute, dayKey }) => {
    const date = new Date(instant);
    expect(getTaipeiHour(date)).toBe(hour);
    expect(getTaipeiMinute(date)).toBe(minute);
    expect(getTaipeiDayKey(date)).toBe(dayKey);
  });
});
