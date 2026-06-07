"use client";

import {
  LegacyDatePicker,
  toLegacyDateTimestamp,
} from "@/components/legacy-date-picker";
import Image from "next/image";
import { getSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

const LEGACY_SETTINGS_CALLBACK_URL = "/mainland?settings=legacy";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string | null;
  webViewLink: string | null;
};

type SettingId = "view-method" | "profile" | "legacy" | "edit-person";
type ViewType = "slideshow" | "timeline" | "book";
type SelectedGender = "여성" | "남성";
type SelectedTop =
  | "민소매"
  | "반팔"
  | "긴팔"
  | "원피스"
  | "치마"
  | "반바지"
  | "긴바지";
type LegacyRecordType =
  | "daily-face"
  | "id-photo"
  | "anniversary"
  | "no-face"
  | "together-daily"
  | "video-face"
  | "video-no-face"
  | "custom";

const skinToneColors = [
  "#F7D0CB",
  "#C8845A",
  "#E8C8A0",
  "#A07050",
  "#74513A",
] as const;

const clothingColors = [
  "#8A6878",
  "#6A8A5A",
  "#ECB0AE",
  "#7A6A9A",
  "#9A7A5A",
] as const;

const viewTypeOptions: {
  id: ViewType;
  title: string;
  description: string;
}[] = [
  {
    id: "slideshow",
    title: "슬라이드쇼",
    description: "사진이 한 장씩 천천히 흘러가요.",
  },
  {
    id: "timeline",
    title: "타임라인",
    description: "시간의 순서대로 기억이 펼쳐져요.",
  },
  {
    id: "book",
    title: "책",
    description: "책장을 넘기듯이 기록을 열어봐요.",
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

const profileSelectButtonClass = (selected: boolean) =>
  selected
    ? "rounded-xl border-2 border-[#9BB073] bg-[#E4EACE] px-6 py-3 font-mulish text-sm font-bold text-[#4A423C]"
    : "rounded-xl border border-[#E9E0D3] bg-white px-6 py-3 font-mulish text-sm text-[#4A423C]";

const profileColorButtonClass = (selected: boolean) =>
  `h-7 w-7 rounded-full border-2 ${
    selected ? "border-[#4A423C]" : "border-transparent"
  }`;

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

type LegacyViewer = {
  id: string;
  relationship: string;
};

const initialLegacyViewers: LegacyViewer[] = [
  { id: "seoyeon_05", relationship: "친구" },
  { id: "eunsol_04", relationship: "친구" },
  { id: "mingyung_05", relationship: "친구" },
  { id: "nice_day_00", relationship: "친구" },
  { id: "missingsh_98", relationship: "친구" },
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
  const [sliderValue, setSliderValue] = useState(5);
  const [selectedViewType, setSelectedViewType] = useState<ViewType | null>(
    null,
  );
  const [profileName, setProfileName] = useState("");
  const [profileId, setProfileId] = useState("");
  const [profileIntro, setProfileIntro] = useState("");
  const [selectedGender, setSelectedGender] =
    useState<SelectedGender | null>("여성");
  const [selectedTop, setSelectedTop] = useState<SelectedTop | null>("원피스");
  const [selectedSkin, setSelectedSkin] = useState<string>(skinToneColors[0]);
  const [selectedTopColor, setSelectedTopColor] = useState<string | null>(
    null,
  );
  const [selectedBottomColor, setSelectedBottomColor] = useState<string | null>(
    null,
  );
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveUserEmail, setDriveUserEmail] = useState("");
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFilesLoading, setDriveFilesLoading] = useState(false);
  const [driveFilesError, setDriveFilesError] = useState<string | null>(null);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [selectedLegacyRecordTypes, setSelectedLegacyRecordTypes] = useState<
    LegacyRecordType[]
  >([]);
  const [legacyStartDate, setLegacyStartDate] = useState("");
  const [legacyEndDate, setLegacyEndDate] = useState("");
  const [legacyMessage, setLegacyMessage] = useState("");
  const [legacyViewers, setLegacyViewers] =
    useState<LegacyViewer[]>(initialLegacyViewers);
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

  const loadDriveFiles = async () => {
    setDriveFilesLoading(true);
    setDriveFilesError(null);

    try {
      const res = await fetch("/api/drive/files", { cache: "no-store" });

      if (res.status === 401) {
        void signIn("google", { callbackUrl: LEGACY_SETTINGS_CALLBACK_URL });
        return;
      }

      if (!res.ok) {
        const errorJson = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errorJson?.error ?? "Drive 파일을 불러오지 못했습니다.");
      }

      const data = (await res.json()) as {
        files: DriveFile[];
        userEmail?: string | null;
      };
      const clientSession = await getSession();
      const connectedEmail =
        data.userEmail ??
        clientSession?.user?.email ??
        clientSession?.user?.name ??
        "";

      setDriveConnected(true);
      setDriveUserEmail(connectedEmail);
      setDriveFiles(data.files);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Drive 파일을 불러오지 못했습니다.";
      setDriveFiles([]);
      setDriveFilesError(message);
    } finally {
      setDriveFilesLoading(false);
    }
  };
  const getSidebarMenuClass = (id: SettingId) =>
    selectedSetting === id
      ? `${sidebarMenuBaseClass} bg-[#FDD9BD]`
      : `${sidebarMenuBaseClass} bg-transparent hover:bg-[#FBE2E1]`;

  const handleSaveViewMethod = () => {
    console.log({ sliderValue, selectedViewType });
  };

  const handleSaveProfile = () => {
    console.log({
      profileName,
      profileId,
      profileIntro,
      selectedGender,
      selectedTop,
      selectedSkin,
      selectedTopColor,
      selectedBottomColor,
    });
  };

  const handleConnectDrive = () => {
    void signIn("google", { callbackUrl: LEGACY_SETTINGS_CALLBACK_URL });
  };

  const handleDisconnectDrive = () => {
    setDriveConnected(false);
    setDriveUserEmail("");
    setDriveFiles([]);
    setDriveFilesError(null);
    setDriveFilesLoading(false);
    void signOut({ redirect: false });
  };

  const handleDriveAction = () => {
    if (driveConnected) {
      handleDisconnectDrive();
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

  const handleEditLegacyPhotos = () => {
    setIsEditingPhotos(true);
    setSelectedPhotos(new Set());
  };

  const handleFinishEditingPhotos = () => {
    setIsEditingPhotos(false);
    setSelectedPhotos(new Set());
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleDeleteSelectedPhotos = () => {
    if (selectedPhotos.size === 0) {
      return;
    }

    setDriveFiles((files) => {
      const nextFiles = files.filter((file) => !selectedPhotos.has(file.id));

      if (nextFiles.length === 0) {
        setIsEditingPhotos(false);
      }

      return nextFiles;
    });
    setSelectedPhotos(new Set());
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

  const handleConfirmLegacyMessage = () => {
    console.log(legacyMessage);
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

  const handleSaveLegacy = () => {
    console.log({
      driveUserEmail,
      driveConnected,
      driveFiles,
      selectedLegacyRecordTypes,
      legacyStartDate,
      legacyEndDate,
      legacyMessage,
      viewers: legacyViewers,
    });
  };

  useEffect(() => {
    if (!isOpen || !openToSetting) {
      return;
    }

    setSelectedSetting(openToSetting);

    if (openToSetting === "legacy") {
      void loadDriveFiles();
    }
  }, [isOpen, openToSetting]);


  if (!isOpen) {
    return null;
  }

  return (
    <>
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
                                  느리게 보기
                                </span>
                                <div className="relative flex-1 pb-8">
                                  <span
                                    className="pointer-events-none absolute top-[20px] -translate-x-1/2 rounded-[29px] bg-[#C4D4A5] px-3 py-1 font-mulish text-sm text-[#4A423C]"
                                    style={{
                                      left: `${((sliderValue - 1) / (10 - 1)) * 100}%`,
                                    }}
                                  >
                                    {sliderValue}초/장
                                  </span>
                                  <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    value={sliderValue}
                                    onChange={(e) =>
                                      setSliderValue(Number(e.target.value))
                                    }
                                    className={sliderRangeClass}
                                  />
                                </div>
                                <span className="shrink-0 font-mulish text-sm text-[#4A423C]">
                                  빠르게 보기
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-[#E9E0D3]" />

                          <div className="flex flex-col gap-[18px]">
                            <div className="flex gap-2 font-mulish text-sm text-[#898787]">
                              <span>2</span>
                              <span>
                                고인과 관련해서 보고싶지 않은 기록이 있나요?
                                선택하신 기록은 언제든 바꿀 수 있어요.
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-x-[22px] gap-y-2.5">
                              {viewTypeOptions.map((option) => {
                                const isSelected =
                                  selectedViewType === option.id;
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
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#D9D9D9] p-1">
                                      <div className="h-[34px] w-[34px] rounded bg-[#D9D9D9]" />
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

                      <button
                        type="button"
                        onClick={handleSaveViewMethod}
                        className="flex h-14 w-full max-w-[706px] items-center justify-center rounded-xl border border-[#B75A34] bg-[#D99B82] px-4 py-4 font-newsreader text-base text-black transition-colors hover:bg-[#C4836E] hover:text-white"
                      >
                        저장하기
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

                            <div className="flex items-end justify-between gap-6">
                              <div className="relative h-[411px] w-[236px] shrink-0 overflow-hidden bg-[#FDEFE6]">
                                <div className="absolute inset-x-0 bottom-0 h-[122px] bg-[#E9E0D3]" />
                                <div className="absolute left-1/2 top-[137px] -translate-x-1/2">
                                  <Image
                                    src="/icons/settings/character-preview.svg"
                                    alt=""
                                    width={138}
                                    height={227}
                                    unoptimized
                                    className="h-[227px] w-[138px]"
                                  />
                                </div>
                              </div>

                              <div className="flex w-[479px] shrink-0 flex-col gap-3">
                                <div className="flex flex-col gap-3 p-3">
                                  <span className="font-mulish text-sm text-[#4A423C]">
                                    성별
                                  </span>
                                  <div className="flex gap-4">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedGender("여성")}
                                      className={profileSelectButtonClass(
                                        selectedGender === "여성",
                                      )}
                                      aria-pressed={selectedGender === "여성"}
                                    >
                                      여성
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedGender("남성")}
                                      className={profileSelectButtonClass(
                                        selectedGender === "남성",
                                      )}
                                      aria-pressed={selectedGender === "남성"}
                                    >
                                      남성
                                    </button>
                                  </div>
                                </div>

                                <div className="relative min-h-[147px] p-3">
                                  <span className="font-mulish text-sm text-[#4A423C]">
                                    의상
                                  </span>
                                  <div className="mt-3 grid grid-cols-4 gap-3">
                                    {(
                                      [
                                        "민소매",
                                        "반팔",
                                        "긴팔",
                                        "원피스",
                                        "치마",
                                        "반바지",
                                        "긴바지",
                                      ] as const
                                    ).map((top, index) => {
                                      const isDress = selectedTop === "원피스";
                                      const isBottom =
                                        top === "치마" ||
                                        top === "반바지" ||
                                        top === "긴바지";
                                      return (
                                        <button
                                          key={top}
                                          type="button"
                                          onClick={() => {
                                            setSelectedTop(top);
                                            if (top === "원피스") {
                                              setSelectedBottomColor(null);
                                            }
                                          }}
                                          disabled={isDress && isBottom}
                                          className={`${profileSelectButtonClass(selectedTop === top)} ${index === 0 ? "col-start-1" : ""} disabled:cursor-not-allowed disabled:opacity-50`}
                                          aria-pressed={selectedTop === top}
                                        >
                                          {top}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-3 p-3">
                                  <span className="font-mulish text-sm text-[#4A423C]">
                                    피부 톤
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {skinToneColors.map((color, index) => (
                                      <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedSkin(color)}
                                        className={profileColorButtonClass(
                                          selectedSkin === color,
                                        )}
                                        style={{ backgroundColor: color }}
                                        aria-label={`피부 톤 ${index + 1}`}
                                        aria-pressed={selectedSkin === color}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center gap-[22px] p-3">
                                  <div className="flex flex-col gap-3">
                                    <span className="font-mulish text-sm text-[#4A423C]">
                                      상의 색상
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {clothingColors.map((color, index) => (
                                        <button
                                          key={`top-${color}`}
                                          type="button"
                                          onClick={() =>
                                            setSelectedTopColor(color)
                                          }
                                          className={profileColorButtonClass(
                                            selectedTopColor === color,
                                          )}
                                          style={{ backgroundColor: color }}
                                          aria-label={`상의 색상 ${index + 1}`}
                                          aria-pressed={
                                            selectedTopColor === color
                                          }
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div className="h-[85px] w-px bg-[#E9E0D3]" />

                                  <div
                                    className={`flex flex-col gap-3 ${selectedTop === "원피스" ? "opacity-50" : ""}`}
                                  >
                                    <span className="font-mulish text-sm text-[#4A423C]">
                                      하의 색상
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {clothingColors.map((color, index) => (
                                        <button
                                          key={`bottom-${color}`}
                                          type="button"
                                          onClick={() =>
                                            setSelectedBottomColor(color)
                                          }
                                          disabled={selectedTop === "원피스"}
                                          className={`${profileColorButtonClass(selectedBottomColor === color)} disabled:cursor-not-allowed`}
                                          style={{ backgroundColor: color }}
                                          aria-label={`하의 색상 ${index + 1}`}
                                          aria-pressed={
                                            selectedBottomColor === color
                                          }
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          className="flex h-14 w-full max-w-[706px] items-center justify-center rounded-xl border border-[#B75A34] bg-[#D99B82] px-4 py-4 font-newsreader text-base text-black transition-colors hover:bg-[#C4836E] hover:text-white"
                        >
                          저장하기
                        </button>
                      </div>
                    </div>
                  )}

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
                            {driveFilesError && (
                              <p className="font-mulish text-xs text-red-600">
                                {driveFilesError}
                              </p>
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
                                    className="w-full rounded-[7px] border border-[#C0BDBD] bg-white px-3 py-2 font-mulish text-xs text-[#4A423C] placeholder:text-[#898787]"
                                  />
                                  <input
                                    type="text"
                                    value={addViewerRelation}
                                    onChange={(e) =>
                                      setAddViewerRelation(e.target.value)
                                    }
                                    placeholder="관계를 입력하세요"
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
                                onClick={handleConfirmLegacyMessage}
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
                              maxLength={100}
                              placeholder="(최대 100자)"
                              className="h-[154px] w-full max-w-[743px] resize-none rounded-[7px] border border-[#C0BDBD] bg-white p-6 font-newsreader text-base text-[#898787] placeholder:text-[#898787]"
                            />
                          </div>

                          {driveConnected && (
                            <>
                              <div className="border-t border-[#E9E0D3]" />

                              <div className="flex flex-col gap-[18px] pl-6">
                                <div className="flex max-w-[740px] items-center justify-between">
                                  <div className="flex items-center gap-2 font-mulish text-sm text-[#898787]">
                                    <span>6</span>
                                    <span>연동된 사진을 확인해보세요.</span>
                                    {isEditingPhotos &&
                                      selectedPhotos.size > 0 && (
                                        <span className="text-[#898787]">
                                          {selectedPhotos.size}개 선택됨
                                        </span>
                                      )}
                                  </div>
                                  {driveFiles.length > 0 && (
                                    <div className="flex items-center gap-2">
                                      {isEditingPhotos ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={handleDeleteSelectedPhotos}
                                            className="rounded-lg bg-[#9E2121] px-[18px] py-1 font-mulish text-xs text-white transition-colors hover:bg-[#861C1C]"
                                          >
                                            삭제
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleFinishEditingPhotos}
                                            className="rounded-lg border border-[#4B3F39] bg-[#776257] px-[18px] py-1 font-mulish text-xs text-white transition-colors hover:bg-[#5E4E47]"
                                          >
                                            완료
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={handleEditLegacyPhotos}
                                          className="rounded-lg border border-[#4B3F39] bg-[#776257] px-[18px] py-1 font-mulish text-xs text-white transition-colors hover:bg-[#5E4E47]"
                                        >
                                          편집
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {driveFilesLoading ? (
                                  <p className="font-mulish text-sm text-[#898787]">
                                    Drive 사진을 불러오는 중...
                                  </p>
                                ) : driveFiles.length > 0 ? (
                                  <div className="scrollbar-thin h-[360px] max-w-[743px] overflow-y-auto">
                                    <div className="grid grid-cols-3 gap-2">
                                      {driveFiles.map((file) => {
                                        const isPhotoSelected =
                                          selectedPhotos.has(file.id);

                                        return (
                                          <button
                                            key={file.id}
                                            type="button"
                                            onClick={() => {
                                              if (isEditingPhotos) {
                                                togglePhotoSelection(file.id);
                                              }
                                            }}
                                            disabled={!isEditingPhotos}
                                            className={`relative aspect-square overflow-hidden rounded-lg bg-[#F6F6F6] ${
                                              isEditingPhotos
                                                ? "cursor-pointer"
                                                : "cursor-default"
                                            }`}
                                          >
                                            {isEditingPhotos && (
                                              <span
                                                className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                                  isPhotoSelected
                                                    ? "border-transparent bg-[#9BB073]"
                                                    : "border-white bg-transparent"
                                                }`}
                                              >
                                                {isPhotoSelected && (
                                                  <svg
                                                    viewBox="0 0 12 12"
                                                    aria-hidden="true"
                                                    className="h-3 w-3 text-white"
                                                  >
                                                    <path
                                                      d="M2 6.2L4.8 9L10 3"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      strokeWidth="1.8"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                    />
                                                  </svg>
                                                )}
                                              </span>
                                            )}
                                            {file.thumbnailUrl ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                src={file.thumbnailUrl}
                                                alt={file.name}
                                                className="h-full w-full rounded-lg object-cover"
                                              />
                                            ) : (
                                              <div className="flex aspect-square h-full w-full items-center justify-center rounded-lg px-2">
                                                <span className="truncate text-center font-mulish text-xs text-[#898787]">
                                                  {file.name}
                                                </span>
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="font-mulish text-sm text-[#898787]">
                                    연동된 이미지가 없습니다.
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveLegacy}
                          className="flex h-14 w-full max-w-[706px] items-center justify-center rounded-xl border border-[#B75A34] bg-[#D99B82] px-4 py-4 font-newsreader text-base text-black transition-colors hover:bg-[#C4836E] hover:text-white"
                        >
                          저장하기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </div>
    </>
  );
}
