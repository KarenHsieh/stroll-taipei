import { formatTodayOpenHours } from "./format-open-hours.js";

const SATURDAY = new Date(2026, 4, 16, 12, 0, 0, 0);
const SUNDAY = new Date(2026, 4, 17, 12, 0, 0, 0);
const MONDAY = new Date(2026, 4, 18, 12, 0, 0, 0);

describe("formatTodayOpenHours", () => {
  it("renders a single matching slot as one range", () => {
    const slots = [{ day: "sat", open: "10:00", close: "20:00" }];
    expect(formatTodayOpenHours(slots, SATURDAY, "Asia/Taipei")).toBe(
      "10:00～20:00"
    );
  });

  it("joins multiple matching slots with full-width comma", () => {
    const slots = [
      { day: "mon", open: "11:00", close: "14:00" },
      { day: "mon", open: "17:00", close: "21:00" },
    ];
    expect(formatTodayOpenHours(slots, MONDAY, "Asia/Taipei")).toBe(
      "11:00～14:00、17:00～21:00"
    );
  });

  it("returns 今日公休 when no slot matches today", () => {
    const slots = [{ day: "tue", open: "11:00", close: "19:00" }];
    expect(formatTodayOpenHours(slots, MONDAY, "Asia/Taipei")).toBe("今日公休");
  });

  it("ignores slots for other days", () => {
    const slots = [
      { day: "sun", open: "10:00", close: "20:00" },
      { day: "mon", open: "11:00", close: "19:00" },
    ];
    expect(formatTodayOpenHours(slots, SUNDAY, "Asia/Taipei")).toBe(
      "10:00～20:00"
    );
  });

  it("uses the supplied timeZone day-of-week even when the UTC day differs (Asia/Taipei)", () => {
    const taipeiSaturday0030 = new Date("2026-05-29T16:30:00Z");
    const slots = [
      { day: "fri", open: "22:00", close: "23:30" },
      { day: "sat", open: "00:00", close: "02:00" },
    ];
    expect(
      formatTodayOpenHours(slots, taipeiSaturday0030, "Asia/Taipei")
    ).toBe("00:00～02:00");
  });

  it("uses the supplied timeZone day-of-week (Asia/Tokyo on the same UTC instant)", () => {
    // UTC 2026-05-29T14:30:00Z is Friday 23:30 in Asia/Tokyo (same day as UTC)
    // and Friday 22:30 in Asia/Taipei. Use a slot that exists only on `fri` to
    // confirm both timeZones pick the same day key here.
    const utcInstant = new Date("2026-05-29T14:30:00Z");
    const slots = [
      { day: "fri", open: "22:00", close: "23:59" },
      { day: "sat", open: "00:00", close: "02:00" },
    ];
    expect(formatTodayOpenHours(slots, utcInstant, "Asia/Tokyo")).toBe(
      "22:00～23:59"
    );
  });

  it("uses the supplied timeZone day-of-week (Asia/Tokyo crossing into Saturday before Asia/Taipei does)", () => {
    // UTC 2026-05-29T15:30:00Z is Saturday 00:30 in Asia/Tokyo (+9)
    // but Friday 23:30 in Asia/Taipei (+8). The same instant selects different
    // day-of-week slots based on the supplied timeZone.
    const utcInstant = new Date("2026-05-29T15:30:00Z");
    const slots = [
      { day: "fri", open: "22:00", close: "23:59" },
      { day: "sat", open: "00:00", close: "02:00" },
    ];
    expect(formatTodayOpenHours(slots, utcInstant, "Asia/Taipei")).toBe(
      "22:00～23:59"
    );
    expect(formatTodayOpenHours(slots, utcInstant, "Asia/Tokyo")).toBe(
      "00:00～02:00"
    );
  });

  it("throws when timeZone argument is omitted", () => {
    const slots = [{ day: "sat", open: "10:00", close: "20:00" }];
    expect(() => formatTodayOpenHours(slots, SATURDAY)).toThrow();
  });
});
