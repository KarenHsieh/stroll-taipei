import { AREAS, findAreaInEdition } from "./areas.js";

describe("areas module — fukuoka six areas (4 active + 2 ready-to-open)", () => {
  describe("findAreaInEdition for fukuoka", () => {
    it("returns the tenjin area by id", () => {
      expect(findAreaInEdition("fukuoka", "tenjin")).toEqual({
        editionId: "fukuoka",
        id: "tenjin",
        name: "天神",
        en: "Tenjin",
        active: true,
      });
    });

    it("returns the tenjin area by display name (天神)", () => {
      expect(findAreaInEdition("fukuoka", "天神")).toEqual({
        editionId: "fukuoka",
        id: "tenjin",
        name: "天神",
        en: "Tenjin",
        active: true,
      });
    });

    it("returns mojiko with active=false", () => {
      expect(findAreaInEdition("fukuoka", "mojiko").active).toBe(false);
    });

    it("returns mojiko by display name (門司港) with active=false", () => {
      expect(findAreaInEdition("fukuoka", "門司港").active).toBe(false);
    });

    it("returns itoshima with active=false", () => {
      expect(findAreaInEdition("fukuoka", "itoshima").active).toBe(false);
    });

    it("returns itoshima by display name (糸島) with active=false", () => {
      expect(findAreaInEdition("fukuoka", "糸島").active).toBe(false);
    });

    it("returns null for an area not in the fukuoka edition (西新)", () => {
      expect(findAreaInEdition("fukuoka", "西新")).toBeNull();
    });
  });

  describe("AREAS array partition", () => {
    it("contains exactly 5 entries for the fukuoka edition", () => {
      expect(AREAS.filter((a) => a.editionId === "fukuoka")).toHaveLength(5);
    });

    it("has exactly 3 active fukuoka areas (tenjin / hakata / nakasu)", () => {
      const activeFukuokaIds = AREAS.filter(
        (a) => a.editionId === "fukuoka" && a.active
      ).map((a) => a.id);
      expect(activeFukuokaIds).toEqual(["tenjin", "hakata", "nakasu"]);
    });

    it("has exactly 2 ready-to-open fukuoka areas (mojiko / itoshima)", () => {
      const readyFukuokaIds = AREAS.filter(
        (a) => a.editionId === "fukuoka" && !a.active
      ).map((a) => a.id);
      expect(readyFukuokaIds).toEqual(["mojiko", "itoshima"]);
    });
  });
});
