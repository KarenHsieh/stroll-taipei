import { readFileSync } from "node:fs";
import path from "node:path";
import { validateAttraction, validateAttractionList } from "./validator.js";

function makeValid(overrides = {}) {
  return {
    id: "dadaocheng_lu-guo-coffee",
    name: "爐鍋咖啡",
    edition_id: "taipei",
    area_id: "dadaocheng",
    area: "大稻埕",
    tags: ["咖啡廳", "老屋", "巷弄"],
    stay_range: [60, 90],
    avg_cost: 250,
    indoor: true,
    lat: 25.0567,
    lng: 121.5101,
    open_hours: [{ day: "mon", open: "11:00", close: "20:00" }],
    rating: 4.4,
    best_time_window: ["morning", "afternoon"],
    ...overrides,
  };
}

function expectErrorMatch(result, fragment) {
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.includes(fragment))).toBe(true);
}

describe("validateAttraction — positive", () => {
  it("accepts a fully valid attraction", () => {
    const result = validateAttraction(makeValid());
    expect(result).toEqual({ valid: true, errors: [] });
  });
});

describe("validateAttraction — field-level violations", () => {
  it.each([
    ["missing id", { id: undefined }, "id: required"],
    ["empty name", { name: "" }, "name: required"],
    ["empty tags array", { tags: [] }, "tags: must have at least one entry"],
    ["stay_range wrong length", { stay_range: [60] }, "stay_range: must be [min, max]"],
    ["stay_range min > max", { stay_range: [120, 60] }, "stay_range: min must not exceed max"],
    ["stay_range min < 5", { stay_range: [2, 30] }, "stay_range: min must be >= 5 minutes"],
    ["negative avg_cost", { avg_cost: -50 }, "avg_cost: must be >= 0"],
    ["lat outside Taipei", { lat: 30.0 }, "falls outside edition 'taipei' bounding boxes"],
    ["lng outside Taipei", { lng: 100.0 }, "falls outside edition 'taipei' bounding boxes"],
    ["rating > 5", { rating: 5.5 }, "rating: must be between 0 and 5"],
    [
      "best_time_window contains midnight",
      { best_time_window: ["midnight"] },
      "best_time_window[0]: must be one of morning|afternoon|evening",
    ],
    ["indoor not boolean", { indoor: "yes" }, "indoor: required boolean"],
  ])("rejects %s", (_, override, expectedFragment) => {
    const result = validateAttraction(makeValid(override));
    expectErrorMatch(result, expectedFragment);
  });
});

describe("validateAttraction — tag pool", () => {
  it("accepts tags entirely within the pool", () => {
    const result = validateAttraction(makeValid({ tags: ["咖啡廳", "老屋"] }));
    expect(result.valid).toBe(true);
  });

  it("rejects a tag outside the pool with field path and value", () => {
    const result = validateAttraction(makeValid({ tags: ["咖啡廳", "火鍋"] }));
    expectErrorMatch(result, "tags[1]: '火鍋' is not in edition 'taipei' tag pool");
  });
});

describe("validateAttraction — edition + area + per-edition tag pool", () => {
  it("accepts a taipei attraction using a taipei-extra tag (市場)", () => {
    const result = validateAttraction(makeValid({ tags: ["市場", "生活感"] }));
    expect(result.valid).toBe(true);
  });

  it("rejects a taipei attraction tagged with a non-taipei tag (橫丁)", () => {
    const result = validateAttraction(makeValid({ tags: ["橫丁"] }));
    expectErrorMatch(result, "'橫丁' is not in edition 'taipei' tag pool");
  });

  it("rejects an attraction with an unknown edition_id", () => {
    const result = validateAttraction(makeValid({ edition_id: "atlantis" }));
    expectErrorMatch(result, "edition_id: 'atlantis' is not a known edition");
  });

  it("rejects an attraction whose area_id does not exist in its edition", () => {
    const result = validateAttraction(makeValid({ area_id: "hakata" }));
    expectErrorMatch(
      result,
      "area_id: 'hakata' is not a known area in edition 'taipei'"
    );
  });

  it("rejects an attraction with edition_id=taipei but coordinates in Fukuoka", () => {
    const result = validateAttraction(
      makeValid({ lat: 33.5904, lng: 130.4017 })
    );
    expectErrorMatch(result, "falls outside edition 'taipei' bounding boxes");
  });
});

describe("validateAttraction — open_hours", () => {
  it("rejects an invalid day name", () => {
    const result = validateAttraction(
      makeValid({ open_hours: [{ day: "monday", open: "09:00", close: "18:00" }] })
    );
    expectErrorMatch(result, "open_hours[0].day: must be one of mon|tue|wed|thu|fri|sat|sun");
  });

  it("rejects close earlier than open on the same day", () => {
    const result = validateAttraction(
      makeValid({ open_hours: [{ day: "mon", open: "18:00", close: "09:00" }] })
    );
    expectErrorMatch(result, "open_hours[0]: close must be later than open");
  });

  it("allows an empty open_hours array", () => {
    const result = validateAttraction(makeValid({ open_hours: [] }));
    expect(result.valid).toBe(true);
  });

  it("allows split shifts on the same day (lunch break)", () => {
    const result = validateAttraction(
      makeValid({
        open_hours: [
          { day: "mon", open: "08:00", close: "12:00" },
          { day: "mon", open: "14:00", close: "20:00" },
        ],
      })
    );
    expect(result.valid).toBe(true);
  });
});

describe("validateAttraction — id format", () => {
  it.each([
    ["uppercase letters", "Dadaocheng_LuGuoCoffee"],
    ["chinese characters", "大稻埕_爐鍋"],
    ["missing underscore separator", "dadaochenglu-guo-coffee"],
  ])("rejects id with %s", (_, badId) => {
    const result = validateAttraction(makeValid({ id: badId }));
    expectErrorMatch(result, "id: must match area-prefixed kebab-case");
  });

  it("accepts a well-formed id", () => {
    const result = validateAttraction(makeValid({ id: "dadaocheng_lu-guo-coffee" }));
    expect(result.valid).toBe(true);
  });
});

describe("validator robustness — never throws on bad input", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["string", "not an attraction"],
    ["number", 123],
  ])("validateAttraction(%s) returns structured failure without throwing", (_, input) => {
    let result;
    expect(() => {
      result = validateAttraction(input);
    }).not.toThrow();
    expect(result.valid).toBe(false);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it.each([
    ["null", null],
    ["string", "not an array"],
  ])("validateAttractionList(%s) returns structured failure without throwing", (_, input) => {
    let result;
    expect(() => {
      result = validateAttractionList(input);
    }).not.toThrow();
    expect(result.valid).toBe(false);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("validator collects multiple errors and prefixes list errors with [index N]", () => {
  it("reports id, tags, and rating in a single call when all three are bad", () => {
    const result = validateAttraction(
      makeValid({ id: undefined, tags: [], rating: 7 })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.startsWith("id:"))).toBe(true);
    expect(result.errors.some((e) => e.startsWith("tags:"))).toBe(true);
    expect(result.errors.some((e) => e.startsWith("rating:"))).toBe(true);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("prefixes list errors with the offending index", () => {
    const list = [makeValid(), makeValid(), makeValid({ tags: ["火鍋"] })];
    const result = validateAttractionList(list);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.startsWith("[index 2]") && e.includes("'火鍋'"))
    ).toBe(true);
  });
});

describe("seed dataset integration", () => {
  it("data/attractions.json loads, has at least 10 entries, and validates clean", () => {
    const seedPath = path.resolve(process.cwd(), "data/attractions.json");
    const seed = JSON.parse(readFileSync(seedPath, "utf8"));
    expect(seed.length).toBeGreaterThanOrEqual(10);
    const result = validateAttractionList(seed);
    expect(result).toEqual({ valid: true, errors: [] });
  });
});
