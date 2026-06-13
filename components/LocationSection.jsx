"use client";

const FAILURE_MESSAGE = "無法取得位置，將以一般方式規劃";

export default function LocationSection({ value, onChange }) {
  const status = value?.status ?? "idle";
  const currentLocation = value?.currentLocation ?? null;
  const errorMessage = value?.errorMessage ?? null;

  const handleYes = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onChange({
        status: "yes",
        currentLocation: null,
        errorMessage: FAILURE_MESSAGE,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          status: "yes",
          currentLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          errorMessage: null,
        });
      },
      () => {
        onChange({
          status: "yes",
          currentLocation: null,
          errorMessage: FAILURE_MESSAGE,
        });
      },
      { timeout: 10000 }
    );
  };

  const handleNo = () => {
    onChange({
      status: "no",
      currentLocation: null,
      errorMessage: null,
    });
  };

  const yesSelected = status === "yes";
  const noSelected = status === "no";

  const baseButtonClass =
    "cursor-pointer rounded-full px-5 py-2.5 text-sm leading-[1.2] transition-all duration-200";
  const selectedClass =
    "bg-[var(--color-terracotta)] font-semibold text-[var(--color-cream-card)] shadow-[0_2px_8px_rgba(197,106,58,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]";
  const unselectedClass =
    "bg-[var(--color-cream-card)] font-medium text-[#5a4a38] shadow-[inset_0_0_0_1px_rgba(120,90,60,0.14)]";

  return (
    <div>
      <h2 className="m-0 mb-3 font-[family-name:var(--font-serif-tc)] text-base font-semibold tracking-[0.2px] text-[var(--color-text)]">
        要從目前位置開始規劃嗎？
      </h2>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-pressed={yesSelected}
          onClick={handleYes}
          className={`${baseButtonClass} ${yesSelected ? selectedClass : unselectedClass}`}
        >
          是
        </button>
        <button
          type="button"
          aria-pressed={noSelected}
          onClick={handleNo}
          className={`${baseButtonClass} ${noSelected ? selectedClass : unselectedClass}`}
        >
          否
        </button>
        {yesSelected && currentLocation && (
          <span className="ml-1 font-[family-name:var(--font-sans-tc)] text-xs text-[var(--color-text-muted)]">
            已取得位置 ✓
          </span>
        )}
        {yesSelected && !currentLocation && errorMessage && (
          <span className="ml-1 font-[family-name:var(--font-sans-tc)] text-xs text-[var(--color-text-muted)]">
            {errorMessage}
          </span>
        )}
      </div>
    </div>
  );
}
