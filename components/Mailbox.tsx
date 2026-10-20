"use client";

// 마이 랜드 우체통 (손그림 선, SVG라 어떤 화면에서도 선명). 누르면 오늘의 쪽지를 다시 열어요.
// hasNote: 접어 둔 쪽지가 들어 있으면 빨간 깃발이 올라가 살랑여요.
export function Mailbox({
  hasNote,
  onOpen,
  className = "",
  style,
}: {
  hasNote: boolean;
  onOpen: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ink = "#4A3B33";
  return (
    <button
      id="myland-mailbox"
      type="button"
      onClick={onOpen}
      onDoubleClick={(event) => event.stopPropagation()}
      aria-label={hasNote ? "우체통 (오늘의 쪽지가 있어요)" : "우체통 (오늘의 쪽지 보기)"}
      className={`group pointer-events-auto absolute -translate-x-1/2 -translate-y-full cursor-pointer border-0 bg-transparent p-0 transition-transform duration-300 hover:-translate-y-[102%] ${className}`}
      style={style}
    >
      <svg viewBox="0 0 132 200" className="h-full w-full overflow-visible" aria-hidden>
        {/* 땅 그림자 */}
        <ellipse cx="64" cy="194" rx="34" ry="5" fill="#8B6F5C" opacity="0.22" />
        {/* 나무 기둥 */}
        <path
          d="M57 98 L56.5 191 Q63 193.5 70.5 191.2 L70 98 Z"
          fill="#B4835C"
          stroke={ink}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path d="M60.5 112 L60 180 M66 120 L66.4 150" stroke="#8E6343" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* 풀 몇 가닥 */}
        <path
          d="M46 192 Q44 182 40 177 M48 192 Q49 181 53 176 M78 191 Q80 182 86 178 M76 192 Q74 184 71 180"
          stroke="#7D9A63"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* 쪽지 (투입구에서 삐죽) */}
        <g transform="rotate(-14 30 40)">
          <rect x="18" y="20" width="30" height="21" rx="1.5" fill="#FFFDF8" stroke={ink} strokeWidth="2" />
          <path d="M23 27 H42 M23 32 H38" stroke="#C9B9AC" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* 몸통 (둥근 지붕) */}
        <path
          d="M18 101 L17.5 58 Q18.5 31 45 30.5 L104 30 Q118 30.5 118.5 46 L119 101 Q70 103 18 101 Z"
          fill="#DD9D99"
          stroke={ink}
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        {/* 지붕 빛 */}
        <path d="M30 44 Q38 37 52 36.5" stroke="#F3C9C5" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* 앞문 (왼쪽 끝) */}
        <path
          d="M12 102 L11.5 60 Q12.5 37 29 36 Q36 37.5 36.5 60 L37 102 Q24 103.5 12 102 Z"
          fill="#E8B0AC"
          stroke={ink}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <circle cx="31" cy="72" r="2.4" fill={ink} />
        {/* 옆면 꽃 */}
        <g transform="translate(78 66)">
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-7.5"
              rx="5"
              ry="7"
              transform={`rotate(${angle})`}
              fill="#F6CFCB"
              stroke="#B7524C"
              strokeWidth="1.6"
            />
          ))}
          <circle r="3.6" fill="#F2C76B" stroke="#B7524C" strokeWidth="1.4" />
          <path d="M0 13 Q-2 22 1 30" stroke="#6F8F58" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
        {/* 아래 테두리 선 */}
        <path d="M37 92 Q78 94 119 92" stroke="#C07F7B" strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {/* 깃발: 쪽지가 있으면 위로 서서 살랑, 없으면 옆으로 눕혀요 */}
        <g
          style={{
            transformOrigin: "112px 78px",
            transformBox: "view-box",
            transform: hasNote ? undefined : "rotate(90deg)",
            transition: "transform 500ms cubic-bezier(0.3, 1.4, 0.5, 1)",
          }}
        >
          <g
            style={{
              transformOrigin: "112px 78px",
              transformBox: "view-box",
              animation: hasNote ? "mailbox-flag 2.4s ease-in-out infinite" : undefined,
            }}
          >
            <path d="M112 79 L112.5 40" stroke={ink} strokeWidth="3" strokeLinecap="round" />
            <path
              d="M112.5 40 L131 43 Q129 49 131.5 55 L112.5 53 Z"
              fill="#D24B3E"
              stroke={ink}
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <circle cx="112" cy="79" r="3" fill="#F4E3D7" stroke={ink} strokeWidth="2" />
          </g>
        </g>
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white/85 px-3 py-1.5 font-jeju-myeongjo text-sm text-[#4A423C] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        오늘의 쪽지
      </span>
    </button>
  );
}
