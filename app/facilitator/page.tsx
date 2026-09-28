"use client";

import { EXPOSURE_STEPS, exposureStepIndex } from "@/lib/exposure";
import Link from "next/link";
import { useEffect, useState } from "react";

// 진행자 도구 (사용성 테스트용). 사이트 어디에도 링크가 없고 주소(/facilitator)로만 들어와요.
// 참가자를 바꿀 때: "본 사진 기억"을 지우고 노출 강도를 시작 값으로 되돌려요.

type CharacterStatus = {
  id: string;
  nickname: string;
  emotionLevel: number | null;
  revealedCount: number;
};

type Status = { characters: CharacterStatus[]; revealedTotal: number };

// 캐릭터별 시작 노출 강도는 이 컴퓨터에 기억 (한 번만 정하면 됨)
const BASELINE_KEY = "afterlife:facilitator-baseline";

function readBaseline(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(BASELINE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeBaseline(baseline: Record<string, number>) {
  try {
    window.localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
  } catch {
    // 저장이 안 되는 브라우저면 이번 화면에서만 사용
  }
}

const stepLabel = (level: number | null) => EXPOSURE_STEPS[exposureStepIndex(level)].label;

export default function FacilitatorPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<Record<string, number>>({});
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/facilitator/test-reset", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as (Status & { error?: string }) | null;
        if (!res.ok || !data) throw new Error(res.status === 401 ? "진행자 계정으로 로그인해 주세요." : (data?.error ?? ""));

        // 시작 값을 정한 적 없는 캐릭터는 지금 값으로 채워 둠
        const saved = readBaseline();
        const filled = Object.fromEntries(
          data.characters.map((character) => [character.id, saved[character.id] ?? character.emotionLevel ?? 50]),
        );
        setBaseline(filled);
        setStatus(data);
      } catch (loadError) {
        setError(loadError instanceof Error && loadError.message ? loadError.message : "불러오지 못했어요.");
      }
    })();
  }, []);

  const chooseBaseline = (characterId: string, value: number) => {
    const next = { ...baseline, [characterId]: value };
    setBaseline(next);
    writeBaseline(next);
    setMessage(null);
  };

  const handleReset = async () => {
    setResetting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/facilitator/test-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levels: baseline }),
      });
      const data = (await res.json().catch(() => null)) as
        | (Status & { clearedPhotos: number; resetCharacters: number; error?: string })
        | null;
      if (!res.ok || !data) throw new Error(data?.error ?? "초기화하지 못했어요.");

      setStatus({ characters: data.characters, revealedTotal: data.revealedTotal });
      setMessage(
        `초기화했어요. 본 사진 ${data.clearedPhotos}장을 다시 흐리게, 캐릭터 ${data.resetCharacters}명의 노출 강도를 시작 값으로 되돌렸어요.`,
      );
    } catch (resetError) {
      setMessage(resetError instanceof Error ? resetError.message : "초기화하지 못했어요.");
    } finally {
      setResetting(false);
      setConfirming(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF6F0] px-8 py-12 font-mulish text-[#4A423C]">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs text-[#AF9083]">진행자 도구 · 참가자에게는 보이지 않는 화면이에요</p>
          <h1 className="font-newsreader text-4xl text-black">사용성 테스트 초기화</h1>
          <p className="text-sm text-[#898787]">
            참가자를 바꿀 때 누르세요. &lsquo;눌러서 보기&rsquo;로 본 사진을 모두 다시 흐리게 하고, 캐릭터마다 정한 시작 노출
            강도로 되돌려요. 글·그림·메모·기분 기록은 그대로예요.
          </p>
        </header>

        {error && <p className="text-sm text-[#9E2121]">{error}</p>}
        {!error && !status && <p className="text-sm text-[#898787]">불러오는 중...</p>}

        {status && (
          <>
            <section className="flex flex-col gap-3 rounded-2xl bg-white p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-semibold">캐릭터별 시작 노출 강도</h2>
                <span className="text-xs text-[#898787]">지금 본 사진: 모두 {status.revealedTotal}장</span>
              </div>
              {status.characters.length === 0 && <p className="text-sm text-[#898787]">캐릭터가 없어요.</p>}
              <ul className="flex flex-col divide-y divide-[#F0E8E0]">
                {status.characters.map((character) => (
                  <li key={character.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex min-w-[140px] flex-col">
                      <span className="font-jeju-myeongjo text-lg">{character.nickname}</span>
                      <span className="text-xs text-[#898787]">
                        지금: {stepLabel(character.emotionLevel)} · 본 사진 {character.revealedCount}장
                      </span>
                    </div>
                    <div role="radiogroup" aria-label={`${character.nickname} 시작 노출 강도`} className="flex flex-wrap gap-1.5">
                      {EXPOSURE_STEPS.map((step) => {
                        const selected = exposureStepIndex(baseline[character.id]) === exposureStepIndex(step.value);
                        return (
                          <button
                            key={step.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => chooseBaseline(character.id, step.value)}
                            className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                              selected
                                ? "border-[#AF9083] bg-[#FDD9BD]/50 text-[#4A423C]"
                                : "border-[#E8DDD5] bg-white text-[#898787] hover:border-[#AF9083]"
                            }`}
                          >
                            {step.label}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#898787]">시작 값은 이 컴퓨터에 기억돼요. 한 번 정하면 다음 참가자 때도 그대로예요.</p>
            </section>

            <div className="flex flex-wrap items-center gap-4">
              {!confirming ? (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={resetting}
                  className="cursor-pointer rounded-xl border border-[#B75A34] bg-[#D99B82] px-8 py-3 font-newsreader text-base text-black hover:bg-[#C4836E] hover:text-white"
                >
                  다음 참가자를 위해 초기화
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4">
                  <span className="text-sm">
                    본 사진 {status.revealedTotal}장을 다시 흐리게 하고, 노출 강도를 시작 값으로 되돌릴까요?
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={resetting}
                    className="cursor-pointer rounded-full border border-[#C0BDBD] bg-white px-4 py-1.5 text-sm text-[#666]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReset()}
                    disabled={resetting}
                    className="cursor-pointer rounded-full border-0 bg-[#AF9083] px-4 py-1.5 text-sm text-white hover:bg-[#9a7d71] disabled:opacity-60"
                  >
                    {resetting ? "초기화하는 중..." : "초기화하기"}
                  </button>
                </div>
              )}
              {message && <p role="status" className="text-sm">{message}</p>}
            </div>
          </>
        )}

        <Link href="/myland?from=moodcheck" className="text-sm text-[#AF9083] underline">
          메인 랜드로 가기
        </Link>
      </div>
    </main>
  );
}
