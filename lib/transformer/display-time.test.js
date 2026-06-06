import { toDisplayTime } from "./display-time.js";

function at(hour, minute) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`2026-05-17T${hh}:${mm}:00+08:00`);
}

describe("toDisplayTime — minute boundary cases", () => {
  const cases = [
    [14, 0, "下午 2 點"],
    [14, 14, "約下午 2 點"],
    [14, 15, "約下午 2 點半"],
    [14, 23, "約下午 2 點半"],
    [14, 29, "約下午 2 點半"],
    [14, 30, "下午 2 點半"],
    [14, 31, "約下午 2 點半"],
    [14, 44, "約下午 2 點半"],
    [14, 45, "約下午 3 點"],
    [14, 59, "約下午 3 點"],
  ];

  it.each(cases)("h=%d m=%d → %s", (h, m, expected) => {
    expect(toDisplayTime(at(h, m), "Asia/Taipei")).toBe(expected);
  });
});

describe("toDisplayTime — period prefix per hour", () => {
  const cases = [
    [9, "上午 9 點"],
    [11, "上午 11 點"],
    [12, "中午 12 點"],
    [14, "下午 2 點"],
    [22, "下午 10 點"],
  ];

  it.each(cases)("hour %d → %s", (h, expected) => {
    expect(toDisplayTime(at(h, 0), "Asia/Taipei")).toBe(expected);
  });
});

describe("toDisplayTime — hour 0 boundary", () => {
  it("renders midnight as 凌晨 12 點 without crashing", () => {
    expect(toDisplayTime(at(0, 0), "Asia/Taipei")).toBe("凌晨 12 點");
  });
});

describe("toDisplayTime — interprets the input instant as the supplied timeZone wall-clock regardless of process TZ", () => {
  it("UTC instant 05:00 in Asia/Taipei (Thursday 13:00) renders as 下午 1 點", () => {
    const taipeiThursdayAfternoon = new Date("2026-05-28T05:00:00Z");
    expect(toDisplayTime(taipeiThursdayAfternoon, "Asia/Taipei")).toBe(
      "下午 1 點"
    );
  });

  it("the same UTC instant in Asia/Tokyo (Thursday 14:00) renders as 下午 2 點", () => {
    const sameInstant = new Date("2026-05-28T05:00:00Z");
    expect(toDisplayTime(sameInstant, "Asia/Tokyo")).toBe("下午 2 點");
  });

  it("UTC instant 16:05 in Asia/Taipei (Friday 00:05) renders as 約凌晨 12 點", () => {
    const taipeiFridayJustAfterMidnight = new Date("2026-05-28T16:05:00Z");
    expect(toDisplayTime(taipeiFridayJustAfterMidnight, "Asia/Taipei")).toBe(
      "約凌晨 12 點"
    );
  });
});

describe("toDisplayTime — surface errors instead of silently falling back", () => {
  it("throws when timeZone argument is omitted", () => {
    expect(() => toDisplayTime(new Date("2026-05-28T05:00:00Z"))).toThrow();
  });
});
