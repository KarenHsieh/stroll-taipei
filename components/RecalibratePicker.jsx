"use client";

import { useEffect, useState } from "react";

export default function RecalibratePicker({ stops, onCancel, onConfirm }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  const confirmDisabled = selectedIndex === null;

  return (
    <>
      <div
        onClick={onCancel}
        className="fixed inset-0 z-40 bg-black/40"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl rounded-t-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-zinc-800">我剛剛離開哪一站?</h2>
        <ul className="mt-4 space-y-1">
          {stops.map((stop, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-zinc-50">
                <input
                  type="radio"
                  name="recalibrate-stop"
                  value={i}
                  checked={selectedIndex === i}
                  onChange={() => setSelectedIndex(i)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-zinc-700">
                  <span className="text-zinc-500">{stop.timeText}</span>{" "}
                  <span className="font-medium">{stop.name}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={() => onConfirm(selectedIndex)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            確認
          </button>
        </div>
      </div>
    </>
  );
}
