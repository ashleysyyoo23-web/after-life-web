import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

// 개인정보처리방침 (Google OAuth 동의 화면의 "개인정보처리방침 링크"로 쓰는 공개 페이지, 로그인 없이 볼 수 있음)
export const metadata: Metadata = {
  title: "개인정보처리방침 | After Life",
};

const UPDATED = "2026년 10월 6일";
const CONTACT_EMAIL = "ashleyyoo521@gmail.com";

const SECTIONS: Array<{ title: string; body: ReactNode }> = [
  {
    title: "1. 어떤 서비스인가요",
    body: (
      <p>
        After Life(이하 &lsquo;서비스&rsquo;)는 떠나보낸 소중한 사람의 사진과 기록을 유족이 다시 만나고, 함께 기억하는 사람들과 마음을
        나눌 수 있도록 돕는 디지털 추모 서비스예요. 지금은 사용성 테스트를 위한 시험 버전으로 운영하고 있어요.
      </p>
    ),
  },
  {
    title: "2. 받는 정보",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <b>Google 계정 기본 정보</b>: 로그인할 때 이름, 이메일 주소, 프로필 사진을 받아요. 내 기록을 구분하고, 로그인 상태를 유지하는 데에만
          써요.
        </li>
        <li>
          <b>Google Drive 읽기 권한</b>(drive.readonly): 사용자가 직접 연결한 폴더의 사진·동영상 목록과 파일을 <b>읽기만</b> 해요. Drive의
          파일을 고치거나 지우거나 새로 만들지 않아요. 리캡의 사진은 서비스 서버에 따로 복사해 두지 않고, 화면에 보여줄 때마다 Drive에서 바로
          불러와요. 단, 추모 공간 메시지에 사용자가 직접 골라 공유한 사진은 메시지와 함께 보관해요.
        </li>
        <li>
          <b>사용자가 서비스 안에서 남긴 기록</b>: 인물(고인) 정보와 기념일, 앨범·섹션 구성, 사진에 붙인 글과 메모, 그날의 기분 기록, 추모
          공간에 남긴 메시지(닉네임, 글, 펜 그림, 공유한 사진), 좋아요·북마크.
        </li>
        <li>
          <b>사진 분류 결과</b>: 사용자가 &lsquo;AI로 분류하기&rsquo;를 직접 누른 경우에만, 사진의 종류(얼굴·풍경·병원 등) 태그와 짧은 설명을
          저장해요.
        </li>
      </ul>
    ),
  },
  {
    title: "3. 정보를 쓰는 곳",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>고인의 사진으로 리캡(추억 모음)을 만들어 보여주고, 사용자가 정한 열람 방식(흐리게 보기, 보고 싶지 않은 기록 빼기 등)을 지키는 데.</li>
        <li>기일·생일 같은 의미 있는 날짜에 맞춰 추모 공간을 열어 주는 데.</li>
        <li>추모 공간에서 함께 기억하는 사람들이 메시지를 나누는 데.</li>
        <li>광고, 판매, 다른 서비스의 사용자 분석에는 쓰지 않아요.</li>
      </ul>
    ),
  },
  {
    title: "4. 다른 곳에 보내는 정보",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <b>Google Gemini API</b>: &lsquo;AI로 분류하기&rsquo;를 누른 경우에만, 분류할 사진을 작게 줄인 이미지(긴 쪽 384px)와 파일 이름을
          Google에 보내 사진 종류를 받아와요. 분류가 끝나면 줄인 이미지는 서비스에 남기지 않아요.
        </li>
        <li>
          <b>Supabase</b>(데이터베이스·파일 보관), <b>Vercel</b>(웹사이트 운영): 위 2번의 기록을 안전하게 보관하고 서비스를 운영하기 위해
          사용해요.
        </li>
        <li>그 밖의 제3자에게 개인정보를 팔거나 넘기지 않아요.</li>
      </ul>
    ),
  },
  {
    title: "5. Google 사용자 데이터 정책 준수",
    body: (
      <p>
        서비스가 Google API로 받은 정보를 쓰고 다른 곳으로 옮기는 일은{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Google API 서비스 사용자 데이터 정책
        </a>
        (제한적 사용 요건 포함)을 따라요. Google Drive에서 읽은 정보는 사용자에게 서비스를 제공하는 데에만 쓰고, AI 모델 학습에 쓰지 않아요.
      </p>
    ),
  },
  {
    title: "6. 보관 기간과 지우기",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>정보는 사용자가 서비스를 쓰는 동안 보관하고, 지워 달라고 요청하면 지체 없이 지워요.</li>
        <li>
          Google 계정의{" "}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            서드파티 액세스 관리
          </a>
          에서 언제든 서비스의 접근 권한을 직접 끊을 수 있어요.
        </li>
        <li>추모 공간에 남긴 내 메시지는 카드의 삭제 버튼으로 지울 수 있어요.</li>
      </ul>
    ),
  },
  {
    title: "7. 안전하게 지키는 방법",
    body: (
      <p>
        데이터베이스는 서버에서만 접근하도록 막아 두었고(행 단위 보안 적용), 다른 사용자가 내 기록이나 Drive 사진을 볼 수 없도록 요청마다
        로그인과 권한을 확인해요. 추모 공간의 메시지는 그 공간에 들어올 수 있는 사람에게만 보여요.
      </p>
    ),
  },
  {
    title: "8. 문의",
    body: (
      <p>
        개인정보에 대해 궁금한 점이나 열람·정정·삭제 요청은{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
          {CONTACT_EMAIL}
        </a>
        로 보내 주세요.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg-default px-6 py-16 text-[#3F2F24]">
      <article className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <Link href="/" className="font-mulish text-sm text-[#AF9083] hover:opacity-70">
            ← After Life
          </Link>
          <h1 className="font-jeju-myeongjo text-4xl">개인정보처리방침</h1>
          <p className="font-mulish text-sm text-[#898787]">최종 수정일: {UPDATED}</p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-3 font-mulish text-base leading-relaxed">
            <h2 className="font-jeju-myeongjo text-xl">{section.title}</h2>
            {section.body}
          </section>
        ))}
      </article>
    </main>
  );
}
