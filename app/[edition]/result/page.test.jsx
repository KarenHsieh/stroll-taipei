import { fireEvent, render, screen } from "@testing-library/react";

// The result page reads attractions via the repository (which talks to Postgres).
// In tests we mock it to return the static JSON fixture filtered by area,
// keeping the existing unit-test contract intact (no DB needed at test time).
jest.mock("@/lib/attractions/repository.js", () => {
  const attractions = require("@/data/attractions.json");
  return {
    __esModule: true,
    listAttractions: jest.fn(async ({ area } = {}) => {
      if (!area) return attractions;
      return attractions.filter((a) => a.area === area);
    }),
  };
});

// Wrap planStroll so tests can inspect the arguments composed by the page
// (e.g. the absolute startAt and the timeZone) while keeping the real impl.
jest.mock("@/lib/scheduler/plan-stroll.js", () => {
  const actual = jest.requireActual("@/lib/scheduler/plan-stroll.js");
  return {
    __esModule: true,
    planStroll: jest.fn((...args) => actual.planStroll(...args)),
  };
});

import { planStroll } from "@/lib/scheduler/plan-stroll.js";
import ResultPage from "./page.js";

async function renderResult(searchParamsObj, editionId = "taipei") {
  const element = await ResultPage({
    params: Promise.resolve({ edition: editionId }),
    searchParams: Promise.resolve(searchParamsObj),
  });
  const result = render(element);
  return result;
}

describe("ResultPage", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-16T06:00:00+08:00"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("renders the timeline with ≥3 stops and the last stop open-ended for a valid Dadaocheng request", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    });

    expect(screen.getByRole("heading", { level: 1, name: "大稻埕散策" })).toBeInTheDocument();

    const stopButtons = screen.getAllByRole("button");
    expect(stopButtons.length).toBeGreaterThanOrEqual(3);

    expect(screen.getByText("直到你想結束")).toBeInTheDocument();
    expect(screen.getByText(/^預計.*結束$/)).toBeInTheDocument();
  });

  it("renders the back-to-form control on the successful schedule path with the full query preserved", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    });

    const backLink = screen.getByRole("link", { name: "回到挑條件" });
    const expected = new URLSearchParams({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    }).toString();
    expect(backLink.getAttribute("href")).toBe(`/taipei?${expected}`);
  });

  it("shows the friendly empty-result message for an area with no attractions (信義)", async () => {
    await renderResult({
      area: "信義",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    });

    expect(screen.getByRole("heading", { level: 1, name: "信義散策" })).toBeInTheDocument();
    expect(
      screen.getByText("這個時段找不到合適路線,試試別的時間或氛圍。")
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders the back-to-form control on the empty-schedule fallback with the full query preserved", async () => {
    await renderResult({
      area: "信義",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    });

    const backLink = screen.getByRole("link", { name: "回到挑條件" });
    const expected = new URLSearchParams({
      area: "信義",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    }).toString();
    expect(backLink.getAttribute("href")).toBe(`/taipei?${expected}`);
  });

  it("renders the incomplete-form fallback when a parameter is missing", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      moods: "文青",
    });

    expect(screen.getByText("等等,還沒選完")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: /散策$/ })).not.toBeInTheDocument();
  });

  it("renders the back-to-form control on the incomplete-form fallback with the partial query preserved", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      moods: "文青",
    });

    const backLink = screen.getByRole("link", { name: "回到挑條件" });
    const expected = new URLSearchParams({
      area: "大稻埕",
      start: "14",
      moods: "文青",
    }).toString();
    expect(backLink.getAttribute("href")).toBe(`/taipei?${expected}`);
  });

  it("rendered HTML for the valid request contains no precise HH:MM time strings (drawer closed)", async () => {
    const { container } = await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    });

    expect(container.innerHTML).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("opens the attraction drawer with cost and today open hours when a stop card is clicked", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    });

    const stopButtons = screen
      .getAllByRole("button")
      .filter((b) => !b.textContent.includes("重新校準"));
    fireEvent.click(stopButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/^約 NT\$\d+$|^免費$/)).toBeInTheDocument();
    expect(screen.getByText(/^\d{2}:\d{2}～\d{2}:\d{2}$|^今日公休$/)).toBeInTheDocument();
  });

  it("renders the recalibrate button for a valid request", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
    });
    expect(screen.getByRole("button", { name: /重新校準/ })).toBeInTheDocument();
  });

  it("triggers notFound() for an unknown edition path segment", async () => {
    await expect(
      renderResult(
        { area: "大稻埕", start: "14", duration: "4", moods: "文青,靜謐" },
        "atlantis"
      )
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK|NEXT_NOT_FOUND/);
  });

  describe("composes startAt using the edition's timeZone", () => {
    // Fake system time is 2026-05-16T06:00:00+08:00, i.e. UTC 2026-05-15T22:00:00Z.
    // The wall-clock "today" differs by edition:
    //   - Asia/Taipei (+8): 2026-05-16
    //   - Asia/Tokyo  (+9): 2026-05-16
    // Both editions therefore see "today" as 2026-05-16. The `start=14` hour
    // is interpreted in the edition's timeZone:
    //   - taipei  → JST view CST 14:00 → UTC 2026-05-16T06:00:00Z
    //   - fukuoka → JST 14:00            → UTC 2026-05-16T05:00:00Z (one hour earlier)

    beforeEach(() => {
      planStroll.mockClear();
    });

    it("taipei edition composes startAt at Asia/Taipei wall-clock 14:00 (UTC 06:00) with timeZone 'Asia/Taipei'", async () => {
      await renderResult(
        { area: "大稻埕", start: "14", duration: "4", moods: "文青,靜謐" },
        "taipei"
      );

      expect(planStroll).toHaveBeenCalled();
      const lastCallInput = planStroll.mock.calls[planStroll.mock.calls.length - 1][0];
      expect(lastCallInput.timeZone).toBe("Asia/Taipei");
      expect(lastCallInput.startAt.toISOString()).toBe(
        "2026-05-16T06:00:00.000Z"
      );
    });

    it("fukuoka edition composes startAt at Asia/Tokyo wall-clock 14:00 (UTC 05:00), one hour earlier than taipei, with timeZone 'Asia/Tokyo'", async () => {
      await renderResult(
        { area: "天神・中洲", start: "14", duration: "4", moods: "熱鬧" },
        "fukuoka"
      );

      expect(planStroll).toHaveBeenCalled();
      const lastCallInput = planStroll.mock.calls[planStroll.mock.calls.length - 1][0];
      expect(lastCallInput.timeZone).toBe("Asia/Tokyo");
      expect(lastCallInput.startAt.toISOString()).toBe(
        "2026-05-16T05:00:00.000Z"
      );
    });
  });
});
