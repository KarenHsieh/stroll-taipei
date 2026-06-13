import { render, screen, fireEvent } from "@testing-library/react";
import { AREAS } from "@/lib/stroll/areas.js";
import { getEditionById } from "@/lib/stroll/editions.js";

const fukuokaEdition = getEditionById("fukuoka");
const fukuokaAreas = AREAS.filter((a) => a.editionId === "fukuoka");

const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

// Wrap planStroll so tests can intercept the arguments and stub the returned
// stops. Default impl returns an empty stops list so tests opting in must
// reset the mock to a known value before triggering submit.
jest.mock("@/lib/scheduler/plan-stroll.js", () => ({
  __esModule: true,
  planStroll: jest.fn(() => ({ stops: [] })),
}));

import { planStroll } from "@/lib/scheduler/plan-stroll.js";
import EditionHomeForm from "./edition-home-form.jsx";

const taipeiEdition = getEditionById("taipei");
const taipeiAreas = AREAS.filter((a) => a.editionId === "taipei");

const Home = () => (
  <EditionHomeForm edition={taipeiEdition} areas={taipeiAreas} />
);

let originalGeolocation;

beforeEach(() => {
  mockPush.mockClear();
  planStroll.mockClear();
  planStroll.mockImplementation(() => ({ stops: [] }));
  mockSearchParams = new URLSearchParams();
  originalGeolocation = navigator.geolocation;
});

afterEach(() => {
  Object.defineProperty(navigator, "geolocation", {
    value: originalGeolocation,
    configurable: true,
  });
});

function installGeolocation(impl) {
  Object.defineProperty(navigator, "geolocation", {
    value: impl,
    configurable: true,
  });
}

describe("EditionHomeForm (input form) — taipei", () => {
  it("renders the four section headings", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "想去哪散策" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "幾點出門" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "想散策多久" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "想要的氛圍" })).toBeInTheDocument();
  });

  it("submit button starts disabled when no fields are selected", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /產生散策/ })).toBeDisabled();
  });

  it("after filling all four fields, submit becomes enabled and clicking it calls router.push with the encoded URL", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /大稻埕/ }));
    fireEvent.click(screen.getByRole("button", { name: "下午" }));
    fireEvent.click(screen.getByRole("button", { name: "下午 2 點" }));
    // duration: pick the 4-hour card (its label adapts to bucket → "走整個下午")
    fireEvent.click(screen.getByRole("button", { name: /走整個下午/ }));
    fireEvent.click(screen.getByRole("button", { name: "文青" }));
    fireEvent.click(screen.getByRole("button", { name: "靜謐" }));

    const submit = screen.getByRole("button", { name: /產生散策/ });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    expect(mockPush).toHaveBeenCalledTimes(1);
    const target = mockPush.mock.calls[0][0];
    expect(target.startsWith("/taipei/result?")).toBe(true);
    const params = new URLSearchParams(target.split("?")[1]);
    expect(params.get("area")).toBe("大稻埕");
    expect(params.get("start")).toBe("14");
    expect(params.get("duration")).toBe("4");
    expect(params.get("moods")).toBe("文青,靜謐");
  });

  it("missing one field keeps submit disabled", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /大稻埕/ }));
    fireEvent.click(screen.getByRole("button", { name: "下午" }));
    fireEvent.click(screen.getByRole("button", { name: "下午 2 點" }));
    fireEvent.click(screen.getByRole("button", { name: /走整個下午/ }));
    expect(screen.getByRole("button", { name: /產生散策/ })).toBeDisabled();
  });

  describe("hydration from URL query string", () => {
    it("with a full query string, every picker shows the selected value and submit is enabled", () => {
      mockSearchParams = new URLSearchParams({
        area: "大稻埕",
        start: "10",
        duration: "3",
        moods: "文青,靜謐",
      });

      render(<Home />);

      expect(screen.getByRole("button", { name: /大稻埕/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "上午 10 點" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: /慢慢走/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "文青" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "靜謐" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: /產生散策/ })).not.toBeDisabled();
    });

    it("with an empty query string, every picker is unselected and submit is disabled", () => {
      mockSearchParams = new URLSearchParams();

      render(<Home />);

      expect(screen.getByRole("button", { name: /大稻埕/ })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(screen.getByRole("button", { name: "上午 10 點" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(screen.getByRole("button", { name: /慢慢走/ })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(screen.getByRole("button", { name: "文青" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(screen.getByRole("button", { name: /產生散策/ })).toBeDisabled();
    });

    it("with a partial query string, only the present fields are hydrated and submit stays disabled", () => {
      mockSearchParams = new URLSearchParams({
        area: "大稻埕",
        duration: "3",
      });

      render(<Home />);

      expect(screen.getByRole("button", { name: /大稻埕/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: /慢慢走/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "文青" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(screen.getByRole("button", { name: /產生散策/ })).toBeDisabled();
    });

    it("with an unparseable numeric field, the bad field stays unselected while siblings hydrate", () => {
      mockSearchParams = new URLSearchParams({
        area: "大稻埕",
        start: "abc",
        duration: "3",
        moods: "文青",
      });

      render(<Home />);

      expect(screen.getByRole("button", { name: /大稻埕/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: /慢慢走/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "文青" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      // no hour chip should be selected — start is null
      expect(screen.getByRole("button", { name: "上午 10 點" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(screen.getByRole("button", { name: /產生散策/ })).toBeDisabled();
    });
  });

  describe("edition picker", () => {
    it("renders the picker with both editions and marks taipei as active", () => {
      render(<Home />);
      expect(screen.getByText("散策地")).toBeInTheDocument();

      const active = screen.getByRole("generic", { current: "page" });
      expect(active.textContent).toContain("台北");

      const fukuokaLink = screen.getByRole("link", { name: /福岡/ });
      expect(fukuokaLink.getAttribute("href")).toBe("/fukuoka");
    });

    it("on fukuoka home, marks fukuoka as active and links taipei to /taipei", () => {
      render(
        <EditionHomeForm edition={fukuokaEdition} areas={fukuokaAreas} />
      );
      expect(screen.getByText("散策地")).toBeInTheDocument();

      const active = screen.getByRole("generic", { current: "page" });
      expect(active.textContent).toContain("福岡");

      const taipeiLink = screen.getByRole("link", { name: /台北/ });
      expect(taipeiLink.getAttribute("href")).toBe("/taipei");
    });
  });

  describe("LocationSection placement and visibility", () => {
    it("is NOT rendered before any area is selected", () => {
      render(<Home />);
      expect(
        screen.queryByText("要從目前位置開始規劃嗎？")
      ).not.toBeInTheDocument();
    });

    it("appears once an area is selected", () => {
      render(<Home />);
      fireEvent.click(screen.getByRole("button", { name: /大稻埕/ }));
      expect(
        screen.getByText("要從目前位置開始規劃嗎？")
      ).toBeInTheDocument();
    });

    it("preserves currentLocation when the user switches areas after pressing 是 (success)", () => {
      const getCurrentPosition = jest.fn((success) => {
        success({ coords: { latitude: 25.058, longitude: 121.51 } });
      });
      installGeolocation({ getCurrentPosition });

      render(<Home />);
      fireEvent.click(screen.getByRole("button", { name: /大稻埕/ }));
      fireEvent.click(screen.getByRole("button", { name: "是" }));
      expect(screen.getByText("已取得位置 ✓")).toBeInTheDocument();

      // Switch to a different area — currentLocation should be retained.
      fireEvent.click(screen.getByRole("button", { name: /永康街/ }));
      expect(screen.getByText("已取得位置 ✓")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "是" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
  });

  describe("client-side planStroll on submit + stops snapshot URL", () => {
    // Helper: fill in the three other required pickers (start, duration, moods)
    // after the area is already selected.
    const fillTimeDurationMoods = () => {
      fireEvent.click(screen.getByRole("button", { name: "下午" }));
      fireEvent.click(screen.getByRole("button", { name: "下午 2 點" }));
      fireEvent.click(screen.getByRole("button", { name: /走整個下午/ }));
      fireEvent.click(screen.getByRole("button", { name: "文青" }));
    };

    const TENJIN_INSIDE = { latitude: 33.592, longitude: 130.405 }; // inside tenjin-nakasu bbox
    const HAKATA_OUTSIDE = { latitude: 33.589, longitude: 130.420 }; // outside tenjin-nakasu bbox + buffer

    it("submit URL contains stops snapshot from planStroll result (router.push receives stops=id1,id2)", () => {
      planStroll.mockImplementation(() => ({
        stops: [
          { attraction: { id: "dadaocheng_lu-guo-coffee" } },
          { attraction: { id: "dadaocheng_xiahai-temple" } },
        ],
      }));

      render(<Home />);
      fireEvent.click(screen.getByRole("button", { name: /大稻埕/ }));
      fillTimeDurationMoods();

      fireEvent.click(screen.getByRole("button", { name: /產生散策/ }));

      expect(mockPush).toHaveBeenCalledTimes(1);
      const target = mockPush.mock.calls[0][0];
      const params = new URLSearchParams(target.split("?")[1]);
      expect(params.get("stops")).toBe(
        "dadaocheng_lu-guo-coffee,dadaocheng_xiahai-temple"
      );
    });

    it("currentLocation inside the selected area's bbox → planStroll receives anchor: { lat, lng }", () => {
      const getCurrentPosition = jest.fn((success) => {
        success({ coords: TENJIN_INSIDE });
      });
      installGeolocation({ getCurrentPosition });

      render(
        <EditionHomeForm edition={fukuokaEdition} areas={fukuokaAreas} />
      );

      fireEvent.click(screen.getByRole("button", { name: /天神・中洲/ }));
      fireEvent.click(screen.getByRole("button", { name: "是" }));
      fireEvent.click(screen.getByRole("button", { name: "下午" }));
      fireEvent.click(screen.getByRole("button", { name: "下午 2 點" }));
      fireEvent.click(screen.getByRole("button", { name: /走整個下午/ }));
      fireEvent.click(screen.getByRole("button", { name: "熱鬧" }));

      fireEvent.click(screen.getByRole("button", { name: /產生散策/ }));

      expect(planStroll).toHaveBeenCalled();
      const callInput = planStroll.mock.calls[0][0];
      expect(callInput.anchor).toEqual({
        lat: TENJIN_INSIDE.latitude,
        lng: TENJIN_INSIDE.longitude,
      });
    });

    it("currentLocation outside the selected area's bbox + buffer → planStroll receives anchor: null", () => {
      const getCurrentPosition = jest.fn((success) => {
        success({ coords: HAKATA_OUTSIDE });
      });
      installGeolocation({ getCurrentPosition });

      render(
        <EditionHomeForm edition={fukuokaEdition} areas={fukuokaAreas} />
      );

      fireEvent.click(screen.getByRole("button", { name: /天神・中洲/ }));
      fireEvent.click(screen.getByRole("button", { name: "是" }));
      fireEvent.click(screen.getByRole("button", { name: "下午" }));
      fireEvent.click(screen.getByRole("button", { name: "下午 2 點" }));
      fireEvent.click(screen.getByRole("button", { name: /走整個下午/ }));
      fireEvent.click(screen.getByRole("button", { name: "熱鬧" }));

      fireEvent.click(screen.getByRole("button", { name: /產生散策/ }));

      expect(planStroll).toHaveBeenCalled();
      const callInput = planStroll.mock.calls[0][0];
      expect(callInput.anchor).toBeNull();
    });

    it("planStroll returning empty stops still pushes a URL (empty stops case)", () => {
      planStroll.mockImplementation(() => ({ stops: [] }));

      render(<Home />);
      fireEvent.click(screen.getByRole("button", { name: /大稻埕/ }));
      fillTimeDurationMoods();
      fireEvent.click(screen.getByRole("button", { name: /產生散策/ }));

      expect(mockPush).toHaveBeenCalledTimes(1);
      const target = mockPush.mock.calls[0][0];
      expect(target.startsWith("/taipei/result?")).toBe(true);
    });

    it("submit URL never contains anchorLat or anchorLng params (even when currentLocation is set)", () => {
      const getCurrentPosition = jest.fn((success) => {
        success({ coords: TENJIN_INSIDE });
      });
      installGeolocation({ getCurrentPosition });
      planStroll.mockImplementation(() => ({
        stops: [{ attraction: { id: "tenjin-nakasu_kushida-jinja" } }],
      }));

      render(
        <EditionHomeForm edition={fukuokaEdition} areas={fukuokaAreas} />
      );

      fireEvent.click(screen.getByRole("button", { name: /天神・中洲/ }));
      fireEvent.click(screen.getByRole("button", { name: "是" }));
      fireEvent.click(screen.getByRole("button", { name: "下午" }));
      fireEvent.click(screen.getByRole("button", { name: "下午 2 點" }));
      fireEvent.click(screen.getByRole("button", { name: /走整個下午/ }));
      fireEvent.click(screen.getByRole("button", { name: "熱鬧" }));

      fireEvent.click(screen.getByRole("button", { name: /產生散策/ }));

      const target = mockPush.mock.calls[0][0];
      const params = new URLSearchParams(target.split("?")[1]);
      expect(params.get("anchorLat")).toBeNull();
      expect(params.get("anchorLng")).toBeNull();
    });
  });

  describe("hydration with legacy anchor params and stops", () => {
    it("with all required fields, the four pickers hydrate AND the LocationSection is visible with no button selected", () => {
      mockSearchParams = new URLSearchParams({
        area: "大稻埕",
        start: "10",
        duration: "3",
        moods: "文青",
      });

      render(<Home />);

      // four pickers hydrated
      expect(screen.getByRole("button", { name: /大稻埕/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      // LocationSection visible (area is selected) — no button selected
      expect(screen.getByText("要從目前位置開始規劃嗎？")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "是" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(screen.getByRole("button", { name: "否" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("legacy anchorLat/anchorLng in URL are silently ignored: form hydrates normally, LocationSection currentLocation stays null", () => {
      mockSearchParams = new URLSearchParams({
        area: "大稻埕",
        start: "10",
        duration: "3",
        moods: "文青",
        anchorLat: "25.05",
        anchorLng: "121.51",
      });

      render(<Home />);

      // four pickers hydrate normally
      expect(screen.getByRole("button", { name: /大稻埕/ })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "上午 10 點" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );

      // LocationSection visible (area selected) but no button selected and
      // no "已取得位置 ✓" marker — currentLocation stayed null.
      expect(screen.getByText("要從目前位置開始規劃嗎？")).toBeInTheDocument();
      expect(screen.queryByText("已取得位置 ✓")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "是" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });
  });

  describe("coming-soon sheet", () => {
    it("clicking the coming-soon footer pill opens the sheet, and clicking ✕ closes it", () => {
      render(<Home />);
      // sheet starts hidden
      const hiddenDialog = screen.getByRole("dialog", { hidden: true });
      expect(hiddenDialog).toHaveAttribute("aria-hidden", "true");

      fireEvent.click(screen.getByRole("button", { name: /更多地點即將推出/ }));
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-hidden", "false");

      fireEvent.click(screen.getByLabelText("關閉"));
      expect(screen.getByRole("dialog", { hidden: true })).toHaveAttribute(
        "aria-hidden",
        "true"
      );
    });
  });
});
