"use client";

// 리캡 사진 모서리의 저장(🔖) 버튼. 누르면 저장소 섬의 그 고인 액자에 모여요.
export function SavePhotoButton({
  saved,
  onToggle,
  size = "md",
  disabled = false,
  className = "",
  style,
}: {
  saved: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const box = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      aria-label={saved ? "저장소에서 빼기" : "저장소에 저장하기"}
      aria-pressed={saved}
      title={saved ? "저장소에 저장됨 (누르면 취소)" : "저장소에 저장하기"}
      className={`flex ${box} cursor-pointer items-center justify-center rounded-full border border-white/70 shadow-[0_2px_6px_rgba(42,37,34,0.25)] transition-colors disabled:cursor-default disabled:opacity-0 ${
        saved ? "bg-[#AF9083] text-white" : "bg-white/85 text-[#AF9083] hover:bg-[#FDD9BD]"
      } ${className}`}
      style={style}
    >
      <svg className={icon} viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z"
        />
      </svg>
    </button>
  );
}
