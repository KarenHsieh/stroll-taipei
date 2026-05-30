import { getTagPool, getAllTagPools } from "./index.js";

describe("tag pool — base + per-edition extras", () => {
  describe("getTagPool('taipei')", () => {
    let pool;
    beforeAll(() => {
      pool = getTagPool("taipei");
    });

    it("returns an object with flow / activity / mood / special arrays", () => {
      expect(Array.isArray(pool.flow)).toBe(true);
      expect(Array.isArray(pool.activity)).toBe(true);
      expect(Array.isArray(pool.mood)).toBe(true);
      expect(Array.isArray(pool.special)).toBe(true);
    });

    it("includes universal base tags (靜謐, 老屋, 巷弄, 打卡, 文青)", () => {
      expect(pool.mood).toContain("靜謐");
      expect(pool.flow).toContain("老屋");
      expect(pool.flow).toContain("巷弄");
      expect(pool.special).toContain("打卡");
      expect(pool.mood).toContain("文青");
    });

    it("includes taipei-specific extras (市場, 廟埕, 老字號)", () => {
      expect(pool.flow).toContain("市場");
      expect(pool.flow).toContain("廟埕");
      expect(pool.activity).toContain("老字號");
    });
  });

  describe("getTagPool('unknown')", () => {
    it("returns null for an unknown edition id", () => {
      expect(getTagPool("atlantis")).toBeNull();
    });
  });

  describe("getAllTagPools", () => {
    it("returns a union of all editions' tag pools (base + every edition's extras)", () => {
      const union = getAllTagPools();
      expect(Array.isArray(union.flow)).toBe(true);
      expect(union.flow).toContain("市場");
      expect(union.flow).toContain("廟埕");
      expect(union.activity).toContain("老字號");
      expect(union.mood).toContain("靜謐");
    });
  });
});
