import { NextResponse, userAgent, type NextRequest } from "next/server";
import {
  PET_MODE_HEADER,
  PET_MODE_OVERRIDE_COOKIE,
  PET_MODE_QUERY,
  PET_MODE_SWITCH_ENABLED,
} from "@/lib/pet-mode";

// 요청마다 "반려동물 흐름(휴대폰)인지"를 정해서 화면에 머리글로 넘겨요 (lib/pet-mode.ts 참고)
export function proxy(request: NextRequest) {
  const isPhone = userAgent(request).device.type === "mobile";

  // 개발 중 확인용 스위치: ?pet=1 / ?pet=0 은 쿠키로 기억, ?pet=auto 는 지우기
  const query = PET_MODE_SWITCH_ENABLED ? request.nextUrl.searchParams.get(PET_MODE_QUERY) : null;
  const saved = PET_MODE_SWITCH_ENABLED ? request.cookies.get(PET_MODE_OVERRIDE_COOKIE)?.value : undefined;
  const override = query === "1" || query === "0" ? query : query === "auto" ? undefined : saved;
  const petMode = override !== undefined ? override === "1" : isPhone;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PET_MODE_HEADER, petMode ? "1" : "0");
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (query === "1" || query === "0") {
    response.cookies.set(PET_MODE_OVERRIDE_COOKIE, query, { path: "/", sameSite: "lax" });
  } else if (query === "auto") {
    response.cookies.delete(PET_MODE_OVERRIDE_COOKIE);
  }
  return response;
}

export const config = {
  // 화면 주소에만 (API · Next 내부 파일 · public 그림/소리 파일은 빼요)
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico|m4a|mp3|woff2?)$).*)"],
};
