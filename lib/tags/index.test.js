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

  describe("getTagPool('fukuoka')", () => {
    let pool;
    beforeAll(() => {
      pool = getTagPool("fukuoka");
    });

    it("returns an object with flow / activity / mood / special arrays", () => {
      expect(pool).not.toBeNull();
      expect(Array.isArray(pool.flow)).toBe(true);
      expect(Array.isArray(pool.activity)).toBe(true);
      expect(Array.isArray(pool.mood)).toBe(true);
      expect(Array.isArray(pool.special)).toBe(true);
    });

    it("includes universal base tags (老屋, 巷弄, 靜謐, 打卡)", () => {
      expect(pool.flow).toContain("老屋");
      expect(pool.flow).toContain("巷弄");
      expect(pool.mood).toContain("靜謐");
      expect(pool.special).toContain("打卡");
    });

    it("includes fukuoka-specific flow extras (商店街, 神社境內, 橫丁, 川岸)", () => {
      expect(pool.flow).toContain("商店街");
      expect(pool.flow).toContain("神社境內");
      expect(pool.flow).toContain("橫丁");
      expect(pool.flow).toContain("川岸");
    });

    it("includes fukuoka-specific activity extras (屋台, 銭湯, 拉麵店, 町家)", () => {
      expect(pool.activity).toContain("屋台");
      expect(pool.activity).toContain("銭湯");
      expect(pool.activity).toContain("拉麵店");
      expect(pool.activity).toContain("町家");
    });

    it("does not include taipei-specific extras (市場, 廟埕, 老字號)", () => {
      expect(pool.flow).not.toContain("市場");
      expect(pool.flow).not.toContain("廟埕");
      expect(pool.activity).not.toContain("老字號");
    });
  });

  describe("taipei pool is not polluted by fukuoka extras", () => {
    it("getTagPool('taipei').flow does not contain fukuoka-only tags", () => {
      const taipei = getTagPool("taipei");
      expect(taipei.flow).not.toContain("商店街");
      expect(taipei.flow).not.toContain("橫丁");
    });

    it("getTagPool('taipei').activity does not contain fukuoka-only tags", () => {
      const taipei = getTagPool("taipei");
      expect(taipei.activity).not.toContain("屋台");
      expect(taipei.activity).not.toContain("銭湯");
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

    it("includes fukuoka extras in the union (商店街, 屋台)", () => {
      const union = getAllTagPools();
      expect(union.flow).toContain("商店街");
      expect(union.activity).toContain("屋台");
    });
  });
});
