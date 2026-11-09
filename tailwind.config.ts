import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary Green
        "green-900": "#45540F",
        "green-700": "#6F822B",
        "green-500": "#9BB073",
        "green-300": "#C4D4A5",
        "green-100": "#E4EACE",
        "green-50": "#F2F5EA",
        // Secondary Pink
        "pink-900": "#9E2121",
        "pink-700": "#B8241E",
        "pink-500": "#D99B82",
        "pink-300": "#FDD9BD",
        "pink-100": "#FBCAC8",
        "pink-50": "#FBE2E1",
        // Neutral Brown
        "brown-50": "#FAF6F0",
        "brown-100": "#E9E0D3",
        "brown-500": "#AF9083",
        "brown-700": "#776257",
        "brown-900": "#4B3F39",
        // Neutral
        "neutral-100": "#E9E6E6",
        "neutral-300": "#C0BDBD",
        "neutral-500": "#898787",
        "neutral-700": "#5B5959",
        // Semantic / Text
        "text-b": "#000000",
        "text-b-li": "#7F7B7B",
        "text-brown": "#4A423C",
        // Background
        "bg-default": "#FAF6F0",
        "bg-popup": "#FFFEFB",
        "bg-blue-1": "#D3EFFF",
        "bg-blue-2": "#F1F7FC",
        // Divider
        "divider-1": "#E9E0D3",
        "divider-2": "#CAB6A9",
        // Brand
        "brand-primary": "#C4D4A5",
        "brand-secondary": "#FDD9BD",
        // 코드에 hex로만 쓰이던 색에 이름 붙이기 (색은 그대로)
        "brown-600": "#9A7D71", // 갈색 버튼 hover
        "pink-600": "#C4836E", // 강조 버튼 hover
        "border-soft": "#E8DDD5", // 연한 테두리
        "border-accent": "#B75A34", // 강조 버튼 테두리
        "error-bg": "#FDF0EA", // 오류 상자 배경
        "error-border": "#E8B4A0", // 오류 상자 테두리
        "text-strong": "#1A1A1A", // 진한 본문 글씨
        "bubble-bg": "#FFFAF6", // 말풍선 배경
        "bubble-border": "#5A3A30", // 말풍선 테두리
      },
      fontFamily: {
        newsreader: ["var(--font-newsreader)", "serif"],
        mulish: ["var(--font-mulish)", "sans-serif"],
        // 이름은 예전 그대로, 실제 글꼴은 고운바탕 (app/layout.tsx)
        "jeju-myeongjo": ["var(--font-myeongjo)", "serif"],
        handwriting: ["var(--font-handwriting)", "cursive"],
      },
      fontSize: {
        "headline-1": ["68px", { lineHeight: "auto" }],
        "headline-2": ["50px", { lineHeight: "auto" }],
        "headline-m": ["40px", { lineHeight: "auto" }],
        subtitle: ["32px", { lineHeight: "auto" }],
        "label-lg": ["28px", { lineHeight: "auto" }],
        "label-md": ["24px", { lineHeight: "auto" }],
        "label-sm": ["22px", { lineHeight: "auto" }],
        "body-1": ["20px", { lineHeight: "auto" }],
        "body-2": ["16px", { lineHeight: "auto" }],
        "body-3": ["14px", { lineHeight: "auto" }],
        etc: ["12px", { lineHeight: "20px" }],
        caption: ["10px", { lineHeight: "auto" }],
      },
    },
  },
  plugins: [],
};

export default config;
