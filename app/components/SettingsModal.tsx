"use client";

import {
  LegacyDatePicker,
  toLegacyDateTimestamp,
} from "@/components/legacy-date-picker";
import Image from "next/image";
import { BookOpen, Play, type LucideIcon } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import { CharacterPartsPicker } from "@/components/CharacterPartsPicker";
import { LegacyMyPhotos } from "@/components/LegacyMyPhotos";
import { CharacterManager } from "@/components/CharacterManager";
import { AccountBox } from "@/components/AccountBox";
import {
  LEGACY_MESSAGE_MAX,
  LEGACY_VIEWER_ID_MAX,
  LEGACY_VIEWER_RELATION_MAX,
  LEGACY_VIEWERS_MAX,
  sanitizeLegacySettings,
  type LegacyRecordType,
  type LegacyViewer,
} from "@/lib/legacy-settings";
import { DEFAULT_APPEARANCE, type CharacterAppearance } from "@/lib/character-parts";
import {
  DEFAULT_RECAP_VIEW,
  DEFAULT_SLIDE_SECONDS,
  SLIDE_SECONDS_MAX,
  SLIDE_SECONDS_MIN,
  sanitizeViewSettings,
  type RecapView,
} from "@/lib/view-settings";
import { useCallback, useEffect, useState } from "react";

const LEGACY_SETTINGS_CALLBACK_URL = "/mainland?settings=legacy";

type SettingId = "view-method" | "profile" | "legacy" | "edit-person";

// 리캡을 열었을 때 처음 보이는 화면
const viewTypeOptions: {
  id: RecapView;
  title: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    id: "slideshow",
    title: "슬라이드쇼",
    description: "정한 시간마다 사진이 한 장씩 넘어가요.",
    Icon: Play,
  },
  {
    id: "book",
    title: "책",
    description: "책장을 넘기듯이 기록을 열어봐요.",
    Icon: BookOpen,
  },
];

const mySettingsItems: {
  id: SettingId;
  icon: string;
  label: string;
}[] = [
  {
    id: "view-method",
    icon: "/icons/settings/view-method-621280.png",
    label: "기록을 마주할 방법",
  },
  {
    id: "profile",
    icon: "/icons/settings/profile-62717c.png",
    label: "나의 프로필",
  },
  {
    id: "legacy",
    icon: "/icons/settings/legacy-257ed5.png",
    label: "내가 남길 기록",
  },
];

const deceasedSettingsItems: {
  id: SettingId;
  icon: string;
  label: string;
}[] = [
  {
    id: "edit-person",
    icon: "/icons/settings/edit-person-673177.png",
    label: "마이랜드의 인물 편집",
  },
];

const sidebarMenuBaseClass =
  "flex w-full cursor-pointer items-center gap-1 rounded-[6px] border-0 px-2 py-[6px] text-left font-mulish text-base leading-[22px] text-[#424242] transition-colors";

const sliderRangeClass =
  "h-[14px] w-full flex-1 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-sm [&::-webkit-slider-runnable-track]:bg-[#E9E0D3] [&::-webkit-slider-thumb]:-mt-[4px] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C4D4A5]";

const legacyRecordTypeOptions: { id: LegacyRecordType; label: string }[] = [
  { id: "daily-face", label: "얼굴이 나온 일상사진" },
  { id: "id-photo", label: "증명사진" },
  { id: "anniversary", label: "기념일에 찍은 사진" },
  { id: "no-face", label: "얼굴이 안 나온 사진" },
  { id: "together-daily", label: "함께 찍은 일상 사진" },
  { id: "video-face", label: "얼굴이 나온 동영상" },
  { id: "video-no-face", label: "얼굴이 안 나온 동영상" },
  { id: "custom", label: "직접 고르고 싶어요" },
];


const legacyViewerCardClass =
  "flex flex-col items-center gap-2 rounded-xl border border-[#E9E0D3] bg-white p-3";

const legacyViewerContextMenuClass =
  "fixed z-[60] min-w-[120px] rounded-lg border border-[#E9E0D3] bg-white p-1 font-mulish text-sm text-[#4A423C] shadow-md";

const legacyChipClass = (selected: boolean) =>
  selected
    ? "flex h-14 items-center justify-center rounded-[7px] border border-[#776257] bg-[#E9E0D3] px-3 font-mulish text-base text-[#4A423C]"
    : "flex h-14 items-center justify-center rounded-[7px] border border-[#C0BDBD] bg-white px-3 font-mulish text-base text-[#898787]";

const legacyActionButtonClass =
  "rounded-lg border border-[#4B3F39] bg-[#776257] px-4 py-[11px] font-mulish text-base text-white transition-colors hover:bg-[#5E4E47]";


type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  openToSetting?: SettingId | null;
};

export function SettingsModal({
  isOpen,
  onClose,
  openToSetting = null,
}: SettingsModalProps) {
  const [selectedSetting, setSelectedSetting] =
    useState<SettingId>("view-method");
  const [sliderValue, setSliderValue] = useState(DEFAULT_SLIDE_SECONDS);
  const [selectedViewType, setSelectedViewType] = useState<RecapView>(DEFAULT_RECAP_VIEW);
  const [viewSettingsLoaded, setViewSettingsLoaded] = useState(false);
  const [viewSaving, setViewSaving] = useState(false);
  const [viewMessage, setViewMessage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileId, setProfileId] = useState("");
  const [profileIntro, setProfileIntro] = useState("");
  // 나의 캐릭터 (고인 캐릭터와 같은 파츠 꾸미기)
  const [myAppearance, setMyAppearance] = useState<CharacterAppearance>(DEFAULT_APPEARANCE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveUserEmail, setDriveUserEmail] = useState("");
  const [driveMessage, setDriveMessage] = useState<string | null>(null);
  // 연결 해제 확인 창 (이 계정을 쓰는 인물 이름들)
  const [disconnectConfirm, setDisconnectConfirm] = useState<{
    connectionId: string;
    driveEmail: string;
    usedBy: string[];
  } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [selectedLegacyRecordTypes, setSelectedLegacyRecordTypes] = useState<
    LegacyRecordType[]
  >([]);
  const [legacyStartDate, setLegacyStartDate] = useState("");
  const [legacyEndDate, setLegacyEndDate] = useState("");
  const [legacyMessage, setLegacyMessage] = useState("");
  const [legacyViewers, setLegacyViewers] =
    useState<LegacyViewer[]>([]);
  // 내가 남길 기록 2~5번 저장 상태
  const [legacyLoaded, setLegacyLoaded] = useState(false);
  const [legacySaving, setLegacySaving] = useState(false);
  const [legacySaveMessage, setLegacySaveMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addViewerUsername, setAddViewerUsername] = useState("");
  const [addViewerRelation, setAddViewerRelation] = useState("");
  const [viewerContextMenu, setViewerContextMenu] = useState<{
    viewerId: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!viewerContextMenu) {
      return;
    }

    const closeViewerContextMenu = () => {
      setViewerContextMenu(null);
    };

    window.addEventListener("mousedown", closeViewerContextMenu);
    return () => {
      window.removeEventListener("mousedown", closeViewerContextMenu);
    };
  }, [viewerContextMenu]);

  const loadDriveConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/deceased-drive/connection", {
        cache: "no-store",
      });

      if (res.status === 401) {
        setDriveConnected(false);
        setDriveUserEmail("");
        return false;
      }

      if (!res.ok) {
        return false;
      }

      const data = (await res.json()) as {
        connected?: boolean;
        driveEmail?: string | null;
      };

      if (data.connected && data.driveEmail) {
        setDriveConnected(true);
        setDriveUserEmail(data.driveEmail);
        return true;
      }

      setDriveConnected(false);
      setDriveUserEmail("");
      return false;
    } catch {
      setDriveConnected(false);
      setDriveUserEmail("");
      return false;
    }
  }, []);

  const getSidebarMenuClass = (id: SettingId) =>
    selectedSetting === id
      ? `${sidebarMenuBaseClass} bg-[#FDD9BD]`
      : `${sidebarMenuBaseClass} bg-transparent hover:bg-[#FBE2E1]`;

  const handleSaveViewMethod = async () => {
    setViewSaving(true);
    setViewMessage(null);

    try {
      const res = await fetch("/api/me/view-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideSeconds: sliderValue, recapView: selectedViewType }),
      });

      if (res.status === 401) {
        void signIn("google");
        return;
      }

      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "저장하지 못했어요.");

      setViewMessage("저장했어요. 다음에 리캡을 열 때부터 적용돼요.");
    } catch (saveError) {
      setViewMessage(saveError instanceof Error ? saveError.message : "저장하지 못했어요.");
    } finally {
      setViewSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profileName,
          handle: profileId,
          intro: profileIntro,
          appearance: myAppearance,
        }),
      });

      if (res.status === 401) {
        void signIn("google");
        return;
      }

      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "프로필을 저장하지 못했어요.");

      setProfileMessage("저장했어요. 메인 랜드에 나의 캐릭터가 나타나요.");
      // 메인 랜드가 열려 있으면 내 캐릭터를 바로 다시 그리게 알림
      window.dispatchEvent(new Event("afterlife:profile-updated"));
    } catch (saveError) {
      setProfileMessage(saveError instanceof Error ? saveError.message : "프로필을 저장하지 못했어요.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleConnectDrive = async () => {
    const session = await getSession();

    if (!session) {
      void signIn("google", { callbackUrl: LEGACY_SETTINGS_CALLBACK_URL });
      return;
    }

    window.location.href = "/api/deceased-drive/auth?returnTo=legacy";
  };

  // 연결 해제 전에 확인: 이 계정을 쓰는 인물들의 사진이 보이지 않게 되므로
  const handleAskDisconnectDrive = async () => {
    setDriveMessage(null);

    try {
      const res = await fetch("/api/deceased-drive/connection", { cache: "no-store" });
      const data = (await res.json()) as {
        connected?: boolean;
        driveEmail?: string | null;
        connectionId?: string;
        usedBy?: string[];
      };

      if (!res.ok || !data.connected || !data.connectionId) {
        setDriveConnected(false);
        setDriveUserEmail("");
        return;
      }

      setDisconnectConfirm({
        connectionId: data.connectionId,
        driveEmail: data.driveEmail ?? "",
        usedBy: data.usedBy ?? [],
      });
    } catch {
      setDriveMessage("연결 상태를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
  };

  const handleDisconnectDrive = async () => {
    if (!disconnectConfirm) return;
    setDisconnecting(true);

    try {
      const res = await fetch(
        `/api/deceased-drive/connection?connectionId=${encodeURIComponent(disconnectConfirm.connectionId)}`,
        { method: "DELETE" },
      );
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        keptForCharacters?: boolean;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? "연결을 해제하지 못했어요.");

      setDriveConnected(false);
      setDriveUserEmail("");
      setDriveMessage(
        data?.keptForCharacters
          ? "내가 남길 기록에서 해제했어요. 인물과의 연결은 그대로예요."
          : "연결을 해제했어요.",
      );
    } catch (disconnectError) {
      setDriveMessage(
        disconnectError instanceof Error ? disconnectError.message : "연결을 해제하지 못했어요.",
      );
    } finally {
      setDisconnecting(false);
      setDisconnectConfirm(null);
    }
  };

  const handleDriveAction = () => {
    if (driveConnected) {
      void handleAskDisconnectDrive();
      return;
    }

    handleConnectDrive();
  };

  const handleAddViewer = () => {
    setShowAddForm(true);
  };

  const handleCancelAddViewer = () => {
    setShowAddForm(false);
    setAddViewerUsername("");
    setAddViewerRelation("");
  };

  const handleSubmitAddViewer = () => {
    const username = addViewerUsername.trim();
    const relation = addViewerRelation.trim();

    if (!username || !relation) {
      return;
    }

    // 같은 아이디는 한 번만, 최대 인원까지
    if (
      legacyViewers.some((viewer) => viewer.id === username) ||
      legacyViewers.length >= LEGACY_VIEWERS_MAX
    ) {
      handleCancelAddViewer();
      return;
    }

    setLegacyViewers((viewers) => [
      ...viewers,
      {
        id: username,
        relationship: relation,
      },
    ]);
    handleCancelAddViewer();
  };

  const handleViewerContextMenu = (
    event: React.MouseEvent<HTMLDivElement>,
    viewerId: string,
  ) => {
    event.preventDefault();
    setViewerContextMenu({
      viewerId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleDeleteViewer = (viewerId: string) => {
    setLegacyViewers((viewers) =>
      viewers.filter((viewer) => viewer.id !== viewerId),
    );
    setViewerContextMenu(null);
  };

  const toggleLegacyRecordType = (type: LegacyRecordType) => {
    setSelectedLegacyRecordTypes((types) =>
      types.includes(type)
        ? types.filter((item) => item !== type)
        : [...types, type],
    );
  };

  const handleResetLegacyRecordTypes = () => {
    setSelectedLegacyRecordTypes([]);
  };

  const handleSaveLegacySettings = async () => {
    setLegacySaving(true);
    setLegacySaveMessage(null);

    try {
      const res = await fetch("/api/legacy/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewers: legacyViewers,
          recordTypes: selectedLegacyRecordTypes,
          hiddenStart: legacyStartDate,
          hiddenEnd: legacyEndDate,
          lastMessage: legacyMessage,
        }),
      });

      if (res.status === 401) {
        void signIn("google", { callbackUrl: LEGACY_SETTINGS_CALLBACK_URL });
        return;
      }

      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "저장하지 못했어요.");

      setLegacySaveMessage("저장했어요.");
    } catch (saveError) {
      setLegacySaveMessage(saveError instanceof Error ? saveError.message : "저장하지 못했어요.");
    } finally {
      setLegacySaving(false);
    }
  };

  const isLegacyDateRangeInvalid =
    legacyStartDate !== "" &&
    legacyEndDate !== "" &&
    (toLegacyDateTimestamp(legacyStartDate) ?? 0) >
      (toLegacyDateTimestamp(legacyEndDate) ?? 0);

  const handleLegacyStartDateChange = (nextStartDate: string) => {
    if (legacyEndDate) {
      const startTimestamp = toLegacyDateTimestamp(nextStartDate);
      const endTimestamp = toLegacyDateTimestamp(legacyEndDate);

      if (
        startTimestamp !== null &&
        endTimestamp !== null &&
        startTimestamp > endTimestamp
      ) {
        return;
      }
    }

    setLegacyStartDate(nextStartDate);
  };

  const handleLegacyEndDateChange = (nextEndDate: string) => {
    if (legacyStartDate) {
      const startTimestamp = toLegacyDateTimestamp(legacyStartDate);
      const endTimestamp = toLegacyDateTimestamp(nextEndDate);

      if (
        startTimestamp !== null &&
        endTimestamp !== null &&
        startTimestamp > endTimestamp
      ) {
        return;
      }
    }

    setLegacyEndDate(nextEndDate);
  };

  useEffect(() => {
    if (!isOpen || !openToSetting) {
      return;
    }

    setSelectedSetting(openToSetting);

    if (openToSetting === "legacy") {
      void loadDriveConnection();
    }
  }, [isOpen, openToSetting, loadDriveConnection]);

  useEffect(() => {
    if (!isOpen || selectedSetting !== "legacy") {
      return;
    }

    void loadDriveConnection();
  }, [isOpen, loadDriveConnection, selectedSetting]);

  // 저장해 둔 내가 남길 기록(2~5번) 불러오기 (그 탭을 처음 열 때 한 번)
  useEffect(() => {
    if (!isOpen || selectedSetting !== "legacy" || legacyLoaded) return;

    void (async () => {
      try {
        const res = await fetch("/api/legacy/settings", { cache: "no-store" });
        if (!res.ok) return;
        const { settings } = (await res.json()) as { settings: unknown };
        const loaded = sanitizeLegacySettings(settings as Parameters<typeof sanitizeLegacySettings>[0]);
        setLegacyViewers(loaded.viewers);
        setSelectedLegacyRecordTypes(loaded.recordTypes);
        setLegacyStartDate(loaded.hiddenStart);
        setLegacyEndDate(loaded.hiddenEnd);
        setLegacyMessage(loaded.lastMessage);
      } finally {
        setLegacyLoaded(true);
      }
    })();
  }, [isOpen, selectedSetting, legacyLoaded]);

  // 저장해 둔 기록을 마주할 방법 불러오기 (창을 처음 열 때 한 번)
  useEffect(() => {
    if (!isOpen || viewSettingsLoaded) return;

    void (async () => {
      try {
        const res = await fetch("/api/me/view-settings", { cache: "no-store" });
        if (!res.ok) return;
        const { settings } = (await res.json()) as { settings: unknown };
        const loaded = sanitizeViewSettings(settings as Parameters<typeof sanitizeViewSettings>[0]);
        setSliderValue(loaded.slideSeconds);
        setSelectedViewType(loaded.recapView);
      } finally {
        setViewSettingsLoaded(true);
      }
    })();
  }, [isOpen, viewSettingsLoaded]);

  // 저장해 둔 나의 프로필 불러오기 (창을 처음 열 때 한 번)
  useEffect(() => {
    if (!isOpen || profileLoaded) return;

    void (async () => {
      try {
        const res = await fetch("/api/me/profile", { cache: "no-store" });
        if (!res.ok) return;
        const { profile } = (await res.json()) as {
          profile: { displayName: string; handle: string; intro: string; appearance: CharacterAppearance | null };
        };
        setProfileName(profile.displayName);
        setProfileId(profile.handle);
        setProfileIntro(profile.intro);
        if (profile.appearance) setMyAppearance(profile.appearance);
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, [isOpen, profileLoaded]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {disconnectConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30"
          onMouseDown={(event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget && !disconnecting) setDisconnectConfirm(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="disconnect-title"
            className="flex w-[420px] flex-col gap-4 rounded-2xl bg-white p-7 shadow-lg"
          >
            <h3 id="disconnect-title" className="font-newsreader text-2xl text-black">
              내가 남길 기록에서 Drive 연결을 해제할까요?
            </h3>
            <p className="font-mulish text-sm text-[#4A423C]">{disconnectConfirm.driveEmail}</p>
            {disconnectConfirm.usedBy.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-xl bg-[#FAF6F0] p-4 font-mulish text-sm text-[#4A423C]">
                <p>
                  이 계정을 쓰는 인물 <b>{disconnectConfirm.usedBy.length}명</b>과의 연결은 그대로 유지돼요.
                </p>
                <p className="text-[#AF9083]">{disconnectConfirm.usedBy.join(", ")}</p>
                <p className="text-xs text-[#898787]">
                  내가 남길 기록에서만 이 계정이 빠지고, 인물의 책장·섹션 사진은 계속 볼 수 있어요.
                </p>
              </div>
            ) : (
              <p className="font-mulish text-sm text-[#898787]">이 계정을 쓰는 인물은 없어요.</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setDisconnectConfirm(null)}
                disabled={disconnecting}
                className="cursor-pointer rounded-full border border-[#C0BDBD] bg-white px-5 py-2 font-mulish text-sm text-[#666] hover:bg-[#FAF6F0]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDisconnectDrive()}
                disabled={disconnecting}
                className="cursor-pointer rounded-full border-0 bg-[#AF9083] px-5 py-2 font-mulish text-sm text-white hover:bg-[#9a7d71] disabled:opacity-60"
              >
                {disconnecting ? "해제하는 중..." : "연결 해제하기"}
              </button>
            </div>
          </div>
        </div>
      )}
      {viewerContextMenu && (
        <div
          className={legacyViewerContextMenuClass}
          style={{
            top: viewerContextMenu.y,
            left: viewerContextMenu.x,
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleDeleteViewer(viewerContextMenu.viewerId)}
            className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-[#F6F6F6]"
          >
            삭제하기
          </button>
        </div>
      )}

      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        aria-label="설정 닫기"
        onClick={onClose}
      />
      <div
            className="fixed left-1/2 top-1/2 z-[70] flex h-[720px] w-[1092px] -translate-x-1/2 -translate-y-1/2 flex-row items-stretch overflow-hidden shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
            role="dialog"
            aria-modal="true"
            aria-label="설정"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <aside className="flex h-full w-[237px] min-w-[237px] shrink-0 flex-col gap-[49px] overflow-hidden rounded-l-[16px] bg-[#FFFEFB] px-5 pb-[23px] pt-9">
              <div className="flex flex-col gap-2">
                <p className="px-2 font-mulish text-[10px] text-[#898787]">
                  나의 설정
                </p>
                <div className="flex flex-col gap-2">
                  {mySettingsItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={getSidebarMenuClass(item.id)}
                      onClick={() => setSelectedSetting(item.id)}
                      aria-pressed={selectedSetting === item.id}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center p-1">
                        <Image
                          src={item.icon}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain"
                        />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="px-2 font-mulish text-[10px] text-[#898787]">
                  고인 관련 설정
                </p>
                <div className="flex flex-col gap-2">
                  {deceasedSettingsItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${getSidebarMenuClass(item.id)} pl-1.5`}
                      onClick={() => setSelectedSetting(item.id)}
                      aria-pressed={selectedSetting === item.id}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center p-1">
                        <Image
                          src={item.icon}
                          alt=""
                          width={22}
                          height={22}
                          className="h-[22px] w-[22px] object-contain"
                        />
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <AccountBox />
              </div>
            </aside>

            <div className="flex h-full w-[855px] min-w-[855px] shrink-0 flex-col overflow-hidden rounded-r-[15px] bg-[#FFFEFB]">
                <div className="flex shrink-0 justify-end px-8 pb-[5px] pt-8">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-5 w-5 items-center justify-center transition-opacity hover:opacity-70"
                    aria-label="닫기"
                  >
                    <Image
                      src="/icons/settings/close.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4"
                    />
                  </button>
                </div>

                <div
                  className={`min-h-0 flex-1 px-8 ${
                    selectedSetting === "profile" ||
                    selectedSetting === "legacy"
                      ? "flex flex-col overflow-hidden"
                      : "overflow-y-auto pb-11"
                  }`}
                >
                  {selectedSetting === "view-method" && (
                    <div className="flex flex-col items-center gap-[60px]">
                      <div className="flex w-full flex-col gap-12 px-6">
                        <h2 className="font-newsreader text-[32px] leading-tight text-black">
                          기록을 어떻게 마주하고 싶으신가요?
                        </h2>

                        <div className="flex flex-col gap-8">
                          <div className="flex flex-col gap-[18px]">
                            <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                              <span>1</span>
                              <span>사진들이 보여지는 시간을 설정하세요.</span>
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-4">
                                <span className="shrink-0 font-mulish text-sm text-[#4A423C]">
                                  빠르게 보기
                                </span>
                                <div className="relative flex-1 pb-8">
                                  <span
                                    className="pointer-events-none absolute top-[20px] -translate-x-1/2 rounded-[29px] bg-[#C4D4A5] px-3 py-1 font-mulish text-sm text-[#4A423C]"
                                    style={{
                                      left: `${((sliderValue - SLIDE_SECONDS_MIN) / (SLIDE_SECONDS_MAX - SLIDE_SECONDS_MIN)) * 100}%`,
                                    }}
                                  >
                                    {sliderValue}초/장
                                  </span>
                                  <input
                                    type="range"
                                    min={SLIDE_SECONDS_MIN}
                                    max={SLIDE_SECONDS_MAX}
                                    value={sliderValue}
                                    onChange={(e) =>
                                      setSliderValue(Number(e.target.value))
                                    }
                                    className={sliderRangeClass}
                                  />
                                </div>
                                <span className="shrink-0 font-mulish text-sm text-[#4A423C]">
                                  느리게 보기
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-[#E9E0D3]" />

                          <div className="flex flex-col gap-[18px]">
                            <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                              <span>2</span>
                              <span>
                                리캡을 열었을 때 처음 보일 화면을 골라주세요.
                                리캡 안에서도 언제든 바꿀 수 있어요.
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-x-[22px] gap-y-2.5">
                              {viewTypeOptions.map((option) => {
                                const isSelected =
                                  selectedViewType === option.id;
                                const { Icon } = option;
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedViewType(option.id)
                                    }
                                    className={`flex h-[172px] w-[233px] flex-col items-center justify-center gap-2.5 rounded-[7px] bg-white p-[18px] text-center transition-colors ${
                                      isSelected
                                        ? "border-2 border-[#9BB073] bg-[#E4EACE]"
                                        : "border border-[#C0BDBD]"
                                    }`}
                                    aria-pressed={isSelected}
                                  >
                                    <div className="flex h-12 w-12 items-center justify-center">
                                      <Icon
                                        className="h-8 w-8 text-[#AF9083]"
                                        strokeWidth={1.5}
                                        aria-hidden
                                      />
                                    </div>
                                    <span className="font-mulish text-base text-[#898787]">
                                      {option.title}
                                    </span>
                                    <span className="font-mulish text-xs text-[#898787]">
                                      {option.description}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {viewMessage && (
                        <p className="-mb-12 w-full max-w-[706px] font-mulish text-sm text-[#4A423C]">
                          {viewMessage}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleSaveViewMethod()}
                        disabled={viewSaving}
                        className="flex h-14 w-full max-w-[706px] items-center justify-center rounded-xl border border-[#B75A34] bg-[#D99B82] px-4 py-4 font-newsreader text-base text-black transition-colors hover:bg-[#C4836E] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {viewSaving ? "저장 중..." : "저장하기"}
                      </button>
                    </div>
                  )}

                  {selectedSetting === "profile" && (
                    <div className="flex h-full min-h-0 flex-col">
                      <h2 className="sticky top-0 z-10 shrink-0 bg-white pb-4 pl-6 pr-2 font-newsreader text-[32px] leading-tight text-black">
                        사용자님의 프로필을 설정해보세요.
                      </h2>

                      <div className="flex min-h-0 flex-1 flex-col items-center gap-[60px] overflow-y-auto pb-11">
                        <div className="flex w-full flex-col pl-6 pr-2">
                          <div className="flex flex-col gap-8 pl-6">
                          <div className="flex flex-col gap-[18px]">
                            <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                              <span>1</span>
                              <span>기본 정보를 설정해주세요.</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-[49px] gap-y-4">
                              <label className="flex items-center gap-3">
                                <span className="shrink-0 font-mulish text-sm text-[#4A423C]">
                                  이름
                                </span>
                                <input
                                  type="text"
                                  value={profileName}
                                  onChange={(e) =>
                                    setProfileName(e.target.value)
                                  }
                                  maxLength={10}
                                  placeholder="뭐라고 불러드릴까요?(최대 10자)"
                                  className="w-[246px] rounded-[7px] border border-[#C0BDBD] bg-white py-3 pl-6 pr-12 font-mulish text-xs text-[#4A423C] placeholder:text-[#898787]"
                                />
                              </label>

                              <label className="flex items-center gap-3">
                                <span className="shrink-0 font-mulish text-sm text-[#4A423C]">
                                  아이디
                                </span>
                                <input
                                  type="text"
                                  value={profileId}
                                  onChange={(e) =>
                                    setProfileId(e.target.value)
                                  }
                                  maxLength={20}
                                  placeholder="영문으로 작성해주세요."
                                  className="w-[200px] rounded-[7px] border border-[#C0BDBD] bg-white py-3 pl-6 pr-12 font-mulish text-xs text-[#4A423C] placeholder:text-[#898787]"
                                />
                              </label>

                              <label className="flex w-full items-center gap-3">
                                <span className="shrink-0 font-mulish text-sm text-[#4A423C]">
                                  소개
                                </span>
                                <input
                                  type="text"
                                  value={profileIntro}
                                  onChange={(e) =>
                                    setProfileIntro(e.target.value)
                                  }
                                  maxLength={100}
                                  placeholder="예시: 저는 영원한 이별은 없다고 믿어요. (최대 100자)"
                                  className="w-full max-w-[705px] rounded-[7px] border border-[#C0BDBD] bg-white py-3 pl-6 pr-12 font-mulish text-xs text-[#4A423C] placeholder:text-[#898787]"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="border-t border-[#E9E0D3]" />

                          <div className="flex flex-col gap-[18px]">
                            <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                              <span>2</span>
                              <span>나의 캐릭터</span>
                            </div>

                            <CharacterPartsPicker
                              appearance={myAppearance}
                              onChange={setMyAppearance}
                              previewLabel="나의 캐릭터"
                            />
                          </div>
                          </div>
                        </div>

                        {profileMessage && (
                          <p className="w-full max-w-[706px] font-mulish text-sm text-[#4A423C]">
                            {profileMessage}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleSaveProfile()}
                          disabled={profileSaving}
                          className="flex h-14 w-full max-w-[706px] items-center justify-center rounded-xl border border-[#B75A34] bg-[#D99B82] px-4 py-4 font-newsreader text-base text-black transition-colors hover:bg-[#C4836E] hover:text-white disabled:opacity-60"
                        >
                          {profileSaving ? "저장하는 중..." : "저장하기"}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedSetting === "edit-person" && <CharacterManager />}

                  {selectedSetting === "legacy" && (
                    <div className="flex h-full min-h-0 flex-col">
                      <h2 className="sticky top-0 z-10 shrink-0 bg-white pb-4 pl-6 pr-2 font-newsreader text-[32px] leading-tight text-black">
                        어떤 기록을 남기고 싶으신가요?
                      </h2>

                      <div className="flex min-h-0 flex-1 flex-col items-center gap-[60px] overflow-y-auto pb-11">
                        <div className="flex w-full flex-col gap-8 pl-6 pr-2">
                          <div className="flex flex-col gap-[18px] pl-6">
                            <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                              <span>1</span>
                              <span>사용자님의 디지털 기록을 연동해주세요.</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <Image
                                src="/icons/settings/google-drive.png"
                                alt=""
                                width={32}
                                height={29}
                                className="h-[29px] w-8 shrink-0 object-contain"
                              />
                              <input
                                type="text"
                                value={driveConnected ? driveUserEmail : ""}
                                readOnly
                                placeholder="연동된 계정이 없습니다"
                                className={`w-full max-w-[575px] rounded-[7px] border border-[#C0BDBD] px-6 py-3 font-mulish text-sm text-[#4A423C] placeholder:text-[#898787] ${
                                  driveConnected ? "bg-[#F2F5EA]" : "bg-white"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={handleDriveAction}
                                className={legacyActionButtonClass}
                              >
                                {driveConnected ? "연결 해제" : "연결하기"}
                              </button>
                            </div>
                            {driveMessage && (
                              <p className="font-mulish text-xs text-[#4A423C]">{driveMessage}</p>
                            )}
                          </div>

                          <div className="border-t border-[#E9E0D3]" />

                          <div className="flex flex-col gap-[18px] pl-6">
                            <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                              <span>2</span>
                              <span>
                                당신의 기록을 열람할 수 있는 사람들을
                                등록하세요.
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                              {legacyViewers.map((contact) => (
                                <div
                                  key={contact.id}
                                  className={legacyViewerCardClass}
                                  onContextMenu={(event) =>
                                    handleViewerContextMenu(event, contact.id)
                                  }
                                >
                                  <div className="relative h-8 w-8 shrink-0">
                                    <div className="absolute inset-[3px] rounded-full bg-[#D9D9D9]" />
                                    <Image
                                      src="/icons/settings/contact-badge-62717c.png"
                                      alt=""
                                      width={16}
                                      height={16}
                                      className="absolute left-2 top-2 h-4 w-4 object-cover"
                                    />
                                  </div>
                                  <span className="w-full truncate text-center font-mulish text-sm font-semibold text-black">
                                    {contact.id}
                                  </span>
                                  <span className="font-mulish text-xs text-[#616161]">
                                    관계: {contact.relationship}
                                  </span>
                                </div>
                              ))}
                              {showAddForm ? (
                                <div className="flex flex-col gap-2 rounded-md bg-white/60 px-2 py-3">
                                  <input
                                    type="text"
                                    value={addViewerUsername}
                                    onChange={(e) =>
                                      setAddViewerUsername(e.target.value)
                                    }
                                    placeholder="아이디를 입력하세요"
                                    maxLength={LEGACY_VIEWER_ID_MAX}
                                    className="w-full rounded-[7px] border border-[#C0BDBD] bg-white px-3 py-2 font-mulish text-xs text-[#4A423C] placeholder:text-[#898787]"
                                  />
                                  <input
                                    type="text"
                                    value={addViewerRelation}
                                    onChange={(e) =>
                                      setAddViewerRelation(e.target.value)
                                    }
                                    placeholder="관계를 입력하세요"
                                    maxLength={LEGACY_VIEWER_RELATION_MAX}
                                    className="w-full rounded-[7px] border border-[#C0BDBD] bg-white px-3 py-2 font-mulish text-xs text-[#4A423C] placeholder:text-[#898787]"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={handleSubmitAddViewer}
                                      className="flex-1 rounded-lg border border-[#4B3F39] bg-[#776257] px-2 py-1.5 font-mulish text-xs text-white transition-colors hover:bg-[#5E4E47]"
                                    >
                                      추가
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelAddViewer}
                                      className="flex-1 rounded-lg border border-[#C0BDBD] bg-white px-2 py-1.5 font-mulish text-xs text-[#4A423C] transition-colors hover:bg-[#F6F6F6]"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleAddViewer}
                                  className="flex flex-col items-center justify-center gap-2 rounded-md bg-white/60 px-2 py-3 transition-colors hover:bg-white/80"
                                >
                                  <Image
                                    src="/icons/settings/add-viewer.svg"
                                    alt=""
                                    width={13}
                                    height={13}
                                    unoptimized
                                    className="h-[13px] w-[13px] shrink-0"
                                  />
                                  <span className="text-center font-newsreader text-sm text-black">
                                    열람자 추가하기
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-[#E9E0D3]" />

                          <div className="flex flex-col gap-[18px] pl-6">
                            <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                              <span>3</span>
                              <span>
                                나의 주변인들에게 공개하고 싶은 기록의 유형을
                                선택해주세요. (여러개 선택 가능합니다)
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-x-[18px] gap-y-2.5">
                              {legacyRecordTypeOptions.map((option) => {
                                const isSelected =
                                  selectedLegacyRecordTypes.includes(
                                    option.id,
                                  );
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() =>
                                      toggleLegacyRecordType(option.id)
                                    }
                                    className={legacyChipClass(isSelected)}
                                    aria-pressed={isSelected}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>

                            {selectedLegacyRecordTypes.length > 0 && (
                              <div className="flex items-center justify-between">
                                <p className="font-mulish text-sm text-[#898787]">
                                  {selectedLegacyRecordTypes.length}개 선택됨
                                </p>
                                <button
                                  type="button"
                                  onClick={handleResetLegacyRecordTypes}
                                  className="cursor-pointer font-mulish text-xs text-[#898787] underline"
                                >
                                  초기화
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-[#E9E0D3]" />

                          <div className="flex flex-col gap-[18px] pl-6">
                            <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                              <span>4</span>
                              <span>
                                공개하고 싶지 않은 특정 시기의 기록이
                                있으신가요?
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-[49px] gap-y-4">
                              <LegacyDatePicker
                                label="시작 일자"
                                value={legacyStartDate}
                                onChange={handleLegacyStartDateChange}
                                maxDate={legacyEndDate || undefined}
                              />
                              <LegacyDatePicker
                                label="종료 일자"
                                value={legacyEndDate}
                                onChange={handleLegacyEndDateChange}
                                minDate={legacyStartDate || undefined}
                              />
                            </div>
                            {isLegacyDateRangeInvalid && (
                              <p className="font-mulish text-sm text-[#9E2121]">
                                시작 일자는 종료 일자보다 빠른 날짜여야 합니다.
                              </p>
                            )}
                          </div>

                          <div className="border-t border-[#E9E0D3]" />

                          <div className="flex flex-col gap-[18px] pl-6">
                            <div className="flex max-w-[743px] items-center justify-between gap-4">
                              <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                                <span>5</span>
                                <span>
                                  남기고 싶은 마지막 메시지를 적어주세요.
                                  남겨진 이들이 사용자님의 기록을 열람할 때
                                  전달됩니다.
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleSaveLegacySettings()}
                                disabled={legacySaving}
                                className="shrink-0 rounded-lg bg-[#AF9083] px-4 py-1 font-mulish text-sm text-white transition-colors hover:bg-[#9A7F73]"
                              >
                                확인
                              </button>
                            </div>

                            <textarea
                              value={legacyMessage}
                              onChange={(e) =>
                                setLegacyMessage(e.target.value)
                              }
                              maxLength={LEGACY_MESSAGE_MAX}
                              placeholder="(최대 100자)"
                              className="h-[154px] w-full max-w-[743px] resize-none rounded-[7px] border border-[#C0BDBD] bg-white p-6 font-newsreader text-base text-[#898787] placeholder:text-[#898787]"
                            />
                          </div>

                          <div className="flex max-w-[743px] items-center justify-end gap-3 pl-6">
                            {legacySaveMessage && (
                              <p className="mr-auto font-mulish text-sm text-[#4A423C]">
                                {legacySaveMessage}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleSaveLegacySettings()}
                              disabled={legacySaving || !legacyLoaded || isLegacyDateRangeInvalid}
                              className="cursor-pointer rounded-xl border border-[#B75A34] bg-[#D99B82] px-8 py-2.5 font-newsreader text-base text-black transition-colors hover:bg-[#C4836E] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {legacySaving ? "저장 중..." : "기록 설정 저장하기"}
                            </button>
                          </div>

                          {driveConnected && (
                            <>
                              <div className="border-t border-[#E9E0D3]" />
                              {/* 계정을 바꾸면 사진 목록을 새로 불러옴 */}
                              <LegacyMyPhotos key={driveUserEmail} />
                            </>
                          )}

                        </div>

                      </div>
                    </div>
                  )}
                </div>
              </div>
          </div>
    </>
  );
}
