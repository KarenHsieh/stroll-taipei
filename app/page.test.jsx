import { render, screen, fireEvent } from "@testing-library/react";
import Home from "./page.js";

const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

beforeEach(() => {
  mockPush.mockClear();
  mockSearchParams = new URLSearchParams();
});

describe("Home (input form)", () => {
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
    expect(target.startsWith("/result?")).toBe(true);
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
