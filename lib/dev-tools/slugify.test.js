import { slugifyName, diagnoseSlug } from "./slugify.js";

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

describe("diagnoseSlug — explain why a manual slug fails the id pattern", () => {
  it("returns null for an empty string (no diagnosis needed)", () => {
    expect(diagnoseSlug("")).toBeNull();
  });

  it("returns null for a slug that already matches the pattern", () => {
    expect(diagnoseSlug("kego-shrine")).toBeNull();
    expect(diagnoseSlug("taipei-101")).toBeNull();
  });

  it("flags uppercase letters and suggests the lowercase form", () => {
    const r = diagnoseSlug("Kego-Shrine");
    expect(r.issues).toContain("含大寫字母");
    expect(r.suggestion).toBe("kego-shrine");
  });

  it("flags underscores inside the slug", () => {
    const r = diagnoseSlug("lu_guo_coffee");
    expect(r.issues).toContain("含底線(slug 內只能用連字號 -)");
    expect(r.suggestion).toBe("luguocoffee");
  });

  it("flags whitespace", () => {
    const r = diagnoseSlug("kego shrine");
    expect(r.issues).toContain("含空白");
    expect(r.suggestion).toBe("kego-shrine");
  });

  it("flags leading and trailing hyphens separately", () => {
    expect(diagnoseSlug("-kego").issues).toContain("開頭是連字號");
    expect(diagnoseSlug("kego-").issues).toContain("結尾是連字號");
  });

  it("flags consecutive hyphens", () => {
    expect(diagnoseSlug("kego--shrine").issues).toContain("含連續連字號");
  });

  it("flags unsupported characters and lists them", () => {
    const r = diagnoseSlug("kego.shrine");
    expect(r.issues.some((i) => i.startsWith("含不支援的字元"))).toBe(true);
  });

  it("reports multiple issues together", () => {
    const r = diagnoseSlug("Kego_Shrine");
    expect(r.issues).toEqual(
      expect.arrayContaining(["含大寫字母", "含底線(slug 內只能用連字號 -)"])
    );
  });
});
