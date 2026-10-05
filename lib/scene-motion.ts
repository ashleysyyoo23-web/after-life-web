import type { SeagullConfig } from "@/components/IslandSeagull";
import type { SkyRange } from "@/components/SkyBird";
import type { PalmConfig, PlantsConfig } from "@/components/SwayingPlants";

// 섬 안쪽 화면들의 움직임 설정 (배경 그림에서 오려낸 자리·크기, 모두 16:9 무대 기준 %).
// 전체 지도(/mainland)는 각 부품의 기본값을 써요.
export type SceneMotionConfig = {
  sea?: { mask: string; fade: [number, number] }; // 바다 물결
  palms?: PalmConfig[]; // 밑동을 축으로 살랑이는 나무
  plants?: PlantsConfig[]; // 바람에 일렁이는 꽃·덤불
  seagull?: SeagullConfig; // 모래밭을 걷는 갈매기
  birds?: { sky: SkyRange; width: number; src?: string; starts: Array<{ start: [number, number]; size: number }> }; // 하늘 새
};

// 마이랜드 (/myland): 메인 랜드 섬을 가까이서 본 화면
export const MYLAND_MOTION: SceneMotionConfig = {
  sea: { mask: "/scenes/myland-sea-mask.png", fade: [52, 62] },
  palms: [
    { src: "/scenes/myland-palm-left.png", left: 33.672, top: 32.083, width: 7.083, origin: "87.1% 99.8%", duration: 5.6, delay: -1.2 },
    { src: "/scenes/myland-palm-mid.png", left: 42.344, top: 18.843, width: 8.333, origin: "92.5% 99.8%", duration: 6.4, delay: -3.1 },
    { src: "/scenes/myland-palm-right.png", left: 55.833, top: 23.241, width: 8.411, origin: "11.8% 99.8%", duration: 7.1, delay: -0.4 },
  ],
  plants: [{ src: "/scenes/myland-plants.webp", left: 25.99, top: 38.981, width: 49.583 }],
  seagull: {
    src: "/scenes/myland-seagull.png",
    width: 5.573,
    feet: [57.9, 98.2],
    start: [52.06, 75.88],
    walkArea: [
      [76.9, 72.9], [74.0, 71.5], [67.9, 65.8], [67.4, 66.4], [66.4, 64.7], [65.0, 67.1], [63.6, 65.6],
      [62.3, 68.1], [61.3, 67.8], [60.8, 68.8], [59.3, 66.8], [58.0, 69.4], [56.8, 68.2], [53.6, 70.6],
      [50.4, 68.4], [48.8, 68.5], [43.9, 71.8], [41.7, 70.2], [39.4, 72.5], [36.6, 71.0], [35.3, 68.5],
      [35.6, 66.5], [33.9, 66.6], [32.7, 68.8], [32.1, 67.7], [30.6, 68.5], [29.4, 67.1], [28.7, 68.3],
      [27.7, 66.8], [27.2, 67.5], [27.2, 75.3], [32.0, 76.8], [33.7, 75.8], [39.6, 77.1], [42.6, 76.3],
      [50.2, 77.9], [50.9, 76.9], [57.3, 76.9], [60.3, 75.6], [63.9, 76.6], [64.4, 75.6], [69.6, 74.5],
      [74.5, 75.1], [76.2, 74.5],
    ],
  },
  birds: {
    sky: { left: 4, right: 96, top: 8, bottom: 40 },
    width: 4.2,
    starts: [
      { start: [80, 22], size: 1 },
      { start: [18, 14], size: 0.8 },
    ],
  },
};

// 추모 커뮤니티 (/community): 꽃이 그려진 돌탑 섬. 돌에 그려진 꽃은 그대로, 돌 사이 꽃과 풀만 살랑
export const COMMUNITY_MOTION: SceneMotionConfig = {
  sea: { mask: "/scenes/community-sea-mask.png", fade: [79, 86] },
  plants: [{ src: "/scenes/community-plants.webp", left: 20.208, top: 60.509, width: 65.677 }],
  birds: {
    sky: { left: 4, right: 96, top: 8, bottom: 34 },
    width: 3.6,
    starts: [
      { start: [78, 18], size: 1 },
      { start: [22, 26], size: 0.8 },
    ],
  },
};

// 저장소 (/storage): 나무집이 있는 섬. 그림 속 새가 날아다니고, 집 아래 덤불과 벽 덩굴이 살랑 (계단은 그대로)
export const STORAGE_MOTION: SceneMotionConfig = {
  sea: { mask: "/scenes/storage-sea-mask.png", fade: [70, 80] },
  plants: [{ src: "/scenes/storage-plants.webp", left: 54.661, top: 23.102, width: 37.109 }],
  birds: {
    sky: { left: 4, right: 96, top: 8, bottom: 42 },
    width: 4.3,
    src: "/scenes/storage-bird.png",
    starts: [
      { start: [54, 21.6], size: 1 },
      { start: [20, 14], size: 0.8 },
    ],
  },
};

// 저장소 안 (/storageinside): 액자가 걸린 섬. 화분 잎과 꽃병 꽃이 살랑, 언덕 들꽃이 일렁
export const STORAGE_INSIDE_MOTION: SceneMotionConfig = {
  sea: { mask: "/scenes/inside-sea-mask.png", fade: [70, 80] },
  palms: [
    { src: "/scenes/inside-pot.png", left: 20.547, top: 44.907, width: 11.354, origin: "51.6% 99.8%", duration: 6.2, delay: -2 },
    { src: "/scenes/inside-vase.png", left: 45.312, top: 63.056, width: 4.375, origin: "48.2% 99.1%", duration: 4.8, delay: -0.7 },
  ],
  plants: [{ src: "/scenes/inside-plants.webp", left: 29.635, top: 61.528, width: 53.125 }],
  birds: {
    sky: { left: 4, right: 96, top: 6, bottom: 30 },
    width: 3.4,
    starts: [
      { start: [80, 14], size: 1 },
      { start: [16, 22], size: 0.8 },
    ],
  },
};
