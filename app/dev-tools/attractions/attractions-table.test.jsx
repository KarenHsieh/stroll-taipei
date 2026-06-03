import { render, screen, fireEvent, within } from "@testing-library/react";
import AttractionsTable from "./attractions-table.jsx";

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
  { editionId: "fukuoka", id: "tenjin", name: "天神", en: "Tenjin", active: true },
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
  makeAttraction({ id: "tenjin_c", name: "Nintendo 福岡", edition_id: "fukuoka", area_id: "tenjin", area: "天神" }),
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
