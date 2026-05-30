import RootPage from "./page.js";

const mockRedirect = jest.fn((url) => {
  throw new Error(`__REDIRECT__:${url}`);
});

jest.mock("next/navigation", () => ({
  redirect: (url) => mockRedirect(url),
}));

beforeEach(() => {
  mockRedirect.mockClear();
});

describe("legacy / root path redirects to the default edition", () => {
  it("redirects to /taipei when no query string is present", async () => {
    await expect(RootPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "__REDIRECT__:/taipei"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/taipei");
  });

  it("preserves the query string when redirecting to /taipei", async () => {
    await expect(
      RootPage({
        searchParams: Promise.resolve({
          area: "大稻埕",
          start: "13",
          duration: "3",
          moods: "熱鬧",
        }),
      })
    ).rejects.toThrow(/^__REDIRECT__:\/taipei\?/);
    const url = mockRedirect.mock.calls[0][0];
    expect(url).toContain("area=%E5%A4%A7%E7%A8%BB%E5%9F%95");
    expect(url).toContain("start=13");
    expect(url).toContain("duration=3");
    expect(url).toContain("moods=%E7%86%B1%E9%AC%A7");
  });
});
