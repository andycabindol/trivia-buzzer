"use client";

type Props = {
  disabled?: boolean;
  locked?: boolean;
  onClick: () => void;
};

export function BuzzerButton({ disabled = false, locked = false, onClick }: Props) {
  const label = locked ? "Locked" : "Buzz";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={`buzzer-unit group ${disabled && !locked ? "buzzer-unit--inactive" : ""} ${
        locked ? "buzzer-unit--locked" : ""
      }`}
    >
      <span className="buzzer-ring" aria-hidden />
      <span className="buzzer-dome" aria-hidden>
        <span className="buzzer-gloss" />
        <span className="buzzer-label">{label}</span>
      </span>
    </button>
  );
}
