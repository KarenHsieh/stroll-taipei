import { readFileSync } from "node:fs";
import path from "node:path";

const css = readFileSync(
  path.resolve(process.cwd(), "app/globals.css"),
  "utf8"
);

describe("globals.css — dark mode neutrality", () => {
  it("contains no prefers-color-scheme override", () => {
    expect(css).not.toMatch(/prefers-color-scheme/);
  });

  it("declares color-scheme: light on :root", () => {
    expect(css).toMatch(/:root\s*\{[^}]*color-scheme:\s*light/);
  });
});
