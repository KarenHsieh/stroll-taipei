import LegacyResultPage from "./page.js";

const mockRedirect = jest.fn((url) => {
  throw new Error(`__REDIRECT__:${url}`);
});

jest.mock("next/navigation", () => ({
  redirect: (url) => mockRedirect(url),
}));

beforeEach(() => {
  mockRedirect.mockClear();
});

describe("legacy /result path redirects to /taipei/result preserving query", () => {
  it("redirects to /taipei/result with the full query string", async () => {
    await expect(
      LegacyResultPage({
        searchParams: Promise.resolve({
          area: "大稻埕",
          start: "13",
          duration: "3",
          moods: "熱鬧",
        }),
      })
    ).rejects.toThrow(/^__REDIRECT__:\/taipei\/result\?/);
    const url = mockRedirect.mock.calls[0][0];
    expect(url).toContain("area=%E5%A4%A7%E7%A8%BB%E5%9F%95");
    expect(url).toContain("start=13");
    expect(url).toContain("duration=3");
    expect(url).toContain("moods=%E7%86%B1%E9%AC%A7");
  });

  it("redirects to /taipei/result with no query when called without params", async () => {
    await expect(
      LegacyResultPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("__REDIRECT__:/taipei/result");
  });
});
