// 반려동물 흐름(휴대폰) 판단에 쓰는 이름들 — proxy.ts · app/layout.tsx · 화면이 함께 써요
//
// - 휴대폰으로 접속하면 반려동물 흐름, 노트북·데스크톱·태블릿은 원래 흐름 (화면을 돌려도 그대로)
// - 판단은 proxy.ts 가 요청마다 한 번 하고, 결과를 아래 머리글(PET_MODE_HEADER)로 화면에 넘겨요
// - 개발 중 확인용: 주소 끝에 ?pet=1 (켜기) / ?pet=0 (끄기) / ?pet=auto (기기에 맡기기)
//   `npm run dev` 개발 서버에서만 동작하고, 배포 사이트에서는 무시돼요

export const PET_MODE_HEADER = "x-afterlife-pet";
export const PET_MODE_QUERY = "pet";
export const PET_MODE_OVERRIDE_COOKIE = "afterlife-pet-override";

// 개발 서버에서만 ?pet= 스위치를 받아요
export const PET_MODE_SWITCH_ENABLED = process.env.NODE_ENV === "development";
