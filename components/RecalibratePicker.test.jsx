import { fireEvent, render, screen } from "@testing-library/react";
import RecalibratePicker from "./RecalibratePicker.jsx";

const stops = [
  { name: "爐鍋咖啡", timeText: "下午 2 點" },
  { name: "小藝埕", timeText: "約下午 3 點" },
  { name: "永樂市場", timeText: "約下午 4 點" },
];

describe("RecalibratePicker", () => {
  it("renders heading 「我剛剛離開哪一站?」 and N radio options", () => {
    render(<RecalibratePicker stops={stops} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText("我剛剛離開哪一站?")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByText("爐鍋咖啡")).toBeInTheDocument();
    expect(screen.getByText("小藝埕")).toBeInTheDocument();
    expect(screen.getByText("永樂市場")).toBeInTheDocument();
  });

  it("confirm button is disabled until a stop is selected", () => {
    render(<RecalibratePicker stops={stops} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole("button", { name: "確認" })).toBeDisabled();
  });

  it("confirm button becomes enabled after selecting a stop", () => {
    render(<RecalibratePicker stops={stops} onCancel={() => {}} onConfirm={() => {}} />);
    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(screen.getByRole("button", { name: "確認" })).not.toBeDisabled();
  });

  it("invokes onConfirm with the selected index when confirm is clicked", () => {
    const onConfirm = jest.fn();
    render(<RecalibratePicker stops={stops} onCancel={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getAllByRole("radio")[2]);
    fireEvent.click(screen.getByRole("button", { name: "確認" }));
    expect(onConfirm).toHaveBeenCalledWith(2);
  });

  it("invokes onCancel (not onConfirm) on backdrop click, Esc, and cancel button", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const { container } = render(
      <RecalibratePicker stops={stops} onCancel={onCancel} onConfirm={onConfirm} />
    );

    // backdrop click
    fireEvent.click(container.querySelector('[aria-hidden="true"]'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    // Esc key
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(2);

    // cancel button
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(onCancel).toHaveBeenCalledTimes(3);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not invoke onCancel on Esc after unmount (listener cleanup)", () => {
    const onCancel = jest.fn();
    const { unmount } = render(
      <RecalibratePicker stops={stops} onCancel={onCancel} onConfirm={() => {}} />
    );
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
  });
});
