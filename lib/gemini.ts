// Google Gemini API (서버 전용). 키·모델은 .env.local 의 GEMINI_API_KEY, GEMINI_MODEL.
// 작게 줄인 사진 여러 장(JPEG)을 한 요청에 보내, 사진마다 분류(여러 개)와 한 줄 설명을 JSON 으로 받아요.
import { AI_PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/photo-categories";

// 빠르고 저렴한 이미지 이해용 모델. Google 이 이름을 바꾸면 GEMINI_MODEL 로 바꿔요.
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

export const geminiModel = () => process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY?.trim());

const PROMPT = `You classify photos from a family's private memorial archive. Return JSON only.
You will receive several photos. Each photo is preceded by a line "Photo <number>".
For EACH photo, choose ALL categories that apply (an empty list is allowed):
- "face": at least one person's face is clearly visible and recognizable (not from behind, not tiny, not covered).
- "solo": exactly ONE person is in the photo (a selfie or a portrait of one person, even if the face is not visible).
- "group": TWO or more people are in the photo together (couple, family, friends, group photo).
- "hospital": hospital, illness or medical treatment (hospital room/bed, IV drip, wheelchair in a medical setting, medicine, medical equipment, patient gown).
- "scenery": mainly landscape, place, food, objects, animals or things, with no person as the subject.
- "chat": a screenshot of a messenger or chat conversation (e.g. KakaoTalk, SMS, Instagram DM).
Never choose both "solo" and "group". Choose neither when there is no person.
Also write "description": one short, gentle Korean sentence (max 40 characters) describing the photo, without guessing names.
Return one result per photo, with "photo" set to the photo's number.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    results: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          photo: { type: "INTEGER" },
          categories: { type: "ARRAY", items: { type: "STRING", enum: [...AI_PHOTO_CATEGORIES] } },
          description: { type: "STRING" },
        },
        required: ["photo", "categories", "description"],
      },
    },
  },
  required: ["results"],
};

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    // 사용량 한도(429)일 때 Google 이 알려 준 대기 시간(초)
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

// Google 오류 본문의 RetryInfo.retryDelay ("23s") → 초
function readRetryDelay(detail: string) {
  const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(detail);
  return match ? Math.ceil(Number(match[1])) : undefined;
}

export type PhotoClassification = { categories: PhotoCategory[]; description: string };

// 사진 여러 장을 한 번에 분류. 돌려주는 배열은 받은 순서와 같고, 답이 빠진 사진은 null.
export async function classifyPhotos(
  photos: Array<{ jpeg: Buffer; fileName: string }>,
): Promise<Array<PhotoClassification | null>> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY 가 설정되지 않았어요.", 503);
  if (photos.length === 0) return [];

  const parts: Array<Record<string, unknown>> = [{ text: PROMPT }];
  photos.forEach((photo, index) => {
    parts.push({ text: `Photo ${index + 1} (file name, may be meaningless: ${photo.fileName.slice(0, 80)})` });
    parts.push({ inline_data: { mime_type: "image/jpeg", data: photo.jpeg.toString("base64") } });
  });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel())}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0,
        },
      }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // 키·모델 이름 문제를 화면에서 알아볼 수 있게 (키 값은 절대 넣지 않음)
    if (res.status === 404) throw new GeminiError(`Gemini 모델 '${geminiModel()}'을(를) 찾을 수 없어요. GEMINI_MODEL 을 확인해 주세요.`, 502);
    if (res.status === 400 && detail.includes("API_KEY")) throw new GeminiError("Gemini API 키가 올바르지 않아요.", 502);
    if (res.status === 429) {
      throw new GeminiError("Gemini 사용량 한도에 걸렸어요.", 429, readRetryDelay(detail) ?? 30);
    }
    throw new GeminiError(`Gemini 요청이 실패했어요 (${res.status}).`, 502);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

  let parsed: { results?: Array<{ photo?: unknown; categories?: unknown; description?: unknown }> } = {};
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw new GeminiError("Gemini 답을 읽지 못했어요.", 502);
  }

  const byNumber = new Map<number, PhotoClassification>();
  for (const item of parsed.results ?? []) {
    const number = Number(item.photo);
    if (!Number.isInteger(number) || number < 1 || number > photos.length || byNumber.has(number)) continue;
    let categories = (Array.isArray(item.categories) ? item.categories : []).filter(
      (category, index, all): category is PhotoCategory =>
        (AI_PHOTO_CATEGORIES as readonly unknown[]).includes(category) && all.indexOf(category) === index,
    );
    // 혼자·단체가 같이 오면 단체만
    if (categories.includes("solo") && categories.includes("group")) categories = categories.filter((c) => c !== "solo");
    const description = typeof item.description === "string" ? item.description.trim().slice(0, 80) : "";
    byNumber.set(number, { categories, description });
  }

  return photos.map((_, index) => byNumber.get(index + 1) ?? null);
}
