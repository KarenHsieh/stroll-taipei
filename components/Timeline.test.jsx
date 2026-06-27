import { act, fireEvent, render, screen } from "@testing-library/react";

// Mock react-map-gl/mapbox so the embedded RoutePreviewMap renders predictable test DOM.
jest.mock("react-map-gl/mapbox", () => {
  const React = require("react");
  const Map = jest.fn(({ children }) =>
    React.createElement(
      "div",
      { "data-testid": "mapbox-map" },
      children
    )
  );
  const Marker = jest.fn(({ children }) =>
    React.createElement("div", { "data-testid": "mapbox-marker" }, children)
  );
  return { __esModule: true, default: Map, Marker };
});

const ORIGINAL_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
beforeEach(() => {
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "pk.test.token";
});
afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  } else {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = ORIGINAL_TOKEN;
  }
});

import Timeline from "./Timeline.jsx";

function makeStop(overrides = {}) {
  return {
    name: "stop",
    tags: ["x"],
    timeText: "下午 2 點",
    stayText: "約 1 到 1.5 小時",
    walkInText: "",
    isOpenEnded: false,
    attraction: { name: "stop", tags: ["x"], lat: 25.05, lng: 121.51 },
    costText: "約 NT$100",
    todayOpenHoursText: "11:00～20:00",
    indoor: true,
    ...overrides,
  };
}

const mockSchedule = {
  areaTitle: "大稻埕散策",
  stops: [
    makeStop({
      name: "爐鍋咖啡",
      tags: ["咖啡廳"],
      timeText: "下午 2 點",
      stayText: "約 1 到 1.5 小時",
      walkInText: "",
      isOpenEnded: false,
      attraction: { id: "a", name: "爐鍋咖啡", tags: ["咖啡廳"], lat: 25.0567, lng: 121.5101 },
      costText: "約 NT$250",
      todayOpenHoursText: "11:00～20:00",
      indoor: true,
    }),
    makeStop({
      name: "小藝埕",
      tags: ["選物店"],
      timeText: "約下午 3 點",
      stayText: "約 30 分鐘到 1 小時",
      walkInText: "走 3 分鐘左右",
      isOpenEnded: false,
      attraction: { id: "b", name: "小藝埕", tags: ["選物店"], lat: 25.0578, lng: 121.5110 },
      costText: "約 NT$200",
      todayOpenHoursText: "11:00～19:00",
      indoor: true,
    }),
    makeStop({
      name: "永樂市場",
      tags: ["市場"],
      timeText: "約下午 4 點",
      stayText: "約 30 分鐘到 1 小時",
      walkInText: "走 5 分鐘左右",
      isOpenEnded: true,
      attraction: { id: "c", name: "永樂市場", tags: ["市場"], lat: 25.0556, lng: 121.5095 },
      costText: "約 NT$100",
      todayOpenHoursText: "06:00～19:00",
      indoor: false,
    }),
  ],
  endText: "預計約下午 5 點半結束",
};

describe("Timeline", () => {
  it("renders all stops, walk segments, the open-ended marker, and the endText", () => {
    render(<Timeline displaySchedule={mockSchedule} />);

    expect(screen.getByText("爐鍋咖啡")).toBeInTheDocument();
    expect(screen.getByText("小藝埕")).toBeInTheDocument();
    expect(screen.getByText("永樂市場")).toBeInTheDocument();

    expect(screen.getByText("走 3 分鐘左右")).toBeInTheDocument();
    expect(screen.getByText("走 5 分鐘左右")).toBeInTheDocument();

    expect(screen.getByText("直到你想結束")).toBeInTheDocument();

    expect(screen.getByText("預計約下午 5 點半結束")).toBeInTheDocument();
  });

  it("omits endText when null", () => {
    render(
      <Timeline
        displaySchedule={{ areaTitle: "信義散策", stops: [], endText: null }}
      />
    );
    expect(screen.queryByText(/預計/)).not.toBeInTheDocument();
  });

  it("opens the drawer with stop's attraction info when a stop card is clicked", () => {
    render(<Timeline displaySchedule={mockSchedule} />);
    const stopButtons = screen.getAllByRole("button", { name: /爐鍋咖啡/ });
    fireEvent.click(stopButtons[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("約 NT$250")).toBeInTheDocument();
    expect(screen.getByText("11:00～20:00")).toBeInTheDocument();
  });

  it("closes the drawer when backdrop is clicked", () => {
    render(<Timeline displaySchedule={mockSchedule} />);
    fireEvent.click(screen.getAllByRole("button", { name: /爐鍋咖啡/ })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.previousSibling);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("replaces drawer content when a different stop is clicked (single instance)", () => {
    render(<Timeline displaySchedule={mockSchedule} />);
    fireEvent.click(screen.getAllByRole("button", { name: /爐鍋咖啡/ })[0]);
    expect(screen.getByText("約 NT$250")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /小藝埕/ })[0]);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText("約 NT$200")).toBeInTheDocument();
    expect(screen.queryByText("約 NT$250")).not.toBeInTheDocument();
  });

  describe("route preview map integration", () => {
    it("renders RoutePreviewMap above the ordered stop list when stops are non-empty", () => {
      const { container } = render(<Timeline displaySchedule={mockSchedule} />);
      const map = screen.getByTestId("mapbox-map");
      const ol = container.querySelector("ol");
      expect(map).toBeInTheDocument();
      expect(ol).toBeInTheDocument();
      // DOM order: map node appears before ol node
      const mapPos = Array.from(
        container.querySelectorAll("*")
      ).indexOf(map);
      const olPos = Array.from(container.querySelectorAll("*")).indexOf(ol);
      expect(mapPos).toBeLessThan(olPos);
    });

    it("renders one pin per stop with index + 1 labels and matching accent colors", () => {
      render(<Timeline displaySchedule={mockSchedule} />);
      // mockSchedule has 3 stops
      expect(screen.getByTestId("route-pin-0").textContent).toBe("1");
      expect(screen.getByTestId("route-pin-1").textContent).toBe("2");
      expect(screen.getByTestId("route-pin-2").textContent).toBe("3");
      // last stop uses the sage color; pin 2 and the timeline numbered circle should agree.
      const pin2 = screen.getByTestId("route-pin-2");
      expect(pin2.style.background.toLowerCase()).toMatch(
        /rgb\(126, 149, 119\)|#7e9577/i
      );
    });

    it("does not render RoutePreviewMap when stops is empty", () => {
      render(
        <Timeline
          displaySchedule={{ areaTitle: "信義散策", stops: [], endText: null }}
        />
      );
      expect(screen.queryByTestId("mapbox-map")).not.toBeInTheDocument();
      expect(screen.queryByTestId("route-pin-0")).not.toBeInTheDocument();
    });

    it("falls back to 「地圖暫時無法載入」 placeholder when token is missing but still renders all stop cards", () => {
      delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      render(<Timeline displaySchedule={mockSchedule} />);
      expect(screen.getByText("地圖暫時無法載入")).toBeInTheDocument();
      expect(screen.queryByTestId("mapbox-map")).not.toBeInTheDocument();
      // Stop cards still render
      expect(screen.getByText("爐鍋咖啡")).toBeInTheDocument();
      expect(screen.getByText("小藝埕")).toBeInTheDocument();
      expect(screen.getByText("永樂市場")).toBeInTheDocument();
    });
  });

  describe("pin click → scroll + 1500ms highlight", () => {
    let originalScrollIntoView;
    let scrollSpy;
    beforeEach(() => {
      // JSDOM omits Element.prototype.scrollIntoView; install a stub so jest.spyOn works.
      originalScrollIntoView = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function () {};
      scrollSpy = jest
        .spyOn(Element.prototype, "scrollIntoView")
        .mockImplementation(() => {});
      jest.useFakeTimers();
    });
    afterEach(() => {
      scrollSpy.mockRestore();
      if (originalScrollIntoView === undefined) {
        delete Element.prototype.scrollIntoView;
      } else {
        Element.prototype.scrollIntoView = originalScrollIntoView;
      }
      jest.useRealTimers();
    });

    it("clicking pin-1 calls scrollIntoView({behavior:'smooth', block:'center'}) on the second timeline-stop li", () => {
      const { container } = render(<Timeline displaySchedule={mockSchedule} />);
      fireEvent.click(screen.getByTestId("route-pin-1"));
      expect(scrollSpy).toHaveBeenCalledTimes(1);
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
      // The li at index 1 is the element that was scrolled to.
      const targetLi = container.querySelector("#timeline-stop-1");
      expect(targetLi).toBeInTheDocument();
      expect(scrollSpy.mock.instances[0]).toBe(targetLi);
    });

    it("clicked stop's li receives a highlight attribute immediately and the attribute is removed after ~1500ms", () => {
      const { container } = render(<Timeline displaySchedule={mockSchedule} />);
      fireEvent.click(screen.getByTestId("route-pin-1"));
      const targetLi = container.querySelector("#timeline-stop-1");
      expect(targetLi.getAttribute("data-highlight")).toBe("true");

      act(() => {
        jest.advanceTimersByTime(1500);
      });
      expect(targetLi.getAttribute("data-highlight")).not.toBe("true");
    });

    it("clicking a pin does NOT open the AttractionDrawer", () => {
      render(<Timeline displaySchedule={mockSchedule} />);
      fireEvent.click(screen.getByTestId("route-pin-0"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("clicking a different pin while a highlight is still active retargets the highlight", () => {
      const { container } = render(<Timeline displaySchedule={mockSchedule} />);
      fireEvent.click(screen.getByTestId("route-pin-0"));
      const li0 = container.querySelector("#timeline-stop-0");
      expect(li0.getAttribute("data-highlight")).toBe("true");

      // before timeout fires, click another pin
      jest.advanceTimersByTime(500);
      fireEvent.click(screen.getByTestId("route-pin-2"));
      const li2 = container.querySelector("#timeline-stop-2");
      expect(li0.getAttribute("data-highlight")).not.toBe("true");
      expect(li2.getAttribute("data-highlight")).toBe("true");
    });
  });

  describe("with originalRequest (recalibration enabled)", () => {
    const sundayOpenAllDay = [{ day: "sun", open: "10:00", close: "22:00" }];
    const mkAttr = (id, name) => ({
      id,
      name,
      area: "大稻埕",
      tags: ["咖啡廳"],
      stay_range: [30, 60],
      avg_cost: 100,
      indoor: true,
      open_hours: sundayOpenAllDay,
      lat: 25.05,
      lng: 121.51,
      rating: 4.5,
    });
    const pool = [
      mkAttr("a", "爐鍋咖啡"),
      mkAttr("b", "小藝埕"),
      mkAttr("c", "永樂市場"),
      mkAttr("d", "其他景點"),
    ];
    const originalRequest = {
      area: "大稻埕",
      startAt: new Date(2026, 4, 17, 14, 0, 0, 0),
      durationMinutes: 240,
      moods: ["咖啡廳"],
      currency: "TWD",
      timeZone: "Asia/Taipei",
      pool,
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 4, 17, 15, 30, 0, 0));
    });
    afterEach(() => jest.useRealTimers());

    it("renders the recalibrate button when originalRequest is provided", () => {
      render(
        <Timeline displaySchedule={mockSchedule} originalRequest={originalRequest} />
      );
      expect(screen.getByRole("button", { name: /重新校準/ })).toBeInTheDocument();
    });

    it("clicking the recalibrate button opens the picker with 我剛剛離開哪一站?", () => {
      render(
        <Timeline displaySchedule={mockSchedule} originalRequest={originalRequest} />
      );
      fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
      expect(screen.getByText("我剛剛離開哪一站?")).toBeInTheDocument();
    });

    it("propagates isPast to past stops (opacity-60) but not to upcoming stops", () => {
      const mixedSchedule = {
        areaTitle: "大稻埕散策",
        stops: [
          makeStop({
            name: "過去站 A",
            attraction: { name: "過去站 A", tags: ["t"] },
            isPast: true,
            walkInText: "",
          }),
          makeStop({
            name: "過去站 B",
            attraction: { name: "過去站 B", tags: ["t"] },
            isPast: true,
            walkInText: "走 5 分鐘左右",
          }),
          makeStop({
            name: "未來站 C",
            attraction: { name: "未來站 C", tags: ["t"] },
            isPast: false,
            walkInText: "走 3 分鐘左右",
          }),
        ],
        endText: "預計約下午 5 點結束",
      };
      render(
        <Timeline displaySchedule={mixedSchedule} originalRequest={originalRequest} />
      );

      const pastBtnA = screen.getByRole("button", { name: /過去站 A/ });
      const pastBtnB = screen.getByRole("button", { name: /過去站 B/ });
      const upcomingBtnC = screen.getByRole("button", { name: /未來站 C/ });
      expect(pastBtnA.className).toMatch(/\bopacity-60\b/);
      expect(pastBtnB.className).toMatch(/\bopacity-60\b/);
      expect(upcomingBtnC.className).not.toMatch(/\bopacity-60\b/);

      const walkBeforeB = screen.getByText("走 5 分鐘左右");
      expect(walkBeforeB.className).toMatch(/\bopacity-60\b/);
      const walkBeforeC = screen.getByText("走 3 分鐘左右");
      expect(walkBeforeC.className).not.toMatch(/\bopacity-60\b/);
    });

    it("confirming a recalibration closes the picker and re-renders 爐鍋咖啡 as a past (dimmed) stop", () => {
      const distinctNamePool = [
        mkAttr("a", "原本第一站"),
        mkAttr("b", "新版站 X"),
        mkAttr("c", "新版站 Y"),
        mkAttr("d", "新版站 Z"),
      ];
      const scheduleWithIdA = {
        ...mockSchedule,
        stops: mockSchedule.stops.map((s, i) => ({
          ...s,
          attraction: { ...s.attraction, id: i === 0 ? "a" : `untouched-${i}` },
        })),
      };
      const requestWithDistinctPool = {
        ...originalRequest,
        pool: distinctNamePool,
      };

      render(
        <Timeline
          displaySchedule={scheduleWithIdA}
          originalRequest={requestWithDistinctPool}
        />
      );

      const beforeBtn = screen.getByRole("button", { name: /爐鍋咖啡/ });
      expect(beforeBtn.className).not.toMatch(/\bopacity-60\b/);

      fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
      fireEvent.click(screen.getAllByRole("radio")[0]);
      fireEvent.click(screen.getByRole("button", { name: "確認" }));

      expect(screen.queryByText("我剛剛離開哪一站?")).not.toBeInTheDocument();
      const afterBtn = screen.getByRole("button", { name: /爐鍋咖啡/ });
      expect(afterBtn.className).toMatch(/\bopacity-60\b/);
      expect(screen.getByText("已造訪")).toBeInTheDocument();
    });
  });
});
