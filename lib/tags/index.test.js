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

    it("includes universal base tags (靜謐, 老屋, 巷弄, 打卡, 文青, 水岸)", () => {
      expect(pool.mood).toContain("靜謐");
      expect(pool.flow).toContain("老屋");
      expect(pool.flow).toContain("巷弄");
      expect(pool.flow).toContain("水岸");
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

    it("inherits base tags (靜謐, 街角, 打卡, 老屋, 巷弄, 水岸)", () => {
      expect(pool.flow).toContain("街角");
      expect(pool.flow).toContain("老屋");
      expect(pool.flow).toContain("巷弄");
      expect(pool.flow).toContain("水岸");
      expect(pool.mood).toContain("靜謐");
      expect(pool.special).toContain("打卡");
    });

    it("base activity tags that aren't excluded are present (咖啡廳, 選物店, 獨立書店, 購物)", () => {
      expect(pool.activity).toContain("咖啡廳");
      expect(pool.activity).toContain("選物店");
      expect(pool.activity).toContain("獨立書店");
      expect(pool.activity).toContain("購物");
    });

    it("excluded base tags are filtered out (酒吧, 溜達, 閒晃)", () => {
      expect(pool.activity).not.toContain("酒吧");
      expect(pool.special).not.toContain("溜達");
      expect(pool.special).not.toContain("閒晃");
    });

    it("includes fukuoka-specific flow extras (商店街)", () => {
      expect(pool.flow).toContain("商店街");
    });

    it("includes fukuoka-specific activity extras (屋台, 室內)", () => {
      expect(pool.activity).toContain("屋台");
      expect(pool.activity).toContain("室內");
    });

    it("includes fukuoka-specific mood extras (流水聲, 傳統)", () => {
      expect(pool.mood).toContain("流水聲");
      expect(pool.mood).toContain("傳統");
    });

    it("does not include taipei-specific extras (市場, 廟埕, 老字號)", () => {
      expect(pool.flow).not.toContain("市場");
      expect(pool.flow).not.toContain("廟埕");
      expect(pool.activity).not.toContain("老字號");
    });

    it("does not include legacy/renamed tags (川岸, 河岸, 橫丁, 神社境內, 夜晚熱鬧)", () => {
      expect(pool.flow).not.toContain("川岸");
      expect(pool.flow).not.toContain("河岸");
      expect(pool.flow).not.toContain("橫丁");
      expect(pool.flow).not.toContain("神社境內");
      expect(pool.mood).not.toContain("夜晚熱鬧");
    });
  });

  describe("taipei pool is not polluted by fukuoka extras", () => {
    it("getTagPool('taipei').flow does not contain fukuoka-only tags (商店街)", () => {
      const taipei = getTagPool("taipei");
      expect(taipei.flow).not.toContain("商店街");
    });

    it("getTagPool('taipei').activity does not contain fukuoka-only tags (屋台, 室內)", () => {
      const taipei = getTagPool("taipei");
      expect(taipei.activity).not.toContain("屋台");
      expect(taipei.activity).not.toContain("室內");
    });

    it("getTagPool('taipei').mood does not contain fukuoka-only moods (流水聲, 傳統)", () => {
      const taipei = getTagPool("taipei");
      expect(taipei.mood).not.toContain("流水聲");
      expect(taipei.mood).not.toContain("傳統");
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

    it("includes fukuoka extras in the union (商店街, 屋台, 室內, 流水聲, 傳統)", () => {
      const union = getAllTagPools();
      expect(union.flow).toContain("商店街");
      expect(union.activity).toContain("屋台");
      expect(union.activity).toContain("室內");
      expect(union.mood).toContain("流水聲");
      expect(union.mood).toContain("傳統");
    });

    it("union still keeps tags that an edition opted out of, since other editions still use them (酒吧)", () => {
      const union = getAllTagPools();
      expect(union.activity).toContain("酒吧");
    });
  });
});
