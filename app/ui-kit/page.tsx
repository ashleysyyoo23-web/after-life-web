import type { Metadata } from "next";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { WoodPlank } from "@/components/WoodPlank";
import { ChipDemo, InputDemo, ModalDemo, ToastDemo } from "./Demos";

// 공통 UI 컴포넌트 모음 페이지 (개발·디자인 확인용)
// 크롬 F12 → Ctrl+Shift+M 으로 폰 크기에서도 확인해요
export const metadata: Metadata = {
  title: "UI 모음 | After Life",
  robots: { index: false, follow: false },
};

const BUTTONS: { variant: ButtonVariant; name: string; label: string; use: string }[] = [
  { variant: "brown", name: "갈색 채움", label: "저장하기", use: "기본 동작 (저장·확인)" },
  { variant: "pink", name: "분홍 채움", label: "다음 ›", use: "단계를 넘기는 큰 버튼" },
  { variant: "outline", name: "갈색 테두리", label: "‹ 이전", use: "보조 동작 (이전·되돌아가기)" },
  { variant: "cancel", name: "회색 테두리", label: "취소", use: "취소·닫기" },
  { variant: "text", name: "글자만", label: "나중에 할게요", use: "가벼운 선택지" },
  { variant: "accent", name: "강조", label: "섬 열기", use: "한 화면에 하나뿐인 특별한 동작" },
];

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-bg-popup p-5 shadow-sm sm:p-8">
      <h2 className="font-jeju-myeongjo text-body-1 text-text-brown">{title}</h2>
      {desc && <p className="mt-1 text-body-3 text-neutral-500">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function UiKitPage() {
  return (
    <main className="mx-auto w-full max-w-4xl break-keep px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8">
        <p className="font-newsreader text-body-2 text-brown-500">After Life · UI kit</p>
        <h1 className="mt-1 font-jeju-myeongjo text-label-md text-text-brown sm:text-label-lg">공통 컴포넌트 모음</h1>
        <p className="mt-2 text-body-3 text-neutral-500">
          화면 폭이 640px보다 좁으면 폰 모양으로 바뀌어요. 크롬에서 F12 → Ctrl+Shift+M 으로 확인해요.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <Section title="1. 버튼 — 6가지 모양" desc="크기: 보통(14px) · 크게(16px). 누르는 높이는 최소 44px.">
          <ul className="flex flex-col divide-y divide-divider-1">
            {BUTTONS.map((b) => (
              <li key={b.variant} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div className="sm:w-44 sm:shrink-0">
                  <p className="text-body-3 font-semibold text-text-brown">{b.name}</p>
                  <p className="text-etc text-neutral-500">{b.use}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant={b.variant}>{b.label}</Button>
                  <Button variant={b.variant} size="lg">
                    {b.label}
                  </Button>
                  <Button variant={b.variant} disabled>
                    {b.label}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-etc text-neutral-500">각 줄: 보통 · 크게 · 못 누르는 상태</p>
        </Section>

        <Section
          title="2. 폰에서 꽉 채우기"
          desc="fullOnMobile 을 켜면 폰에서는 화면 폭을 꽉 채우고, 노트북에서는 글자 길이만큼만 차지해요."
        >
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" size="lg" fullOnMobile>
              ‹ 이전
            </Button>
            <Button variant="pink" size="lg" fullOnMobile>
              다음 ›
            </Button>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="cancel" size="lg" fullOnMobile>
              취소
            </Button>
            <Button variant="brown" size="lg" fullOnMobile>
              저장하기
            </Button>
          </div>
          <p className="mt-4 text-etc text-neutral-500">
            노트북에서는 주요 버튼이 오른쪽, 폰에서는 주요 버튼(다음 ›, 저장하기)이 위에 오도록 순서를 바꿨어요.
          </p>
        </Section>

        <Section
          title="3. 칩"
          desc="눌러 보세요. 폰에서는 한 줄로 두고 옆으로 밀어서 봐요. 누르는 영역은 높이 44px이에요."
        >
          <ChipDemo />
        </Section>

        <Section
          title="4. 입력칸"
          desc="한 줄 · 여러 줄. 글자 크기는 폰 16px · 노트북 14px. 첫 칸에 10자 넘게 써 보면 오류 문장이 나와요."
        >
          <InputDemo />
        </Section>

        <Section title="5. 안내 상자" desc="일반 · 오류. 제목은 넣어도 되고 빼도 돼요.">
          <div className="flex flex-col gap-3">
            <Notice title="사진은 이렇게 가져와요">
              Google Drive를 읽기만 해요. 사진을 바꾸거나 지우지 않아요.
            </Notice>
            <Notice>내 기록은 나만 볼 수 있어요.</Notice>
            <Notice tone="error" title="저장하지 못했어요">
              잠시 뒤 다시 저장해 주세요.
            </Notice>
            <Notice tone="error">Google 연결이 끊어졌어요. 설정에서 다시 연결해 주세요.</Notice>
          </div>
        </Section>

        <Section
          title="6. 창"
          desc="노트북에서는 가운데 창, 폰에서는 아래에서 올라오는 창이에요. ✕ · Esc · 창 바깥 누르기로 닫혀요."
        >
          <ModalDemo />
        </Section>

        <Section
          title="7. 말풍선"
          desc="꼬리 방향: 아래 · 위 · 없음. 문장이 길면 화면 폭에 맞춰 단어 단위로 줄이 바뀌어요."
        >
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:flex-wrap sm:items-end">
            <SpeechBubble title="나의 섬으로 가요">그리운 분들이 머무는 곳</SpeechBubble>
            <SpeechBubble tail="top" title="추억 보관함으로 가요">
              북마크한 기록이 모여요
            </SpeechBubble>
            <SpeechBubble tail="none" title="꼬리 없는 말풍선" />
            <SpeechBubble title="그리운 분의 캐릭터를 누르면 기록 책장이 열려요. 캐릭터를 끌면 섬 위 자리를 옮길 수 있어요." />
          </div>
        </Section>

        <Section title="8. 잠깐 뜨는 알림" desc="화면 아래 가운데에 떴다가 6초 뒤 저절로 사라져요.">
          <ToastDemo />
        </Section>

        <Section
          title="9. 나무 팻말"
          desc="sm · md(폰용 20px) · lg(노트북 28px) · title(폰은 md, 노트북은 lg로 저절로 바뀜)."
        >
          <div className="flex flex-col items-start gap-6">
            {(["sm", "md", "lg", "title"] as const).map((size) => (
              <div key={size} className="flex flex-col items-start gap-2">
                <p className="text-etc text-neutral-500">{size}</p>
                <WoodPlank size={size}>나의 섬</WoodPlank>
              </div>
            ))}
            <div className="flex w-full flex-col items-start gap-2">
              <p className="text-etc text-neutral-500">title · 아주 긴 이름 (폰에서 넘치면 ‘…’)</p>
              <WoodPlank size="title">사랑하는 우리 할머니와 할아버지가 함께 머무는 섬</WoodPlank>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
