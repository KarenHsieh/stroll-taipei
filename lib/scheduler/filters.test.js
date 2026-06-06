import { readFileSync } from "node:fs";
import path from "node:path";
import { filterByArea, filterByHardConstraints } from "./filters.js";

const SEED = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "data/attractions.json"), "utf8")
);

describe("filterByArea", () => {
  it("returns all 大稻埕 attractions when filtering on 大稻埕", () => {
    const result = filterByArea(SEED, "大稻埕");
    expect(result.length).toBeGreaterThanOrEqual(10);
    expect(result.every((a) => a.area === "大稻埕")).toBe(true);
  });

  it("returns empty when no attraction matches the requested area", () => {
    const result = filterByArea(SEED, "信義");
    expect(result).toEqual([]);
  });

  it("does not throw when pool is frozen", () => {
    const frozen = Object.freeze([...SEED]);
    expect(() => filterByArea(frozen, "大稻埕")).not.toThrow();
  });
});

describe("filterByHardConstraints", () => {
  const SATURDAY_14_TO_18 = {
    startAt: new Date("2026-05-16T14:00:00+08:00"),
    durationMinutes: 240,
    timeZone: "Asia/Taipei",
  };

  it("includes an attraction whose Saturday open_hours overlap the window", () => {
    const luGuo = SEED.find((a) => a.id === "dadaocheng_lu-guo-coffee");
    const result = filterByHardConstraints([luGuo], SATURDAY_14_TO_18);
    expect(result).toHaveLength(1);
  });

  it("excludes an attraction with no Saturday entry (林華泰茶行 has only mon-sat? — use fabricated case)", () => {
    const closedOnSat = {
      ...SEED[0],
      id: "fake_no-sat",
      open_hours: [
        { day: "mon", open: "09:00", close: "18:00" },
        { day: "fri", open: "09:00", close: "18:00" },
      ],
    };
    const result = filterByHardConstraints([closedOnSat], SATURDAY_14_TO_18);
    expect(result).toEqual([]);
  });

  it("excludes attractions with open_hours: []", () => {
    const noHours = { ...SEED[0], id: "fake_no-hours", open_hours: [] };
    const result = filterByHardConstraints([noHours], SATURDAY_14_TO_18);
    expect(result).toEqual([]);
  });

  it("excludes a Saturday entry that closes before the window starts", () => {
    const morningOnly = {
      ...SEED[0],
      id: "fake_morning-only",
      open_hours: [{ day: "sat", open: "06:00", close: "12:00" }],
    };
    const result = filterByHardConstraints([morningOnly], SATURDAY_14_TO_18);
    expect(result).toEqual([]);
  });

  describe("interprets startAt as wall-clock in the supplied timeZone regardless of process TZ", () => {
    it("Thursday 13:00 Taipei window includes an attraction open Thu 09:00-17:00", () => {
      const thursdayAfternoonInTaipei = {
        startAt: new Date("2026-05-28T05:00:00Z"),
        durationMinutes: 180,
        timeZone: "Asia/Taipei",
      };
      const openThu9to17 = {
        ...SEED[0],
        id: "fake_thu-9-17",
        open_hours: [{ day: "thu", open: "09:00", close: "17:00" }],
      };
      const result = filterByHardConstraints(
        [openThu9to17],
        thursdayAfternoonInTaipei
      );
      expect(result).toHaveLength(1);
    });

    it("Friday 23:00 Taipei window (UTC Fri 15:00) includes an attraction open Fri 22:00-23:30", () => {
      const fridayLateInTaipei = {
        startAt: new Date("2026-05-29T15:00:00Z"),
        durationMinutes: 60,
        timeZone: "Asia/Taipei",
      };
      const openFri22to2330 = {
        ...SEED[0],
        id: "fake_fri-22-2330",
        open_hours: [{ day: "fri", open: "22:00", close: "23:30" }],
      };
      const result = filterByHardConstraints(
        [openFri22to2330],
        fridayLateInTaipei
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("yields different results when timeZone differs by one hour", () => {
    // The same UTC instant 2026-06-06T05:00:00Z is Saturday 13:00 in Asia/Taipei
    // and Saturday 14:00 in Asia/Tokyo. With a 60-minute window, filterByHardConstraints
    // uses an open-end-exclusive overlap (open < windowEnd && close > windowStart):
    //   - "early" Sat 12:00–14:00 fits Taipei 13:00–14:00 (close=14:00 > 13:00) but
    //     NOT Tokyo 14:00–15:00 (close=14:00 > 14:00 is false).
    //   - "late"  Sat 14:00–15:00 fits Tokyo 14:00–15:00 (open=14:00 < 15:00) but
    //     NOT Taipei 13:00–14:00 (open=14:00 < 14:00 is false).
    const early = {
      id: "fake_sat-1200-1400",
      area: "大稻埕",
      open_hours: [{ day: "sat", open: "12:00", close: "14:00" }],
    };
    const late = {
      id: "fake_sat-1400-1500",
      area: "大稻埕",
      open_hours: [{ day: "sat", open: "14:00", close: "15:00" }],
    };
    const pool = [early, late];

    it("Asia/Taipei window 13:00–14:00 keeps the 12:00–14:00 attraction only", () => {
      const result = filterByHardConstraints(pool, {
        startAt: new Date("2026-06-06T05:00:00Z"),
        durationMinutes: 60,
        timeZone: "Asia/Taipei",
      });
      expect(result.map((a) => a.id)).toEqual(["fake_sat-1200-1400"]);
    });

    it("Asia/Tokyo window 14:00–15:00 keeps the 14:00–15:00 attraction only", () => {
      const result = filterByHardConstraints(pool, {
        startAt: new Date("2026-06-06T05:00:00Z"),
        durationMinutes: 60,
        timeZone: "Asia/Tokyo",
      });
      expect(result.map((a) => a.id)).toEqual(["fake_sat-1400-1500"]);
    });
  });
});
