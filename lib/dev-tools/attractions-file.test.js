import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  readAttractions,
  appendAttraction,
  updateAttraction,
  IdAlreadyExistsError,
  IdNotFoundError,
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
  id: "tenjin-nakasu_test-shop",
  name: "Test Shop",
  edition_id: "fukuoka",
  area_id: "tenjin-nakasu",
  area: "天神・中洲",
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

describe("updateAttraction", () => {
  const secondEntry = {
    id: "ximen_some-shop",
    name: "西門商店",
    edition_id: "taipei",
    area_id: "ximen",
    area: "西門",
    tags: ["熱鬧"],
    stay_range: [30, 60],
    avg_cost: 200,
    indoor: false,
    lat: 25.0421,
    lng: 121.5083,
    open_hours: [{ day: "mon", open: "10:00", close: "22:00" }],
    rating: 4.0,
    best_time_window: ["evening"],
  };
  const thirdEntry = {
    id: "tenjin-nakasu_test-shop",
    name: "Test Shop",
    edition_id: "fukuoka",
    area_id: "tenjin-nakasu",
    area: "天神・中洲",
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

  function seedThreeEntries() {
    writeFileSync(
      tempPath,
      JSON.stringify([baseFixture[0], secondEntry, thirdEntry], null, 2),
      "utf8"
    );
  }

  it("replaces the existing entry in place when id matches", () => {
    seedThreeEntries();
    const updated = {
      ...secondEntry,
      name: "西門商店(改名)",
      avg_cost: 250,
    };
    updateAttraction("ximen_some-shop", updated, tempPath);
    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toHaveLength(3);
    expect(onDisk[1]).toEqual(updated);
  });

  it("preserves the order and content of entries not being updated", () => {
    seedThreeEntries();
    const updated = {
      ...secondEntry,
      name: "西門商店(改名)",
    };
    updateAttraction("ximen_some-shop", updated, tempPath);
    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk[0]).toEqual(baseFixture[0]);
    expect(onDisk[2]).toEqual(thirdEntry);
    expect(onDisk[1].id).toBe("ximen_some-shop");
  });

  it("throws IdNotFoundError when no entry with the given id exists", () => {
    seedThreeEntries();
    const updated = {
      ...thirdEntry,
      id: "no-such-id",
    };
    expect(() => updateAttraction("no-such-id", updated, tempPath)).toThrow(
      IdNotFoundError
    );
  });

  it("does NOT modify the file when id is not found", () => {
    seedThreeEntries();
    const before = readFileSync(tempPath, "utf8");
    const updated = { ...thirdEntry, id: "no-such-id" };
    expect(() => updateAttraction("no-such-id", updated, tempPath)).toThrow();
    const after = readFileSync(tempPath, "utf8");
    expect(after).toBe(before);
  });
});
