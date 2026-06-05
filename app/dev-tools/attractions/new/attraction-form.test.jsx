import { render, screen, fireEvent, within } from "@testing-library/react";
import AttractionForm from "./attraction-form.jsx";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

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
  { editionId: "fukuoka", id: "tenjin-nakasu", name: "天神・中洲", en: "Tenjin-Nakasu", active: true },
  { editionId: "fukuoka", id: "hakata", name: "博多", en: "Hakata", active: true },
  { editionId: "fukuoka", id: "mojiko", name: "門司港", en: "Mojiko", active: false },
  { editionId: "fukuoka", id: "itoshima", name: "糸島", en: "Itoshima", active: false },
];

function setup(extraProps = {}) {
  return render(
    <AttractionForm
      editions={editions}
      areas={areas}
      existingIds={["tenjin-nakasu_already-exists"]}
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
    expect(values).toEqual(["tenjin-nakasu", "hakata", "mojiko", "itoshima"]);
  });

  it("tag picker shows fukuoka extras and hides taipei-only extras when edition is fukuoka", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "tenjin-nakasu" } });
    expect(screen.getByLabelText(/^商店街$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^屋台$/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^市場$/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^老字號$/)).not.toBeInTheDocument();
  });

  it("derives the id preview from area_id + slugified name in realtime", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Kushida Jinja" } });
    expect(screen.getByTestId("id-preview")).toHaveTextContent("tenjin-nakasu_kushida-jinja");
  });

  it("prompts for manual slug when name is pure CJK (slug becomes empty)", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "櫛田神社" } });
    expect(screen.getByTestId("slug-empty-warning")).toBeInTheDocument();

    const manualSlug = screen.getByLabelText(/manual slug/i);
    fireEvent.change(manualSlug, { target: { value: "kushida-jinja" } });
    expect(screen.getByTestId("id-preview")).toHaveTextContent("tenjin-nakasu_kushida-jinja");
  });

  it("warns specifically when manual slug has uppercase letters and offers a one-click fix", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "警固神社" } });
    const manualSlug = screen.getByLabelText(/manual slug/i);
    fireEvent.change(manualSlug, { target: { value: "Kego-Shrine" } });

    const warning = screen.getByTestId("slug-format-warning");
    expect(warning).toHaveTextContent("含大寫字母");
    expect(screen.getByTestId("slug-suggestion")).toHaveTextContent("kego-shrine");

    fireEvent.click(screen.getByTestId("slug-apply-suggestion"));
    expect(manualSlug).toHaveValue("kego-shrine");
    expect(screen.queryByTestId("slug-format-warning")).not.toBeInTheDocument();
    expect(screen.getByTestId("id-preview")).toHaveTextContent("tenjin-nakasu_kego-shrine");
  });

  it("warns when id collides with an existing attraction", () => {
    setup();
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "tenjin-nakasu" } });
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
    fireEvent.change(screen.getByLabelText(/area_id/i), { target: { value: "tenjin-nakasu" } });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Kushida Jinja" } });

    fireEvent.submit(screen.getByRole("button", { name: /送出/ }).closest("form"));

    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      "/dev-tools/attractions?edition=fukuoka&area=tenjin-nakasu"
    );
  });
});
