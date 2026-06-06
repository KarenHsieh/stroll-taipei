import {
  getLocalHour,
  getLocalMinute,
  getLocalDayKey,
  buildDateInZone,
  todayInZone,
} from "./local-clock.js";

describe("local-clock — helpers derive wall-clock fields in the caller-provided timeZone", () => {
  describe("getLocalHour / getLocalMinute / getLocalDayKey", () => {
    const cases = [
      {
        label: "Asia/Taipei: Sat 13:00 from UTC 05:00",
        instant: "2026-06-06T05:00:00Z",
        timeZone: "Asia/Taipei",
        hour: 13,
        minute: 0,
        dayKey: "sat",
      },
      {
        label: "Asia/Tokyo: same UTC instant is Sat 14:00",
        instant: "2026-06-06T05:00:00Z",
        timeZone: "Asia/Tokyo",
        hour: 14,
        minute: 0,
        dayKey: "sat",
      },
      {
        label: "Asia/Taipei: Wed 02:00 from UTC 18:00 previous day",
        instant: "2026-05-26T18:00:00Z",
        timeZone: "Asia/Taipei",
        hour: 2,
        minute: 0,
        dayKey: "wed",
      },
      {
        label: "Asia/Taipei: Thu 23:30 from UTC 15:30 same day",
        instant: "2026-05-28T15:30:00Z",
        timeZone: "Asia/Taipei",
        hour: 23,
        minute: 30,
        dayKey: "thu",
      },
      {
        label: "Asia/Taipei: Fri 23:00 from UTC Fri 15:00 (cross-UTC-day)",
        instant: "2026-05-29T15:00:00Z",
        timeZone: "Asia/Taipei",
        hour: 23,
        minute: 0,
        dayKey: "fri",
      },
      {
        label: "Asia/Tokyo: Sat 00:30 from UTC Fri 15:30 (cross-UTC-day)",
        instant: "2026-05-29T15:30:00Z",
        timeZone: "Asia/Tokyo",
        hour: 0,
        minute: 30,
        dayKey: "sat",
      },
    ];

    it.each(cases)("$label", ({ instant, timeZone, hour, minute, dayKey }) => {
      const date = new Date(instant);
      expect(getLocalHour(date, timeZone)).toBe(hour);
      expect(getLocalMinute(date, timeZone)).toBe(minute);
      expect(getLocalDayKey(date, timeZone)).toBe(dayKey);
    });

    it("throws if timeZone is omitted from getLocalHour", () => {
      expect(() => getLocalHour(new Date("2026-06-06T05:00:00Z"))).toThrow();
    });

    it("throws if timeZone is omitted from getLocalMinute", () => {
      expect(() => getLocalMinute(new Date("2026-06-06T05:00:00Z"))).toThrow();
    });

    it("throws if timeZone is omitted from getLocalDayKey", () => {
      expect(() => getLocalDayKey(new Date("2026-06-06T05:00:00Z"))).toThrow();
    });

    it("throws on an invalid IANA timeZone string", () => {
      expect(() =>
        getLocalHour(new Date("2026-06-06T05:00:00Z"), "Not/A/Zone")
      ).toThrow();
    });
  });

  describe("buildDateInZone — composes the UTC instant matching the given local wall time", () => {
    it("Asia/Tokyo 14:00 on 2026-06-06 corresponds to UTC 05:00 same day", () => {
      const d = buildDateInZone(2026, 6, 6, 14, 0, "Asia/Tokyo");
      expect(d.toISOString()).toBe("2026-06-06T05:00:00.000Z");
    });

    it("Asia/Taipei 14:00 on 2026-06-06 corresponds to UTC 06:00 same day", () => {
      const d = buildDateInZone(2026, 6, 6, 14, 0, "Asia/Taipei");
      expect(d.toISOString()).toBe("2026-06-06T06:00:00.000Z");
    });

    it("Asia/Tokyo 00:30 on 2026-06-06 crosses the UTC day boundary to 2026-06-05 15:30", () => {
      const d = buildDateInZone(2026, 6, 6, 0, 30, "Asia/Tokyo");
      expect(d.toISOString()).toBe("2026-06-05T15:30:00.000Z");
    });

    it("Asia/Taipei 23:30 on 2026-05-28 corresponds to UTC 15:30 same day", () => {
      const d = buildDateInZone(2026, 5, 28, 23, 30, "Asia/Taipei");
      expect(d.toISOString()).toBe("2026-05-28T15:30:00.000Z");
    });

    it("round-trips with getLocalHour/getLocalMinute/getLocalDayKey under the same timeZone", () => {
      const d = buildDateInZone(2026, 6, 6, 14, 0, "Asia/Tokyo");
      expect(getLocalHour(d, "Asia/Tokyo")).toBe(14);
      expect(getLocalMinute(d, "Asia/Tokyo")).toBe(0);
      expect(getLocalDayKey(d, "Asia/Tokyo")).toBe("sat");
    });

    it("throws if timeZone is omitted", () => {
      expect(() => buildDateInZone(2026, 6, 6, 14, 0)).toThrow();
    });

    it("throws on an invalid IANA timeZone string", () => {
      expect(() => buildDateInZone(2026, 6, 6, 14, 0, "Not/A/Zone")).toThrow();
    });
  });

  describe("todayInZone — gives the calendar date of `now` in the supplied timeZone", () => {
    it("Asia/Tokyo on UTC 2026-06-05T15:30:00Z is 2026-06-06", () => {
      expect(
        todayInZone(new Date("2026-06-05T15:30:00Z"), "Asia/Tokyo")
      ).toEqual({ year: 2026, month: 6, day: 6 });
    });

    it("Asia/Taipei on UTC 2026-06-05T15:30:00Z is 2026-06-05 (still same UTC day for Taipei +8)", () => {
      expect(
        todayInZone(new Date("2026-06-05T15:30:00Z"), "Asia/Taipei")
      ).toEqual({ year: 2026, month: 6, day: 5 });
    });

    it("Asia/Taipei on UTC 2026-06-05T16:30:00Z is 2026-06-06 (crosses Taipei midnight)", () => {
      expect(
        todayInZone(new Date("2026-06-05T16:30:00Z"), "Asia/Taipei")
      ).toEqual({ year: 2026, month: 6, day: 6 });
    });

    it("throws if timeZone is omitted", () => {
      expect(() => todayInZone(new Date("2026-06-06T05:00:00Z"))).toThrow();
    });
  });
});
