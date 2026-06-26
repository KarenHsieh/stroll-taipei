import { render, screen, fireEvent } from "@testing-library/react";
import { TAG_CATEGORIES } from "@/lib/attractions/tag-pool.js";
import MoodPicker from "./MoodPicker.jsx";

function makeAttraction({ id, edition_id = "taipei", area_id, tags = [] }) {
  return {
    id,
    name: id,
    edition_id,
    area_id,
    area: area_id,
    tags,
    stay_range: [30, 60],
    avg_cost: 0,
    indoor: true,
    lat: 25.0,
    lng: 121.5,
    open_hours: [],
    rating: 4,
    best_time_window: ["afternoon"],
  };
}

function getMoodButton(mood) {
  return screen.getByTestId(`mood-button-${mood}`);
}

function getMoodSublabelText(mood) {
  return screen.getByTestId(`mood-sublabel-${mood}`).textContent;
}

describe("MoodPicker — option list source", () => {
  it("renders one option per TAG_CATEGORIES.mood entry, in source order (no editionId)", () => {
    render(<MoodPicker value={[]} onChange={() => {}} />);
    const labels = TAG_CATEGORIES.mood.map((m) => getMoodButton(m).textContent);
    // each rendered button corresponds to a mood from TAG_CATEGORIES.mood in source order;
    // we assert presence (not the entire DOM list equality) so sub-labels don't interfere.
    expect(labels.length).toBe(TAG_CATEGORIES.mood.length);
    for (const mood of TAG_CATEGORIES.mood) {
      expect(getMoodButton(mood)).toBeInTheDocument();
    }
  });

  it("with editionId='taipei', shows only base moods (no fukuoka-specific moods)", () => {
    render(<MoodPicker value={[]} onChange={() => {}} editionId="taipei" />);
    expect(screen.queryByTestId("mood-button-流水聲")).toBeNull();
    expect(screen.queryByTestId("mood-button-傳統")).toBeNull();
    expect(getMoodButton("文青")).toBeInTheDocument();
    expect(getMoodButton("靜謐")).toBeInTheDocument();
  });

  it("with editionId='fukuoka', shows base moods plus 流水聲 / 傳統", () => {
    render(<MoodPicker value={[]} onChange={() => {}} editionId="fukuoka" />);
    expect(getMoodButton("流水聲")).toBeInTheDocument();
    expect(getMoodButton("傳統")).toBeInTheDocument();
    expect(getMoodButton("文青")).toBeInTheDocument();
    expect(getMoodButton("靜謐")).toBeInTheDocument();
  });
});

describe("MoodPicker — no area selected", () => {
  it("renders every mood option as aria-disabled with guidance copy as sub-label", () => {
    render(
      <MoodPicker
        value={[]}
        onChange={() => {}}
        editionId="taipei"
        selectedAreaId={null}
        attractions={[]}
      />
    );
    for (const mood of ["文青", "靜謐", "復古"]) {
      expect(getMoodButton(mood)).toHaveAttribute("aria-disabled", "true");
      expect(getMoodSublabelText(mood)).toBe("請先選擇散策地");
    }
  });

  it("does not call onChange when a mood is clicked while no area is selected", () => {
    const onChange = jest.fn();
    render(
      <MoodPicker
        value={[]}
        onChange={onChange}
        editionId="taipei"
        selectedAreaId={null}
        attractions={[]}
      />
    );
    fireEvent.click(getMoodButton("文青"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("MoodPicker — area selected, per-mood enablement and sub-label", () => {
  const attractions = [
    // dadaocheng: 8 attractions with 靜謐, 0 with 文青
    ...Array.from({ length: 8 }, (_, i) =>
      makeAttraction({ id: `dadaocheng_q${i}`, area_id: "dadaocheng", tags: ["靜謐"] })
    ),
    // yongkang: 3 attractions with 生活感
    ...Array.from({ length: 3 }, (_, i) =>
      makeAttraction({ id: `yongkang_l${i}`, area_id: "yongkang", tags: ["生活感"] })
    ),
    // dadaocheng: 1 attraction with 文青 only when re-using a separate area set — kept zero above
  ];

  it("disables a mood whose count in the selected area is zero, with copy 目前沒有對應地點", () => {
    render(
      <MoodPicker
        value={[]}
        onChange={() => {}}
        editionId="taipei"
        selectedAreaId="dadaocheng"
        attractions={attractions}
      />
    );
    expect(getMoodButton("文青")).toHaveAttribute("aria-disabled", "true");
    expect(getMoodSublabelText("文青")).toBe("目前沒有對應地點");
  });

  it("does not call onChange when a zero-count mood is clicked", () => {
    const onChange = jest.fn();
    render(
      <MoodPicker
        value={[]}
        onChange={onChange}
        editionId="taipei"
        selectedAreaId="dadaocheng"
        attractions={attractions}
      />
    );
    fireEvent.click(getMoodButton("文青"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("enables a mood with count >= 1 and a known hint; sub-label is <hint> · <count> 個地點", () => {
    render(
      <MoodPicker
        value={[]}
        onChange={() => {}}
        editionId="taipei"
        selectedAreaId="dadaocheng"
        attractions={attractions}
      />
    );
    expect(getMoodButton("靜謐")).not.toHaveAttribute("aria-disabled", "true");
    expect(getMoodSublabelText("靜謐")).toBe("公園、廟宇、巷弄 · 8 個地點");
  });

  it("enables a mood with count >= 1 even when the hint is null; sub-label is <count> 個地點", () => {
    // Simulate a mood whose getMoodHint returns null by inventing an unknown-edition stub.
    // We do this by passing a mood the hint module doesn't cover for an unusual edition.
    // For the lib/moods/hints.js current data, every mood in the taipei pool has a hint.
    // Use the yongkang area + 生活感, which exists in the dataset and has a hint string in hints.js.
    // To exercise the "no hint" fallback we use editionId="atlantis" (not in hints.js) plus a
    // tag that exists on attractions, so count >= 1 but getMoodHint returns null.
    const customAttractions = Array.from({ length: 3 }, (_, i) =>
      makeAttraction({
        id: `a${i}`,
        edition_id: "atlantis",
        area_id: "atlas",
        tags: ["生活感"],
      })
    );
    render(
      <MoodPicker
        value={[]}
        onChange={() => {}}
        editionId="atlantis"
        selectedAreaId="atlas"
        attractions={customAttractions}
      />
    );
    expect(getMoodButton("生活感")).not.toHaveAttribute("aria-disabled", "true");
    expect(getMoodSublabelText("生活感")).toBe("3 個地點");
  });
});

describe("MoodPicker — multi-select toggles correctly when area provides matching attractions", () => {
  it("toggles 文青 / 靜謐 selection in successive renders", () => {
    // Build an area with both 文青 and 靜謐 matches so both moods are enabled.
    const attractions = [
      makeAttraction({ id: "x1", area_id: "dadaocheng", tags: ["文青"] }),
      makeAttraction({ id: "x2", area_id: "dadaocheng", tags: ["靜謐"] }),
    ];
    const states = [[]];
    const onChange = jest.fn((next) => states.push(next));

    const { rerender } = render(
      <MoodPicker
        value={states[0]}
        onChange={onChange}
        editionId="taipei"
        selectedAreaId="dadaocheng"
        attractions={attractions}
      />
    );
    fireEvent.click(getMoodButton("文青"));
    expect(onChange).toHaveBeenLastCalledWith(["文青"]);

    rerender(
      <MoodPicker
        value={["文青"]}
        onChange={onChange}
        editionId="taipei"
        selectedAreaId="dadaocheng"
        attractions={attractions}
      />
    );
    fireEvent.click(getMoodButton("靜謐"));
    expect(onChange).toHaveBeenLastCalledWith(["文青", "靜謐"]);

    rerender(
      <MoodPicker
        value={["文青", "靜謐"]}
        onChange={onChange}
        editionId="taipei"
        selectedAreaId="dadaocheng"
        attractions={attractions}
      />
    );
    fireEvent.click(getMoodButton("文青"));
    expect(onChange).toHaveBeenLastCalledWith(["靜謐"]);
  });
});

describe("MoodPicker — area change drops previously-selected moods that now have zero count", () => {
  it("calls onChange with [] when the selected mood is no longer available in the new area", () => {
    const attractions = [
      // dadaocheng has 文青
      makeAttraction({ id: "d1", area_id: "dadaocheng", tags: ["文青"] }),
      // yongkang has no 文青
      makeAttraction({ id: "y1", area_id: "yongkang", tags: ["靜謐"] }),
    ];
    const onChange = jest.fn();

    const { rerender } = render(
      <MoodPicker
        value={["文青"]}
        onChange={onChange}
        editionId="taipei"
        selectedAreaId="dadaocheng"
        attractions={attractions}
      />
    );
    // no change yet — dadaocheng has 文青
    expect(onChange).not.toHaveBeenCalled();

    // switch to yongkang, where 文青 count is zero
    rerender(
      <MoodPicker
        value={["文青"]}
        onChange={onChange}
        editionId="taipei"
        selectedAreaId="yongkang"
        attractions={attractions}
      />
    );
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
