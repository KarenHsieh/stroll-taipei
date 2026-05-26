import { formatTodayOpenHours } from "./format-open-hours.js";

const SATURDAY = new Date(2026, 4, 16, 12, 0, 0, 0);
const SUNDAY = new Date(2026, 4, 17, 12, 0, 0, 0);
const MONDAY = new Date(2026, 4, 18, 12, 0, 0, 0);

describe("formatTodayOpenHours", () => {
  it("renders a single matching slot as one range", () => {
    const slots = [{ day: "sat", open: "10:00", close: "20:00" }];
    expect(formatTodayOpenHours(slots, SATURDAY)).toBe("10:00～20:00");
  });

  it("joins multiple matching slots with full-width comma", () => {
    const slots = [
      { day: "mon", open: "11:00", close: "14:00" },
      { day: "mon", open: "17:00", close: "21:00" },
    ];
    expect(formatTodayOpenHours(slots, MONDAY)).toBe("11:00～14:00、17:00～21:00");
  });

  it("returns 今日公休 when no slot matches today", () => {
    const slots = [{ day: "tue", open: "11:00", close: "19:00" }];
    expect(formatTodayOpenHours(slots, MONDAY)).toBe("今日公休");
  });

  it("ignores slots for other days", () => {
    const slots = [
      { day: "sun", open: "10:00", close: "20:00" },
      { day: "mon", open: "11:00", close: "19:00" },
    ];
    expect(formatTodayOpenHours(slots, SUNDAY)).toBe("10:00～20:00");
  });
});
