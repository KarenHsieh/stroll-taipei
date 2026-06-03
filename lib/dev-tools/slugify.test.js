import { slugifyName } from "./slugify.js";

describe("slugifyName — derive ASCII kebab slug from attraction name", () => {
  it("handles a simple ASCII name with one space", () => {
    expect(slugifyName("Kushida Jinja")).toBe("kushida-jinja");
  });

  it("strips CJK characters and keeps the ASCII portion only", () => {
    expect(slugifyName("Nintendo 福岡")).toBe("nintendo");
  });

  it("returns an empty string for pure CJK names (no ASCII content)", () => {
    expect(slugifyName("櫛田神社")).toBe("");
  });

  it("merges repeated whitespace and dashes into a single dash", () => {
    expect(slugifyName("  Test --- Shop  ")).toBe("test-shop");
  });

  it("strips diacritics and unicode punctuation", () => {
    expect(slugifyName("café & bar")).toBe("caf-bar");
  });

  it("returns an empty string for an empty name", () => {
    expect(slugifyName("")).toBe("");
  });

  it("lowercases ASCII uppercase characters", () => {
    expect(slugifyName("PARCO")).toBe("parco");
  });

  it("keeps digits and ASCII letters together", () => {
    expect(slugifyName("3COINS Hakata")).toBe("3coins-hakata");
  });

  it("trims leading and trailing dashes after stripping", () => {
    expect(slugifyName("---test---")).toBe("test");
  });
});
