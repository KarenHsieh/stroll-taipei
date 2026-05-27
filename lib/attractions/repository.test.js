/**
 * @jest-environment node
 */
jest.mock("@/lib/db/client.js", () => ({
  __esModule: true,
  query: jest.fn(),
}));

import { query } from "@/lib/db/client.js";
import { listAttractions } from "./repository.js";

const dadaochengRow = {
  id: "dadaocheng_lu-guo-coffee",
  name: "爐鍋咖啡",
  area: "大稻埕",
  tags: ["咖啡廳", "老屋", "巷弄"],
  stay_min: 60,
  stay_max: 90,
  avg_cost: 250,
  indoor: true,
  lat: "25.05670",
  lng: "121.51010",
  open_hours: [{ day: "mon", open: "11:00", close: "20:00" }],
  rating: "4.5",
  best_time_window: ["afternoon", "evening"],
};

beforeEach(() => {
  query.mockReset();
});

describe("listAttractions", () => {
  it("listAttractions({}) selects all rows ordered by id and returns the canonical attraction shape", async () => {
    query.mockResolvedValueOnce({ rows: [dadaochengRow] });

    const result = await listAttractions({});

    const [sql, values] = query.mock.calls[0];
    expect(sql).toMatch(/SELECT \* FROM attractions/i);
    expect(sql).toMatch(/ORDER BY id/i);
    expect(sql).not.toMatch(/WHERE/i);
    expect(values).toEqual([]);

    expect(result).toEqual([
      {
        id: "dadaocheng_lu-guo-coffee",
        name: "爐鍋咖啡",
        area: "大稻埕",
        tags: ["咖啡廳", "老屋", "巷弄"],
        stay_range: [60, 90],
        avg_cost: 250,
        indoor: true,
        lat: 25.0567,
        lng: 121.5101,
        open_hours: [{ day: "mon", open: "11:00", close: "20:00" }],
        rating: 4.5,
        best_time_window: ["afternoon", "evening"],
      },
    ]);
  });

  it("listAttractions({ area }) uses a parameterised WHERE area = $1 (no string interpolation)", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await listAttractions({ area: "大稻埕" });

    const [sql, values] = query.mock.calls[0];
    expect(sql).toMatch(/WHERE area = \$1/i);
    expect(values).toEqual(["大稻埕"]);
    // ensure the area value never gets inlined into the SQL string
    expect(sql).not.toContain("大稻埕");
  });

  it("returns [] without throwing when there are no matching rows", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const result = await listAttractions({ area: "不存在的區" });
    expect(result).toEqual([]);
  });

  it("does not mutate the caller-supplied filter object", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const filter = { area: "大稻埕" };
    await listAttractions(filter);
    expect(filter).toEqual({ area: "大稻埕" });
  });

  it("an empty-string area is treated as no filter (full table scan)", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    await listAttractions({ area: "" });
    const [sql] = query.mock.calls[0];
    expect(sql).not.toMatch(/WHERE/i);
  });
});
