import { fireEvent, render, screen } from "@testing-library/react";

// Spy on planStroll. After this change the result page MUST NOT call it on
// the request path; the snapshot is composed from URL stops. (The Timeline's
// RecalibrateButton may still call it later when the user clicks 重新校準, but
// not during initial render.)
jest.mock("@/lib/scheduler/plan-stroll.js", () => {
  const actual = jest.requireActual("@/lib/scheduler/plan-stroll.js");
  return {
    __esModule: true,
    planStroll: jest.fn((...args) => actual.planStroll(...args)),
  };
});

import { planStroll } from "@/lib/scheduler/plan-stroll.js";
import ResultPage from "./page.js";

// Three real Dadaocheng attractions used by every "happy path" test below.
const DDC_STOPS = [
  "dadaocheng_lu-guo-coffee",
  "dadaocheng_xiao-yi-cheng",
  "dadaocheng_xiahai-temple",
];
const DDC_NAMES = ["爐鍋咖啡", "小藝埕", "霞海城隍廟"];

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

  beforeEach(() => {
    planStroll.mockClear();
  });

  it("renders the timeline in the order given by URL stops", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
      stops: DDC_STOPS.join(","),
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "大稻埕散策" })
    ).toBeInTheDocument();

    // Each named stop appears in the rendered timeline (order preserved).
    for (const name of DDC_NAMES) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByText("直到你想結束")).toBeInTheDocument();
    expect(screen.getByText(/^預計.*結束$/)).toBeInTheDocument();
  });

  it("does NOT call planStroll on initial render (snapshot is consumed directly)", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
      stops: DDC_STOPS.join(","),
    });
    expect(planStroll).not.toHaveBeenCalled();
  });

  it("filters tampered ids and still renders the remaining valid stops", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
      stops: `dadaocheng_fake-place,${DDC_STOPS[0]},another_fake,${DDC_STOPS[1]}`,
    });

    // Title still renders + only the two real stops appear in order.
    expect(
      screen.getByRole("heading", { level: 1, name: "大稻埕散策" })
    ).toBeInTheDocument();
    expect(screen.getByText(DDC_NAMES[0])).toBeInTheDocument();
    expect(screen.getByText(DDC_NAMES[1])).toBeInTheDocument();
    expect(screen.queryByText(DDC_NAMES[2])).not.toBeInTheDocument();
  });

  it("renders the back-to-form control with the full query preserved (taipei)", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
      stops: DDC_STOPS.join(","),
    });

    const backLink = screen.getByRole("link", { name: "回到挑條件" });
    const expected = new URLSearchParams({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
      stops: DDC_STOPS.join(","),
    }).toString();
    expect(backLink.getAttribute("href")).toBe(`/taipei?${expected}`);
  });

  describe("empty-result fallback", () => {
    it("shows the fallback when the URL has no stops parameter", async () => {
      await renderResult({
        area: "大稻埕",
        start: "14",
        duration: "4",
        moods: "文青,靜謐",
      });

      expect(
        screen.getByRole("heading", { level: 1, name: "大稻埕散策" })
      ).toBeInTheDocument();
      expect(
        screen.getByText("這個時段找不到合適路線,試試別的時間或氛圍。")
      ).toBeInTheDocument();
    });

    it("shows the fallback when every stop id is absent from the dataset", async () => {
      await renderResult({
        area: "大稻埕",
        start: "14",
        duration: "4",
        moods: "文青,靜謐",
        stops: "dadaocheng_fake-one,dadaocheng_fake-two",
      });

      expect(
        screen.getByRole("heading", { level: 1, name: "大稻埕散策" })
      ).toBeInTheDocument();
      expect(
        screen.getByText("這個時段找不到合適路線,試試別的時間或氛圍。")
      ).toBeInTheDocument();
    });

    it("renders the back-to-form control on the empty-schedule fallback with the partial query preserved", async () => {
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
  });

  it("does NOT render an anchor reference line when legacy anchorLat/anchorLng appear in the URL", async () => {
    const { container } = await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青",
      stops: DDC_STOPS[0],
      anchorLat: "25.05",
      anchorLng: "121.51",
    });

    // No reference-line testid, no "從 X 附近開始" copy.
    expect(
      container.querySelector('[data-testid="anchor-reference-line"]')
    ).toBeNull();
    expect(container.innerHTML).not.toMatch(/從.*附近開始/);
    // Timeline still renders the one valid stop.
    expect(screen.getByText(DDC_NAMES[0])).toBeInTheDocument();
  });

  it("renders the incomplete-form fallback when a required parameter is missing", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      moods: "文青",
    });

    expect(screen.getByText("等等,還沒選完")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: /散策$/ })
    ).not.toBeInTheDocument();
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
      stops: DDC_STOPS.join(","),
    });

    expect(container.innerHTML).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("opens the attraction drawer with cost and today open hours when a stop card is clicked", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
      stops: DDC_STOPS.join(","),
    });

    const stopButtons = screen
      .getAllByRole("button")
      .filter((b) => !b.textContent.includes("重新校準"));
    fireEvent.click(stopButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/^約 NT\$\d+$|^免費$/)).toBeInTheDocument();
    expect(
      screen.getByText(/^\d{2}:\d{2}～\d{2}:\d{2}$|^今日公休$/)
    ).toBeInTheDocument();
  });

  it("renders the recalibrate button for a valid request", async () => {
    await renderResult({
      area: "大稻埕",
      start: "14",
      duration: "4",
      moods: "文青,靜謐",
      stops: DDC_STOPS.join(","),
    });
    expect(
      screen.getByRole("button", { name: /重新校準/ })
    ).toBeInTheDocument();
  });

  it("triggers notFound() for an unknown edition path segment", async () => {
    await expect(
      renderResult(
        {
          area: "大稻埕",
          start: "14",
          duration: "4",
          moods: "文青,靜謐",
          stops: DDC_STOPS.join(","),
        },
        "atlantis"
      )
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK|NEXT_NOT_FOUND/);
  });

  describe("does not render the edition picker", () => {
    it("a valid taipei result page contains no 散策地 picker label and no aria-current='page' element", async () => {
      const { container } = await renderResult({
        area: "大稻埕",
        start: "14",
        duration: "4",
        moods: "文青,靜謐",
        stops: DDC_STOPS.join(","),
      });

      expect(screen.queryByText("散策地")).not.toBeInTheDocument();
      expect(container.querySelector("[aria-current='page']")).toBeNull();
    });
  });
});
