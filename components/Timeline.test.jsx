import { fireEvent, render, screen } from "@testing-library/react";
import Timeline from "./Timeline.jsx";

function makeStop(overrides = {}) {
  return {
    name: "stop",
    tags: ["x"],
    timeText: "下午 2 點",
    stayText: "約 1 到 1.5 小時",
    walkInText: "",
    isOpenEnded: false,
    attraction: { name: "stop", tags: ["x"] },
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
      attraction: { name: "爐鍋咖啡", tags: ["咖啡廳"] },
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
      attraction: { name: "小藝埕", tags: ["選物店"] },
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
      attraction: { name: "永樂市場", tags: ["市場"] },
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
