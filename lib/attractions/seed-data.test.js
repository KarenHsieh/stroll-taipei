import { readFileSync } from "node:fs";
import path from "node:path";
import { validateAttractionList } from "./validator.js";
import { AREAS } from "../stroll/areas.js";

const attractions = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "data/attractions.json"), "utf8")
);

describe("attractions.json seed data", () => {
  it("contains at least 26 entries (after seed-more-areas)", () => {
    expect(attractions.length).toBeGreaterThanOrEqual(26);
  });

  it("every entry passes the validator", () => {
    const result = validateAttractionList(attractions);
    if (!result.valid) {
      console.error("Validation errors:\n" + result.errors.join("\n"));
    }
    expect(result.valid).toBe(true);
  });

  it("every active area has at least 3 attractions (so timeline can render meaningfully)", () => {
    const activeAreas = AREAS.filter((a) => a.active).map((a) => a.name);
    for (const areaName of activeAreas) {
      const count = attractions.filter((a) => a.area === areaName).length;
      expect({ area: areaName, count }).toEqual({
        area: areaName,
        count: expect.any(Number),
      });
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  it("attraction ids are unique across the whole list", () => {
    const ids = attractions.map((a) => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
