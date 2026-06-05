/**
 * @jest-environment node
 */
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const mockNotFound = jest.fn(() => {
  throw new Error("__NOT_FOUND__");
});

jest.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

let tempDir;
let tempPath;

jest.mock("@/lib/dev-tools/attractions-file.js", () => {
  const actual = jest.requireActual("@/lib/dev-tools/attractions-file.js");
  return {
    ...actual,
    get ATTRACTIONS_PATH() {
      return tempPath;
    },
    readAttractions: (p = tempPath) => actual.readAttractions(p),
    appendAttraction: (attr, p = tempPath) =>
      actual.appendAttraction(attr, p),
  };
});

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
    open_hours: [
      { day: "mon", open: "11:00", close: "20:00" },
      { day: "tue", open: "11:00", close: "20:00" },
      { day: "wed", open: "11:00", close: "20:00" },
      { day: "thu", open: "11:00", close: "20:00" },
      { day: "fri", open: "11:00", close: "20:00" },
      { day: "sat", open: "11:00", close: "20:00" },
      { day: "sun", open: "11:00", close: "20:00" },
    ],
    rating: 4.3,
    best_time_window: ["afternoon"],
  },
];

const validNewAttraction = {
  id: "tenjin-nakasu_route-test-shop",
  name: "Route Test Shop",
  edition_id: "fukuoka",
  area_id: "tenjin-nakasu",
  area: "天神・中洲",
  tags: ["熱鬧"],
  stay_range: [20, 40],
  avg_cost: 500,
  indoor: true,
  lat: 33.59,
  lng: 130.4,
  open_hours: [
    { day: "mon", open: "10:00", close: "20:00" },
    { day: "tue", open: "10:00", close: "20:00" },
    { day: "wed", open: "10:00", close: "20:00" },
    { day: "thu", open: "10:00", close: "20:00" },
    { day: "fri", open: "10:00", close: "20:00" },
    { day: "sat", open: "10:00", close: "20:00" },
    { day: "sun", open: "10:00", close: "20:00" },
  ],
  rating: 4.2,
  best_time_window: ["afternoon"],
};

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

beforeEach(() => {
  tempDir = mkdtempSync(path.join(tmpdir(), "route-test-"));
  tempPath = path.join(tempDir, "attractions.json");
  writeFileSync(tempPath, JSON.stringify(baseFixture, null, 2) + "\n", "utf8");
  mockNotFound.mockClear();
  process.env.NODE_ENV = "development";
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

async function callPost(body) {
  const { POST } = await import("./route.js");
  const req = new Request("http://localhost/api/dev-tools/attractions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/dev-tools/attractions", () => {
  it("returns 201 and appends to the JSON file on a valid attraction", async () => {
    const res = await callPost(validNewAttraction);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.attraction).toEqual(validNewAttraction);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toHaveLength(2);
    expect(onDisk[1]).toEqual(validNewAttraction);
  });

  it("returns 400 with validator errors when stay_range is invalid", async () => {
    const bad = { ...validNewAttraction, id: "tenjin-nakasu_bad-stay", stay_range: [3, 50] };
    const res = await callPost(bad);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(Array.isArray(json.errors)).toBe(true);
    expect(json.errors.some((e) => /stay_range/i.test(e))).toBe(true);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toEqual(baseFixture);
  });

  it("returns 409 when the id collides with an existing entry", async () => {
    const collide = {
      ...validNewAttraction,
      id: "dadaocheng_lu-guo-coffee",
      edition_id: "taipei",
      area_id: "dadaocheng",
      area: "大稻埕",
      tags: ["咖啡廳"],
      lat: 25.0567,
      lng: 121.5101,
    };
    const res = await callPost(collide);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.errors[0]).toMatch(/dadaocheng_lu-guo-coffee/);
    expect(json.errors[0]).toMatch(/已存在/);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toEqual(baseFixture);
  });

  it("triggers notFound when NODE_ENV is not 'development'", async () => {
    process.env.NODE_ENV = "production";
    await expect(callPost(validNewAttraction)).rejects.toThrow("__NOT_FOUND__");
    expect(mockNotFound).toHaveBeenCalledTimes(1);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toEqual(baseFixture);
  });
});
