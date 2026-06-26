import { render, screen, fireEvent, within } from "@testing-library/react";
import AttractionForm from "./attraction-form.jsx";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Override one mood (fukuoka.傳統) to return null so the "falls back to no sub-label"
// scenario has a concrete null-hint case to assert. All other (edition, mood) pairs
// delegate to the real lib/moods/hints.js so positive-case tests stay grounded in
// production data.
jest.mock("@/lib/moods/hints.js", () => {
  const actual = jest.requireActual("@/lib/moods/hints.js");
  return {
    ...actual,
    getMoodHint: (edition, mood) => {
      if (edition === "fukuoka" && mood === "傳統") return null;
      return actual.getMoodHint(edition, mood);
    },
  };
});

beforeEach(() => {
  mockPush.mockClear();
});

const editions = [
  {
    id: "taipei",
    name: "台北",
    en: "Taipei",
    currency: "TWD",
    bboxes: [{ lat: [24.9, 25.3], lng: [121.4, 121.7] }],
    maxWalkMinutes: 15,
    active: true,
  },
  {
    id: "fukuoka",
    name: "福岡",
    en: "Fukuoka",
    currency: "JPY",
    bboxes: [
      { lat: [33.55, 33.62], lng: [130.35, 130.45] },
      { lat: [33.5, 33.62], lng: [130.08, 130.32] },
      { lat: [33.93, 33.97], lng: [130.94, 130.98] },
    ],
    maxWalkMinutes: 15,
    active: true,
  },
];

const areas = [
  { editionId: "taipei", id: "dadaocheng", name: "大稻埕", en: "Dadaocheng", active: true },
  { editionId: "taipei", id: "ximen", name: "西門", en: "Ximen", active: true },
  { editionId: "fukuoka", id: "hakata-tenjin-nakasu", name: "博多・天神・中洲", en: "Hakata-Tenjin-Nakasu", active: true },
  { editionId: "fukuoka", id: "mojiko", name: "門司港", en: "Mojiko", active: false },
  { editionId: "fukuoka", id: "itoshima", name: "糸島", en: "Itoshima", active: false },
];

const editFixture = {
  id: "dadaocheng_lu-guo-coffee",
  name: "鹿戈咖啡",
  edition_id: "taipei",
  area_id: "dadaocheng",
  area: "大稻埕",
  tags: ["咖啡廳"],
  stay_range: [60, 90],
  avg_cost: 250,
  indoor: true,
  lat: 25.0567,
  lng: 121.5101,
  open_hours: [
    { day: "mon", open: "11:00", close: "20:00" },
    { day: "tue", open: "11:00", close: "20:00" },
    { day: "wed", open: "11:00", close: "20:00" },
    { day: "thu", open: "11:00", close: "20:00" },
    { day: "fri", open: "11:00", close: "20:00" },
    { day: "sat", open: "11:00", close: "20:00" },
    { day: "sun", open: "11:00", close: "20:00" },
  ],
  rating: 4.3,
  best_time_window: ["afternoon"],
};

function setup(extraProps = {}) {
  return render(
    <AttractionForm
      editions={editions}
      areas={areas}
      existingIds={["hakata-tenjin-nakasu_already-exists"]}
      {...extraProps}
    />
  );
}

describe("AttractionForm — schema-aware new-attraction form", () => {
  it("filters area options by selected edition", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    const areaSelect = screen.getByLabelText(/area_id/i);
    const options = within(areaSelect).getAllByRole("option");
    const values = options.map((o) => o.value).filter((v) => v);
    expect(values).toEqual(["hakata-tenjin-nakasu", "mojiko", "itoshima"]);
  });

  it("tag picker shows fukuoka extras and hides taipei-only extras when edition is fukuoka", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    expect(screen.getByLabelText(/^商店街$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^屋台$/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^市場$/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^老字號$/)).not.toBeInTheDocument();
  });

  it("marks the mood category with a 「搜尋會用到」 badge so the editor knows which tags drive search", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    const badge = screen.getByTestId("mood-search-badge");
    expect(badge).toHaveTextContent("搜尋會用到");
    // the badge sits inside the mood category row, not in flow / activity / special
    expect(screen.getByTestId("tag-category-mood")).toContainElement(badge);
    expect(screen.getByTestId("tag-category-flow")).not.toContainElement(badge);
  });

  it("visually de-emphasizes non-mood categories (opacity-70) while keeping mood at full opacity", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    expect(screen.getByTestId("tag-category-flow")).toHaveClass("opacity-70");
    expect(screen.getByTestId("tag-category-activity")).toHaveClass("opacity-70");
    expect(screen.getByTestId("tag-category-special")).toHaveClass("opacity-70");
    expect(screen.getByTestId("tag-category-mood")).not.toHaveClass("opacity-70");
  });

  it("mood category renders an informational hint sub-label next to each mood option (taipei)", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "taipei" } });
    expect(screen.getByTestId("mood-hint-文青")).toHaveTextContent(
      "咖啡店、書店、選物店"
    );
    expect(screen.getByTestId("mood-hint-復古")).toHaveTextContent(
      "老建築、老字號、市場"
    );
    expect(screen.getByTestId("mood-hint-靜謐")).toHaveTextContent(
      "公園、廟宇、巷弄"
    );
  });

  it("toggling a mood checkbox with a hint still updates form state the same way (sub-label is informational only)", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "taipei" } });
    const wenqingCheckbox = screen.getByLabelText("文青");
    expect(wenqingCheckbox.checked).toBe(false);
    fireEvent.click(wenqingCheckbox);
    expect(wenqingCheckbox.checked).toBe(true);
    // hint sub-label still present, untouched by the toggle
    expect(screen.getByTestId("mood-hint-文青")).toHaveTextContent(
      "咖啡店、書店、選物店"
    );
  });

  it("mood category falls back to no sub-label when getMoodHint returns null (fukuoka.傳統 stub)", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    // 傳統 exists in the fukuoka mood pool, and the test mock above forces its hint to null.
    expect(screen.queryByTestId("mood-hint-傳統")).toBeNull();
    // The 傳統 checkbox is still present and toggleable — only the sub-label is missing.
    const chuanton = screen.getByLabelText("傳統");
    expect(chuanton.checked).toBe(false);
    fireEvent.click(chuanton);
    expect(chuanton.checked).toBe(true);
  });

  it("derives the id preview from area_id + slugified name in realtime", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Kushida Jinja" } });
    expect(screen.getByTestId("id-preview")).toHaveTextContent("hakata-tenjin-nakasu_kushida-jinja");
  });

  it("prompts for manual slug when name is pure CJK (slug becomes empty)", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "櫛田神社" } });
    expect(screen.getByTestId("slug-empty-warning")).toBeInTheDocument();

    const manualSlug = screen.getByLabelText(/manual slug/i);
    fireEvent.change(manualSlug, { target: { value: "kushida-jinja" } });
    expect(screen.getByTestId("id-preview")).toHaveTextContent("hakata-tenjin-nakasu_kushida-jinja");
  });

  it("warns specifically when manual slug has uppercase letters and offers a one-click fix", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "警固神社" } });
    const manualSlug = screen.getByLabelText(/manual slug/i);
    fireEvent.change(manualSlug, { target: { value: "Kego-Shrine" } });

    const warning = screen.getByTestId("slug-format-warning");
    expect(warning).toHaveTextContent("含大寫字母");
    expect(screen.getByTestId("slug-suggestion")).toHaveTextContent("kego-shrine");

    fireEvent.click(screen.getByTestId("slug-apply-suggestion"));
    expect(manualSlug).toHaveValue("kego-shrine");
    expect(screen.queryByTestId("slug-format-warning")).not.toBeInTheDocument();
    expect(screen.getByTestId("id-preview")).toHaveTextContent("hakata-tenjin-nakasu_kego-shrine");
  });

  it("warns when id collides with an existing attraction", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Already Exists" } });
    expect(screen.getByTestId("id-collision-warning")).toBeInTheDocument();
  });

  it("shows ✓ for lat/lng inside a fukuoka bbox and ✗ for a gap point — but submit stays enabled", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/^lat$/i), { target: { value: "33.59" } });
    fireEvent.change(screen.getByLabelText(/^lng$/i), { target: { value: "130.40" } });
    expect(screen.getByTestId("coord-status")).toHaveTextContent("✓");

    fireEvent.change(screen.getByLabelText(/^lng$/i), { target: { value: "130.60" } });
    expect(screen.getByTestId("coord-status")).toHaveTextContent("✗");

    expect(screen.getByRole("button", { name: /送出/ })).not.toBeDisabled();
  });

  it("'24h 營業' quick action fills all 7 days with 00:00-23:59", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /24h 營業/ }));
    for (const day of ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]) {
      expect(screen.getByLabelText(new RegExp(`${day} open`, "i"))).toHaveValue("00:00");
      expect(screen.getByLabelText(new RegExp(`${day} close`, "i"))).toHaveValue("23:59");
    }
  });

  it("warns inline when close <= open for a day", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/mon open/i), { target: { value: "12:00" } });
    fireEvent.change(screen.getByLabelText(/mon close/i), { target: { value: "10:00" } });
    expect(screen.getByTestId("open-hours-warning-mon")).toBeInTheDocument();
  });

  it("on successful submit, redirects back to the list with edition + area in the URL", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;

    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Kushida Jinja" } });

    fireEvent.submit(screen.getByRole("button", { name: /送出/ }).closest("form"));

    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      "/dev-tools/attractions?edition=fukuoka&area=hakata-tenjin-nakasu"
    );
  });

  it("create mode (no mode prop) submits via POST to /api/dev-tools/attractions", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;

    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "hakata-tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Kushida Jinja" } });
    fireEvent.submit(screen.getByRole("button", { name: /送出/ }).closest("form"));
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/dev-tools/attractions");
    expect(init.method).toBe("POST");
  });

});

describe("AttractionForm — edit mode", () => {
  function setupEdit(extraProps = {}) {
    return render(
      <AttractionForm
        editions={editions}
        areas={areas}
        existingIds={[editFixture.id]}
        mode="edit"
        initialAttraction={editFixture}
        {...extraProps}
      />
    );
  }

  it("prefills all 11 fields from initialAttraction on first mount", () => {
    setupEdit();
    expect(screen.getByLabelText(/edition/i)).toHaveValue("taipei");
    expect(screen.getByLabelText(/area_id/i)).toHaveValue("dadaocheng");
    expect(screen.getByLabelText(/^name$/i)).toHaveValue("鹿戈咖啡");
    expect(screen.getByLabelText(/^lat$/i)).toHaveValue(25.0567);
    expect(screen.getByLabelText(/^lng$/i)).toHaveValue(121.5101);
    expect(screen.getByLabelText(/stay min/i)).toHaveValue(60);
    expect(screen.getByLabelText(/stay max/i)).toHaveValue(90);
    expect(screen.getByLabelText(/avg_cost/i)).toHaveValue(250);
    expect(screen.getByLabelText(/rating/i)).toHaveValue(4.3);
    expect(screen.getByLabelText(/^咖啡廳$/)).toBeChecked();
    expect(screen.getByLabelText(/^afternoon$/)).toBeChecked();
    expect(screen.getByLabelText(/mon open/i)).toHaveValue("11:00");
    expect(screen.getByLabelText(/mon close/i)).toHaveValue("20:00");
  });

  it("renders id as a read-only fixed display with helper text 'id 建立後就固定了'", () => {
    setupEdit();
    const idDisplay = screen.getByTestId("id-preview");
    expect(idDisplay).toHaveTextContent("dadaocheng_lu-guo-coffee");
    expect(screen.queryByLabelText(/manual slug/i)).not.toBeInTheDocument();
    expect(screen.getByText(/id 建立後就固定了/)).toBeInTheDocument();
  });

  it.each([
    {
      label: "name changes only",
      changes: { name: "鹿戈咖啡店" },
      expectedIdDisplay: "dadaocheng_lu-guo-coffee",
    },
    {
      label: "area_id changes only",
      changes: { area_id: "ximen" },
      expectedIdDisplay: "dadaocheng_lu-guo-coffee",
    },
    {
      label: "both area_id and name change",
      changes: { area_id: "ximen", name: "Lu Guo Coffee Shop" },
      expectedIdDisplay: "dadaocheng_lu-guo-coffee",
    },
  ])(
    "id display stays fixed at the initial id when $label",
    ({ changes, expectedIdDisplay }) => {
      setupEdit();
      if (changes.area_id) {
        fireEvent.change(screen.getByLabelText(/area_id/i), {
          target: { value: changes.area_id },
        });
      }
      if (changes.name) {
        fireEvent.change(screen.getByLabelText(/^name$/i), {
          target: { value: changes.name },
        });
      }
      expect(screen.getByTestId("id-preview")).toHaveTextContent(
        expectedIdDisplay
      );
    }
  );

  it("submit sends PUT to /api/dev-tools/attractions/<id> with body.id === initialAttraction.id", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;

    setupEdit();
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "ximen" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "鹿戈咖啡店" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /送出/ }).closest("form"));
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `/api/dev-tools/attractions/${editFixture.id}`
    );
    expect(init.method).toBe("PUT");
    const sentBody = JSON.parse(init.body);
    expect(sentBody.id).toBe(editFixture.id);
    expect(sentBody.name).toBe("鹿戈咖啡店");
    expect(sentBody.area_id).toBe("ximen");
  });

  it("does NOT show the manual slug fallback UI even when name becomes empty / CJK only", () => {
    setupEdit();
    fireEvent.change(screen.getByLabelText(/^name$/i), {
      target: { value: "純中文名稱" },
    });
    expect(screen.queryByTestId("slug-empty-warning")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/manual slug/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("id-preview")).toHaveTextContent(
      "dadaocheng_lu-guo-coffee"
    );
  });

});
