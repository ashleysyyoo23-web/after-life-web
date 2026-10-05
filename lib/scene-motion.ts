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
  birds?: { sky: SkyRange; width: number; starts: Array<{ start: [number, number]; size: number }> }; // 하늘 새
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
