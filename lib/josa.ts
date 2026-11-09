// 이름 뒤 조사를 받침에 맞춰 붙임: josa("수민", "을/를") → "수민을", josa("사랑이", "을/를") → "사랑이를"
// 마지막 글자가 한글이 아니면(영문, 숫자) "Amy을(를)"처럼 괄호로 둘 다 적음
const PAIRS = {
  "을/를": ["을", "를"],
  "이/가": ["이", "가"],
  "은/는": ["은", "는"],
  "과/와": ["과", "와"],
  "으로/로": ["으로", "로"],
  "이에요/예요": ["이에요", "예요"],
} as const;

export type JosaPair = keyof typeof PAIRS;

export function josa(word: string, pair: JosaPair) {
  const [afterFinal, afterVowel] = PAIRS[pair];
  const code = word.trimEnd().charCodeAt(word.trimEnd().length - 1) - 0xac00;
  if (!(code >= 0 && code <= 11171)) return `${word}${afterFinal}(${afterVowel})`;
  const final = code % 28; // 0이면 받침 없음, 8이면 ㄹ 받침
  // "으로/로"는 ㄹ 받침 뒤에도 "로" (서울로)
  if (pair === "으로/로" && final === 8) return `${word}${afterVowel}`;
  return `${word}${final ? afterFinal : afterVowel}`;
}
