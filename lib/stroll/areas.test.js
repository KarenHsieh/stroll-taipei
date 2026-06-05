import { AREAS, findAreaInEdition } from "./areas.js";

describe("areas module — fukuoka four areas (2 active + 2 ready-to-open)", () => {
  describe("findAreaInEdition for fukuoka", () => {
    it("returns the tenjin-nakasu area by id", () => {
      expect(findAreaInEdition("fukuoka", "tenjin-nakasu")).toEqual({
        editionId: "fukuoka",
        id: "tenjin-nakasu",
        name: "天神・中洲",
        en: "Tenjin-Nakasu",
        active: true,
      });
    });

    it("returns the tenjin-nakasu area by display name (天神・中洲)", () => {
      expect(findAreaInEdition("fukuoka", "天神・中洲")).toEqual({
        editionId: "fukuoka",
        id: "tenjin-nakasu",
        name: "天神・中洲",
        en: "Tenjin-Nakasu",
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

    it("returns null for the obsolete pre-merge area id (tenjin)", () => {
      expect(findAreaInEdition("fukuoka", "tenjin")).toBeNull();
    });

    it("returns null for the obsolete pre-merge area id (nakasu)", () => {
      expect(findAreaInEdition("fukuoka", "nakasu")).toBeNull();
    });
  });

  describe("AREAS array partition", () => {
    it("contains exactly 4 entries for the fukuoka edition", () => {
      expect(AREAS.filter((a) => a.editionId === "fukuoka")).toHaveLength(4);
    });

    it("has exactly 2 active fukuoka areas (tenjin-nakasu / hakata)", () => {
      const activeFukuokaIds = AREAS.filter(
        (a) => a.editionId === "fukuoka" && a.active
      ).map((a) => a.id);
      expect(activeFukuokaIds).toEqual(["tenjin-nakasu", "hakata"]);
    });

    it("has exactly 2 ready-to-open fukuoka areas (mojiko / itoshima)", () => {
      const readyFukuokaIds = AREAS.filter(
        (a) => a.editionId === "fukuoka" && !a.active
      ).map((a) => a.id);
      expect(readyFukuokaIds).toEqual(["mojiko", "itoshima"]);
    });
  });
});
