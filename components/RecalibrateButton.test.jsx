import { fireEvent, render, screen } from "@testing-library/react";
import RecalibrateButton from "./RecalibrateButton.jsx";

const at = (h, m) => {
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return new Date(`2026-05-17T${hh}:${mm}:00+08:00`);
};

// 2026-05-17 = Sunday → 'sun'
const sundayOpenAllDay = [{ day: "sun", open: "10:00", close: "22:00" }];
const mkAttr = (id, name) => ({
  id,
  name,
  area: "大稻埕",
  tags: ["文青"],
  stay_range: [30, 60],
  avg_cost: 100,
  indoor: true,
  open_hours: sundayOpenAllDay,
  lat: 25.05,
  lng: 121.51,
  rating: 4.5,
});

const pool = [mkAttr("a", "A"), mkAttr("b", "B"), mkAttr("c", "C")];

const baseDisplaySchedule = {
  areaTitle: "大稻埕散策",
  stops: [
    {
      name: "A",
      tags: ["t"],
      timeText: "下午 2 點",
      stayText: "x",
      walkInText: "",
      isOpenEnded: false,
      attraction: pool[0],
      costText: "約 NT$100",
      todayOpenHoursText: "11:00～20:00",
      indoor: true,
    },
    {
      name: "B",
      tags: ["t"],
      timeText: "約下午 3 點",
      stayText: "x",
      walkInText: "走 5 分鐘左右",
      isOpenEnded: true,
      attraction: pool[1],
      costText: "約 NT$100",
      todayOpenHoursText: "11:00～20:00",
      indoor: true,
    },
  ],
  endText: "預計約下午 5 點結束",
};

const baseOriginalRequest = {
  area: "大稻埕",
  startAt: at(14, 0),
  durationMinutes: 240,
  moods: ["文青"],
  currency: "TWD",
  pool,
};

const renderButton = (props = {}) =>
  render(
    <RecalibrateButton
      originalStartAt={baseOriginalRequest.startAt}
      originalDurationMinutes={baseOriginalRequest.durationMinutes}
      displaySchedule={baseDisplaySchedule}
      originalRequest={baseOriginalRequest}
      onRecalibrated={() => {}}
      {...props}
    />
  );

describe("RecalibrateButton — state-driven enabled/disabled", () => {
  afterEach(() => jest.useRealTimers());

  it("disabled + 散策還沒開始呢 when now < originalStartAt", () => {
    jest.useFakeTimers();
    jest.setSystemTime(at(13, 30));
    renderButton();
    expect(screen.getByRole("button", { name: /重新校準/ })).toBeDisabled();
    expect(screen.getByText("散策還沒開始呢")).toBeInTheDocument();
  });

  it("disabled + 今日散策已結束 when now >= originalStartAt + duration", () => {
    jest.useFakeTimers();
    jest.setSystemTime(at(18, 30));
    renderButton();
    expect(screen.getByRole("button", { name: /重新校準/ })).toBeDisabled();
    expect(screen.getByText("今日散策已結束")).toBeInTheDocument();
  });

  it("enabled when in_progress (no helper text)", () => {
    jest.useFakeTimers();
    jest.setSystemTime(at(15, 30));
    renderButton();
    expect(screen.getByRole("button", { name: /重新校準/ })).not.toBeDisabled();
    expect(screen.queryByText("散策還沒開始呢")).not.toBeInTheDocument();
    expect(screen.queryByText("今日散策已結束")).not.toBeInTheDocument();
  });
});

describe("RecalibrateButton — picker flow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(at(15, 30));
  });
  afterEach(() => jest.useRealTimers());

  it("clicking the enabled button opens the picker", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("我剛剛離開哪一站?")).toBeInTheDocument();
  });

  it("picker cancel closes the picker", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirm flow calls onRecalibrated with a new display schedule", () => {
    const onRecalibrated = jest.fn();
    renderButton({ onRecalibrated });
    fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByRole("button", { name: "確認" }));
    expect(onRecalibrated).toHaveBeenCalledTimes(1);
    const newSchedule = onRecalibrated.mock.calls[0][0];
    expect(newSchedule).toHaveProperty("areaTitle", "大稻埕散策");
    expect(newSchedule).toHaveProperty("stops");
  });

  it("confirm flow excludes the selected stop's attraction from upcoming stops (it appears only as past)", () => {
    const onRecalibrated = jest.fn();
    renderButton({ onRecalibrated });
    fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
    fireEvent.click(screen.getAllByRole("radio")[0]); // user picks stop A (index 0) — A excluded going forward
    fireEvent.click(screen.getByRole("button", { name: "確認" }));
    expect(onRecalibrated).toHaveBeenCalledTimes(1);
    const newSchedule = onRecalibrated.mock.calls[0][0];
    const upcomingIds = newSchedule.stops.filter((s) => !s.isPast).map((s) => s.attraction.id);
    expect(upcomingIds).not.toContain("a"); // A excluded from upcoming
    expect(upcomingIds.length).toBeGreaterThan(0); // planner returned at least one of b/c
  });

  it("picker closes after confirm", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByRole("button", { name: "確認" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("recalibrate flow completes without error when originalRequest carries a custom maxWalkMinutes", () => {
    const onRecalibrated = jest.fn();
    const customRequest = { ...baseOriginalRequest, maxWalkMinutes: 25 };
    render(
      <RecalibrateButton
        originalStartAt={customRequest.startAt}
        originalDurationMinutes={customRequest.durationMinutes}
        displaySchedule={baseDisplaySchedule}
        originalRequest={customRequest}
        onRecalibrated={onRecalibrated}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByRole("button", { name: "確認" }));
    expect(onRecalibrated).toHaveBeenCalledTimes(1);
    expect(onRecalibrated.mock.calls[0][0]).toHaveProperty("areaTitle");
  });

  it("first recalibration produces a schedule whose first stop is the selected one tagged isPast=true", () => {
    const onRecalibrated = jest.fn();
    renderButton({ onRecalibrated });
    fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
    fireEvent.click(screen.getAllByRole("radio")[0]); // picks A
    fireEvent.click(screen.getByRole("button", { name: "確認" }));
    const newSchedule = onRecalibrated.mock.calls[0][0];
    expect(newSchedule.stops[0].attraction.id).toBe("a");
    expect(newSchedule.stops[0].isPast).toBe(true);
    // any subsequent stops are upcoming (isPast=false)
    for (let i = 1; i < newSchedule.stops.length; i++) {
      expect(newSchedule.stops[i].isPast).toBe(false);
    }
  });

  it("picker on an already-recalibrated schedule lists only upcoming stops (filters out past)", () => {
    // Simulate schedule that already has 1 past stop ("a") and 2 upcoming ("b", "c")
    const partiallyRecalibrated = {
      areaTitle: "大稻埕散策",
      stops: [
        { ...baseDisplaySchedule.stops[0], attraction: pool[0], isPast: true },
        { ...baseDisplaySchedule.stops[1], attraction: pool[1], isPast: false },
        {
          name: "C",
          tags: ["t"],
          timeText: "約下午 4 點",
          stayText: "x",
          walkInText: "走 3 分鐘左右",
          isOpenEnded: true,
          attraction: pool[2],
          costText: "約 NT$100",
          todayOpenHoursText: "11:00～20:00",
          indoor: true,
          isPast: false,
        },
      ],
      endText: "預計約下午 5 點結束",
    };
    render(
      <RecalibrateButton
        originalStartAt={baseOriginalRequest.startAt}
        originalDurationMinutes={baseOriginalRequest.durationMinutes}
        displaySchedule={partiallyRecalibrated}
        originalRequest={baseOriginalRequest}
        onRecalibrated={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2); // only upcoming "b" and "c"
  });

  it("second recalibration accumulates past: result includes both past A and newly-past B as isPast=true; pool excludes both", () => {
    const partiallyRecalibrated = {
      areaTitle: "大稻埕散策",
      stops: [
        { ...baseDisplaySchedule.stops[0], attraction: pool[0], isPast: true },
        { ...baseDisplaySchedule.stops[1], attraction: pool[1], isPast: false },
        {
          name: "C",
          tags: ["t"],
          timeText: "約下午 4 點",
          stayText: "x",
          walkInText: "走 3 分鐘左右",
          isOpenEnded: true,
          attraction: pool[2],
          costText: "約 NT$100",
          todayOpenHoursText: "11:00～20:00",
          indoor: true,
          isPast: false,
        },
      ],
      endText: "預計約下午 5 點結束",
    };
    const onRecalibrated = jest.fn();
    render(
      <RecalibrateButton
        originalStartAt={baseOriginalRequest.startAt}
        originalDurationMinutes={baseOriginalRequest.durationMinutes}
        displaySchedule={partiallyRecalibrated}
        originalRequest={baseOriginalRequest}
        onRecalibrated={onRecalibrated}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /重新校準/ }));
    // picker shows [B, C]. Select B (index 0 in upcoming).
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByRole("button", { name: "確認" }));
    const newSchedule = onRecalibrated.mock.calls[0][0];
    const pastIds = newSchedule.stops.filter((s) => s.isPast).map((s) => s.attraction.id);
    const upcomingIds = newSchedule.stops.filter((s) => !s.isPast).map((s) => s.attraction.id);
    expect(pastIds).toEqual(["a", "b"]); // both A (prior past) and B (newly past)
    expect(upcomingIds).not.toContain("a");
    expect(upcomingIds).not.toContain("b");
  });
});
