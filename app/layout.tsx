import type { Metadata } from "next";
import { Gowun_Batang, Mulish, Nanum_Pen_Script, Newsreader } from "next/font/google";
import { GlobalClickSound } from "@/app/components/GlobalClickSound";
import { SessionProvider } from "@/components/providers/session-provider";
import { PetModeProvider } from "@/components/providers/pet-mode-provider";
import { PET_MODE_HEADER } from "@/lib/pet-mode";
import { headers } from "next/headers";
import "./globals.css";

const newsreader = Newsreader({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-newsreader",
});

const mulish = Mulish({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mulish",
});

// 손글씨 (리캡 책 넘기기 화면의 사진 글)
const handwriting = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwriting",
});

// 한글 명조 (섬 팻말·섬지기 말풍선·제목 등, 클래스 이름은 font-jeju-myeongjo 그대로)
// 예전 제주명조는 Google 시험용 주소에서 불러왔는데 그 파일이 없어져서, 우리 사이트에서 직접 내려주는 고운바탕으로 바꿨어요.
const myeongjo = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-myeongjo",
});

export const metadata: Metadata = {
  title: "After Life",
  description: "소중한 분의 기억을 다시 만나는 곳",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 반려동물 흐름(휴대폰)인지: proxy.ts 가 요청마다 정해서 머리글로 넘겨 줘요
  const petMode = (await headers()).get(PET_MODE_HEADER) === "1";

  return (
    <html
      lang="ko"
      className={`${newsreader.variable} ${mulish.variable} ${handwriting.variable} ${myeongjo.variable} h-full antialiased`}
    >
      <body className={`${mulish.className} min-h-full flex flex-col`}>
        <GlobalClickSound />
        <PetModeProvider petMode={petMode}>
          <SessionProvider>{children}</SessionProvider>
        </PetModeProvider>
      </body>
    </html>
  );
}
