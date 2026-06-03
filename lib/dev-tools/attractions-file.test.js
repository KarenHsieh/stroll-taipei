import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  readAttractions,
  appendAttraction,
  IdAlreadyExistsError,
} from "./attractions-file.js";

const baseFixture = [
  {
    id: "dadaocheng_lu-guo-coffee",
    name: "爐鍋咖啡",
    edition_id: "taipei",
    area_id: "dadaocheng",
    area: "大稻埕",
    tags: ["咖啡廳"],
    stay_range: [60, 90],
    avg_cost: 250,
    indoor: true,
    lat: 25.0567,
    lng: 121.5101,
    open_hours: [{ day: "mon", open: "11:00", close: "20:00" }],
    rating: 4.3,
    best_time_window: ["afternoon"],
  },
];

const newAttraction = {
  id: "tenjin_test-shop",
  name: "Test Shop",
  edition_id: "fukuoka",
  area_id: "tenjin",
  area: "天神",
  tags: ["熱鬧"],
  stay_range: [20, 40],
  avg_cost: 500,
  indoor: true,
  lat: 33.59,
  lng: 130.4,
  open_hours: [{ day: "mon", open: "10:00", close: "20:00" }],
  rating: 4,
  best_time_window: ["afternoon"],
};

let tempDir;
let tempPath;

beforeEach(() => {
  tempDir = mkdtempSync(path.join(tmpdir(), "attractions-file-test-"));
  tempPath = path.join(tempDir, "attractions.json");
  writeFileSync(tempPath, JSON.stringify(baseFixture, null, 2), "utf8");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("readAttractions", () => {
  it("returns the parsed array from the given JSON file", () => {
    const result = readAttractions(tempPath);
    expect(result).toEqual(baseFixture);
  });
});

describe("appendAttraction", () => {
  it("appends the new entry to the end of the array on disk", () => {
    appendAttraction(newAttraction, tempPath);
    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toHaveLength(2);
    expect(onDisk[0]).toEqual(baseFixture[0]);
    expect(onDisk[1]).toEqual(newAttraction);
  });

  it("preserves the order and content of existing entries", () => {
    const before = readAttractions(tempPath);
    appendAttraction(newAttraction, tempPath);
    const after = readAttractions(tempPath);
    expect(after.slice(0, before.length)).toEqual(before);
  });

  it("throws IdAlreadyExistsError when an entry with the same id already exists", () => {
    const collide = { ...newAttraction, id: "dadaocheng_lu-guo-coffee" };
    expect(() => appendAttraction(collide, tempPath)).toThrow(
      IdAlreadyExistsError
    );
  });

  it("does NOT modify the file when id collides", () => {
    const collide = { ...newAttraction, id: "dadaocheng_lu-guo-coffee" };
    const before = readFileSync(tempPath, "utf8");
    expect(() => appendAttraction(collide, tempPath)).toThrow();
    const after = readFileSync(tempPath, "utf8");
    expect(after).toBe(before);
  });
});
