// 로그인 입구: /login?callbackUrl=… (로그인 뒤 돌아갈 곳)
export const LOGIN_PATH = "/login";

// 돌아갈 곳은 우리 사이트 안의 경로만 (다른 사이트로 보내는 주소 막기)
export function safeCallbackUrl(value: string | null | undefined, fallback = "/mainland") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

export function loginUrl(callbackUrl: string) {
  return `${LOGIN_PATH}?callbackUrl=${encodeURIComponent(safeCallbackUrl(callbackUrl))}`;
}
