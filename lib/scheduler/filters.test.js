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
});
