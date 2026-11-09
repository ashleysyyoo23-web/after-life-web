"use client";

// /ui-kit 에서 눌러 볼 수 있는 예시들 (상태가 필요한 것만 여기에)
import { useState } from "react";
import { Chip, ChipRow } from "@/components/ui/Chip";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { Toast, type ToastTone } from "@/components/ui/Toast";

export function ToastDemo() {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          fullOnMobile
          onClick={() => setToast({ message: "할머니의 Google Drive를 연결했어요.", tone: "info" })}
        >
          일반 알림 띄우기
        </Button>
        <Button
          variant="outline"
          fullOnMobile
          onClick={() => setToast({ message: "Google 연결이 끊어졌어요. 설정에서 다시 연결해 주세요.", tone: "error" })}
        >
          오류 알림 띄우기
        </Button>
      </div>
      <Toast message={toast?.message ?? null} tone={toast?.tone} onClose={() => setToast(null)} />
    </>
  );
}

export function ModalDemo() {
  const [which, setWhich] = useState<"" | "confirm" | "write" | "long">("");
  const close = () => setWhich("");
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" fullOnMobile onClick={() => setWhich("confirm")}>
          확인 창 열기
        </Button>
        <Button variant="outline" fullOnMobile onClick={() => setWhich("write")}>
          글쓰기 창 열기
        </Button>
        <Button variant="outline" fullOnMobile onClick={() => setWhich("long")}>
          긴 내용 창 열기
        </Button>
      </div>

      <Modal
        open={which === "confirm"}
        onClose={close}
        size="sm"
        title="이 사진을 지울까요?"
        description="지운 사진은 추억 모음에서 사라져요. Google Drive의 원래 사진은 그대로 있어요."
        footer={
          <>
            <Button variant="cancel" size="lg" fullOnMobile onClick={close}>
              취소
            </Button>
            <Button variant="brown" size="lg" fullOnMobile onClick={close}>
              지우기
            </Button>
          </>
        }
      />

      <Modal
        open={which === "write"}
        onClose={close}
        closeOnBackdrop={false}
        title="그리운 분께 쪽지 남기기"
        description="창 바깥을 눌러도 닫히지 않아요. 쓰던 글이 사라지지 않게요."
        footer={
          <>
            <Button variant="cancel" size="lg" fullOnMobile onClick={close}>
              취소
            </Button>
            <Button variant="pink" size="lg" fullOnMobile onClick={close}>
              남기기
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="받는 분" placeholder="예: 할머니" />
          <Textarea label="하고 싶은 말" placeholder="하고 싶은 말을 편하게 적어 주세요." hint="나만 볼 수 있어요." />
        </div>
      </Modal>

      <Modal
        open={which === "long"}
        onClose={close}
        size="lg"
        title="추억을 마주하는 방식"
        description="내용이 길면 창 안에서 스크롤돼요."
        footer={
          <Button variant="brown" size="lg" fullOnMobile onClick={close}>
            확인
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <Notice title="천천히 열어 봐요">모든 기록은 처음에 흐리게 보여요. 내가 눌러야 선명해져요.</Notice>
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>
              {i + 1}. 기일이나 생일처럼 의미 있는 날이 다가오면, 그날에 어울리는 사진을 골라 추억 모음으로 보내 드려요.
              보고 싶지 않은 기록은 설정에서 미리 빼 둘 수 있어요.
            </p>
          ))}
        </div>
      </Modal>
    </>
  );
}

const CHIPS = ["전체", "여행", "가족", "친구", "음식", "풍경", "기념일", "일상"];

export function ChipDemo() {
  const [picked, setPicked] = useState("전체");
  return (
    <div className="flex flex-col gap-4">
      <ChipRow label="사진 종류">
        {CHIPS.map((c) => (
          <Chip key={c} selected={picked === c} onClick={() => setPicked(c)}>
            {c}
          </Chip>
        ))}
      </ChipRow>
      <p className="text-etc text-neutral-500">고른 칩: {picked}</p>
      <ChipRow label="못 누르는 칩 예시">
        <Chip disabled>못 누르는 칩</Chip>
      </ChipRow>
    </div>
  );
}

export function InputDemo() {
  const [name, setName] = useState("");
  const tooLong = name.length > 10;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Input label="부르는 이름" placeholder="예: 할머니" hint="섬 팻말에 보여요. 10자까지 쓸 수 있어요." value={name} onChange={(e) => setName(e.target.value)} error={tooLong ? "10자까지 쓸 수 있어요." : undefined} />
      <Input label="앨범 제목" placeholder="예: 제주 여름 여행" defaultValue="" />
      <Input label="잘못 입력한 예시" defaultValue="이름이 너무 길어서 다 보이지 않아요" error="10자까지 쓸 수 있어요." />
      <Input label="못 고치는 칸" defaultValue="example@gmail.com" disabled />
      <div className="sm:col-span-2">
        <Textarea label="그리운 분께 남기는 말" placeholder="하고 싶은 말을 편하게 적어 주세요." hint="나만 볼 수 있어요." />
      </div>
    </div>
  );
}
