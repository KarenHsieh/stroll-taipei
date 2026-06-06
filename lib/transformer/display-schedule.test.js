import { toDisplaySchedule } from "./display-schedule.js";

const TODAY = new Date("2026-05-17T14:00:00+08:00");

function mockInternal() {
  return {
    stops: [
      {
        attraction: {
          name: "爐鍋咖啡",
          tags: ["咖啡廳", "老屋", "巷弄"],
          stay_range: [60, 90],
          avg_cost: 250,
          indoor: true,
          open_hours: [
            { day: "sun", open: "10:00", close: "20:00" },
            { day: "mon", open: "11:00", close: "20:00" },
          ],
        },
        arriveAt: new Date("2026-05-17T14:00:00+08:00"),
        leaveAt: new Date("2026-05-17T15:00:00+08:00"),
        walkInMinutes: 0,
        isOpenEnded: false,
      },
      {
        attraction: {
          name: "大稻埕碼頭",
          tags: ["河岸", "靜謐", "打卡"],
          stay_range: [30, 60],
          avg_cost: 0,
          indoor: false,
          open_hours: [],
        },
        arriveAt: new Date("2026-05-17T15:05:00+08:00"),
        leaveAt: new Date("2026-05-17T17:41:00+08:00"),
        walkInMinutes: 5,
        isOpenEnded: true,
      },
    ],
  };
}

describe("toDisplaySchedule", () => {
  it("populates areaTitle, transforms each stop with new fields, marks last as open-ended, formats endText", () => {
    const internal = mockInternal();
    const result = toDisplaySchedule(
      internal,
      "大稻埕",
      TODAY,
      "TWD",
      "Asia/Taipei"
    );

    expect(result.areaTitle).toBe("大稻埕散策");
    expect(result.stops).toHaveLength(2);

    expect(result.stops[0]).toEqual({
      name: "爐鍋咖啡",
      tags: ["咖啡廳", "老屋", "巷弄"],
      timeText: "下午 2 點",
      stayText: "約 1 到 1.5 小時",
      walkInText: "",
      isOpenEnded: false,
      attraction: internal.stops[0].attraction,
      costText: "約 NT$250",
      todayOpenHoursText: "10:00～20:00",
      indoor: true,
      isPast: false,
    });

    expect(result.stops[1]).toEqual({
      name: "大稻埕碼頭",
      tags: ["河岸", "靜謐", "打卡"],
      timeText: "約下午 3 點",
      stayText: "約 30 分鐘到 1 小時",
      walkInText: "走 5 分鐘左右",
      isOpenEnded: true,
      attraction: internal.stops[1].attraction,
      costText: "免費",
      todayOpenHoursText: "今日公休",
      indoor: false,
      isPast: false,
    });

    expect(result.endText).toBe("預計約下午 5 點半結束");
  });

  it("returns endText=null and stops=[] for empty schedule, but keeps areaTitle", () => {
    const result = toDisplaySchedule(
      { stops: [] },
      "信義",
      TODAY,
      "TWD",
      "Asia/Taipei"
    );
    expect(result).toEqual({
      areaTitle: "信義散策",
      stops: [],
      endText: null,
    });
  });

  it("carries the full original attraction object on each stop (reference equality)", () => {
    const internal = mockInternal();
    const result = toDisplaySchedule(
      internal,
      "大稻埕",
      TODAY,
      "TWD",
      "Asia/Taipei"
    );
    expect(result.stops[0].attraction).toBe(internal.stops[0].attraction);
    expect(result.stops[1].attraction).toBe(internal.stops[1].attraction);
  });

  describe("renders timeText in the supplied timeZone", () => {
    // UTC instant 2026-06-06T05:00:00Z is Asia/Taipei Sat 13:00 and Asia/Tokyo Sat 14:00.
    function singleStopInternal(arriveAt, leaveAt) {
      return {
        stops: [
          {
            attraction: {
              name: "stop",
              tags: ["熱鬧"],
              stay_range: [60, 60],
              avg_cost: 800,
              indoor: true,
              open_hours: [{ day: "sat", open: "13:00", close: "15:00" }],
            },
            arriveAt,
            leaveAt,
            walkInMinutes: 0,
            isOpenEnded: true,
          },
        ],
      };
    }

    it("Asia/Taipei renders the same UTC instant as 下午 1 點", () => {
      const arrive = new Date("2026-06-06T05:00:00Z");
      const leave = new Date("2026-06-06T06:00:00Z");
      const result = toDisplaySchedule(
        singleStopInternal(arrive, leave),
        "大稻埕",
        arrive,
        "TWD",
        "Asia/Taipei"
      );
      expect(result.stops[0].timeText).toBe("下午 1 點");
      expect(result.endText).toBe("預計下午 2 點結束");
    });

    it("Asia/Tokyo renders the same UTC instant as 下午 2 點", () => {
      const arrive = new Date("2026-06-06T05:00:00Z");
      const leave = new Date("2026-06-06T06:00:00Z");
      const result = toDisplaySchedule(
        singleStopInternal(arrive, leave),
        "天神",
        arrive,
        "JPY",
        "Asia/Tokyo"
      );
      expect(result.stops[0].timeText).toBe("下午 2 點");
      expect(result.endText).toBe("預計下午 3 點結束");
    });
  });
});
