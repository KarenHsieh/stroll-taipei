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
let updateAttractionImpl;

jest.mock("@/lib/dev-tools/attractions-file.js", () => {
  const actual = jest.requireActual("@/lib/dev-tools/attractions-file.js");
  return {
    ...actual,
    get ATTRACTIONS_PATH() {
      return tempPath;
    },
    readAttractions: (p = tempPath) => actual.readAttractions(p),
    updateAttraction: (id, attr, p = tempPath) => {
      if (updateAttractionImpl) return updateAttractionImpl(id, attr, p);
      return actual.updateAttraction(id, attr, p);
    },
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

const updatedAttraction = {
  ...baseFixture[0],
  name: "鹿戈咖啡店",
};

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

beforeEach(() => {
  tempDir = mkdtempSync(path.join(tmpdir(), "put-route-test-"));
  tempPath = path.join(tempDir, "attractions.json");
  writeFileSync(tempPath, JSON.stringify(baseFixture, null, 2) + "\n", "utf8");
  mockNotFound.mockClear();
  updateAttractionImpl = null;
  process.env.NODE_ENV = "development";
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

async function callPut(idInUrl, bodyOrRaw) {
  const { PUT } = await import("./route.js");
  const isRaw = typeof bodyOrRaw === "string";
  const req = new Request(
    `http://localhost/api/dev-tools/attractions/${idInUrl}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: isRaw ? bodyOrRaw : JSON.stringify(bodyOrRaw),
    }
  );
  return PUT(req, { params: Promise.resolve({ id: idInUrl }) });
}

describe("PUT /api/dev-tools/attractions/[id]", () => {
  it("returns 200 and replaces the entry in place on a valid update", async () => {
    const res = await callPut("dadaocheng_lu-guo-coffee", updatedAttraction);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.attraction).toEqual(updatedAttraction);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toHaveLength(1);
    expect(onDisk[0]).toEqual(updatedAttraction);
    expect(onDisk[0].id).toBe("dadaocheng_lu-guo-coffee");
  });

  it("triggers notFound when NODE_ENV is not 'development'", async () => {
    process.env.NODE_ENV = "production";
    await expect(
      callPut("dadaocheng_lu-guo-coffee", updatedAttraction)
    ).rejects.toThrow("__NOT_FOUND__");
    expect(mockNotFound).toHaveBeenCalledTimes(1);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toEqual(baseFixture);
  });

  it("returns 400 when body is not valid JSON", async () => {
    const res = await callPut("dadaocheng_lu-guo-coffee", "this is not json{");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors).toEqual(["request body: 不是合法 JSON"]);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toEqual(baseFixture);
  });

  it("returns 400 when body.id does not match the URL id", async () => {
    const mismatched = { ...updatedAttraction, id: "ximen_something-else" };
    const res = await callPut("dadaocheng_lu-guo-coffee", mismatched);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors).toEqual(["body.id 必須與 URL 上的 id 一致"]);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toEqual(baseFixture);
  });

  it("returns 400 with validator errors when schema validation fails", async () => {
    const bad = { ...updatedAttraction, stay_range: [3, 50] };
    const res = await callPut("dadaocheng_lu-guo-coffee", bad);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(Array.isArray(json.errors)).toBe(true);
    expect(json.errors.some((e) => /stay_range/i.test(e))).toBe(true);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toEqual(baseFixture);
  });

  it("returns 404 when no entry with the given id exists", async () => {
    const payload = {
      ...updatedAttraction,
      id: "dadaocheng_does-not-exist",
    };
    const res = await callPut("dadaocheng_does-not-exist", payload);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.errors).toEqual([
      'id "dadaocheng_does-not-exist" 不存在',
    ]);

    const onDisk = JSON.parse(readFileSync(tempPath, "utf8"));
    expect(onDisk).toEqual(baseFixture);
  });

  it("returns 500 when the file helper throws a non-NotFound error", async () => {
    updateAttractionImpl = () => {
      throw new Error("disk full");
    };
    const res = await callPut("dadaocheng_lu-guo-coffee", updatedAttraction);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0]).toMatch(/寫入 attractions.json 失敗/);
    expect(json.errors[0]).toMatch(/disk full/);
  });

});
