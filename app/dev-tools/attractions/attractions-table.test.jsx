import { render, screen, fireEvent, within } from "@testing-library/react";
import AttractionsTable from "./attractions-table.jsx";

let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  usePathname: () => "/dev-tools/attractions",
  useSearchParams: () => mockSearchParams,
}));

beforeEach(() => {
  mockSearchParams = new URLSearchParams();
  window.history.replaceState(null, "", "/dev-tools/attractions");
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
    bboxes: [{ lat: [33.55, 33.62], lng: [130.35, 130.45] }],
    maxWalkMinutes: 15,
    active: true,
  },
];

const areas = [
  { editionId: "taipei", id: "dadaocheng", name: "大稻埕", en: "Dadaocheng", active: true },
  { editionId: "taipei", id: "yongkang", name: "永康街", en: "Yongkang", active: true },
  { editionId: "fukuoka", id: "tenjin-nakasu", name: "天神・中洲", en: "Tenjin-Nakasu", active: true },
  { editionId: "fukuoka", id: "hakata", name: "博多", en: "Hakata", active: true },
];

function makeAttraction(overrides) {
  return {
    id: "x",
    name: "x",
    edition_id: "taipei",
    area_id: "dadaocheng",
    area: "大稻埕",
    tags: ["咖啡廳"],
    stay_range: [30, 60],
    avg_cost: 0,
    indoor: true,
    lat: 25.05,
    lng: 121.5,
    open_hours: [],
    rating: 4,
    best_time_window: ["afternoon"],
    ...overrides,
  };
}

const attractions = [
  makeAttraction({ id: "dadaocheng_a", name: "爐鍋咖啡", edition_id: "taipei", area_id: "dadaocheng", area: "大稻埕" }),
  makeAttraction({ id: "yongkang_b", name: "永康牛肉麵", edition_id: "taipei", area_id: "yongkang", area: "永康街" }),
  makeAttraction({ id: "tenjin-nakasu_c", name: "Nintendo 福岡", edition_id: "fukuoka", area_id: "tenjin-nakasu", area: "天神・中洲" }),
  makeAttraction({ id: "hakata_d", name: "Pokémon Center 福岡", edition_id: "fukuoka", area_id: "hakata", area: "博多" }),
  makeAttraction({ id: "hakata_e", name: "櫛田神社", edition_id: "fukuoka", area_id: "hakata", area: "博多" }),
];

function getDataRows() {
  return screen.getAllByRole("row").filter((row) => row.dataset.attractionId);
}

describe("AttractionsTable — list + filter + search", () => {
  it("renders all attractions by default", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    expect(getDataRows()).toHaveLength(5);
  });

  it("filters by edition only", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    const rows = getDataRows();
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.dataset.editionId === "fukuoka")).toBe(true);
  });

  it("filters by edition + area combined", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area/i), { target: { value: "hakata" } });
    const rows = getDataRows();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.dataset.areaId === "hakata")).toBe(true);
  });

  it("area filter is disabled when edition is '全部'", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    expect(screen.getByLabelText(/area/i)).toBeDisabled();
  });

  it("performs case-insensitive substring matching on name", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    fireEvent.change(screen.getByLabelText(/搜尋/), { target: { value: "nintendo" } });
    const rows = getDataRows();
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText(/Nintendo 福岡/)).toBeInTheDocument();
  });

  it("combines edition + area + name search with AND semantics", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/area/i), { target: { value: "hakata" } });
    fireEvent.change(screen.getByLabelText(/搜尋/), { target: { value: "神社" } });
    const rows = getDataRows();
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText(/櫛田神社/)).toBeInTheDocument();
  });

  it("does not mutate the attractions prop", () => {
    const original = JSON.parse(JSON.stringify(attractions));
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    expect(attractions).toEqual(original);
  });
});

describe("AttractionsTable — URL query persistence", () => {
  it("restores edition + area from ?edition=&area= on mount", () => {
    mockSearchParams = new URLSearchParams("edition=fukuoka&area=hakata");
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    expect(screen.getByLabelText(/edition/i)).toHaveValue("fukuoka");
    expect(screen.getByLabelText(/area/i)).toHaveValue("hakata");
    const rows = getDataRows();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.dataset.areaId === "hakata")).toBe(true);
  });

  it("restores only edition when area query is absent", () => {
    mockSearchParams = new URLSearchParams("edition=fukuoka");
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    expect(screen.getByLabelText(/edition/i)).toHaveValue("fukuoka");
    expect(screen.getByLabelText(/area/i)).toHaveValue("__all__");
  });

  it("ignores an unknown edition value in the URL", () => {
    mockSearchParams = new URLSearchParams("edition=osaka");
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    expect(screen.getByLabelText(/edition/i)).toHaveValue("__all__");
  });

  it("ignores an area that does not belong to the URL edition", () => {
    mockSearchParams = new URLSearchParams("edition=fukuoka&area=yongkang");
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    expect(screen.getByLabelText(/edition/i)).toHaveValue("fukuoka");
    expect(screen.getByLabelText(/area/i)).toHaveValue("__all__");
  });

  it("writes edition + area into the URL when filters change", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    expect(window.location.search).toBe("?edition=fukuoka");
    fireEvent.change(screen.getByLabelText(/area/i), { target: { value: "hakata" } });
    expect(window.location.search).toBe("?edition=fukuoka&area=hakata");
  });

  it("clears the URL when filters are reset to 全部", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "fukuoka" } });
    fireEvent.change(screen.getByLabelText(/edition/i), { target: { value: "__all__" } });
    expect(window.location.search).toBe("");
  });
});

describe("AttractionsTable — per-row edit entry point", () => {
  function findEditControl(row) {
    return within(row).getByRole("link", { name: /^編輯 / });
  }

  it("renders an edit control inside every data row, with href to /dev-tools/attractions/<id>/edit", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    const rows = getDataRows();
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      const id = row.dataset.attractionId;
      const link = findEditControl(row);
      expect(link).toHaveAttribute(
        "href",
        `/dev-tools/attractions/${id}/edit`
      );
    }
  });

  it("uses the attraction name in the accessible label of the edit control", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    const rows = getDataRows();
    const row = rows.find((r) => r.dataset.attractionId === "tenjin-nakasu_c");
    const link = within(row).getByRole("link", { name: "編輯 Nintendo 福岡" });
    expect(link).toBeInTheDocument();
  });

  it("clicking the edit control does not expand the row's JSON disclosure", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    const row = getDataRows().find((r) => r.dataset.attractionId === "dadaocheng_a");
    const link = findEditControl(row);
    fireEvent.click(link);
    // The expanded JSON block has a <pre> showing the attraction object
    expect(screen.queryByText(/"id": "dadaocheng_a"/)).not.toBeInTheDocument();
  });

  it("clicking elsewhere in the row still toggles the JSON disclosure", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    const row = getDataRows().find((r) => r.dataset.attractionId === "dadaocheng_a");
    // click on a non-edit cell, e.g. the name cell
    fireEvent.click(within(row).getByText(/爐鍋咖啡/));
    expect(screen.getByText(/"id": "dadaocheng_a"/)).toBeInTheDocument();
  });

  it("does not render an edit control in the header row", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    const headerRow = screen.getAllByRole("row")[0];
    expect(within(headerRow).queryByRole("link", { name: /^編輯 / })).toBeNull();
  });

  it("does not render an edit control in the empty-state row when filters match nothing", () => {
    render(<AttractionsTable attractions={attractions} editions={editions} areas={areas} />);
    fireEvent.change(screen.getByLabelText(/搜尋/), {
      target: { value: "zzzzzz-no-match" },
    });
    expect(getDataRows()).toHaveLength(0);
    expect(screen.queryByRole("link", { name: /^編輯 / })).toBeNull();
    expect(screen.getByText(/沒有符合條件的景點/)).toBeInTheDocument();
  });
});
