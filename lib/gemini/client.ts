import { readEnv } from "@/lib/config/env";
import type {
  GeminiClient,
  GeminiEnrichment,
  PageDraftInput,
} from "@/lib/gemini/types";

type FetchLike = typeof fetch;

export class MockGeminiClient implements GeminiClient {
  async enrichPage(input: PageDraftInput): Promise<GeminiEnrichment> {
    if (input.itemCode.includes("WEAK")) {
      return {
        commentary: "데이터가 부족합니다.",
        faq: [],
        uniquePoints: [],
      };
    }

    const base =
      `${input.itemName} 시세는 최근 관측값과 비교 지표를 함께 봐야 합니다. ` +
      "단일 가격만으로 판단하지 않고 전일, 전월 이동평균, 전년 이동평균, 평년 값을 나란히 확인하면 구매 타이밍의 위험을 줄일 수 있습니다. " +
      "현재 페이지는 검증된 원자료 포인트를 중심으로 가격 흐름과 결측 여부를 분리해 설명합니다. ";

    return {
      commentary: base + base,
      faq: [
        {
          question: `${input.itemName} 가격은 매일 바뀌나요?`,
          answer:
            "공개 시세는 조사일과 품목 조건에 따라 달라집니다. 같은 품목이라도 등급, 거래 구분, 지역 차원이 확정되면 별도 비교가 필요합니다.",
        },
        {
          question: "전년 대비 수치는 어떻게 봐야 하나요?",
          answer:
            "전년 대비 값은 현재 가격 수준이 과거 같은 시점보다 높은지 낮은지 판단하는 보조 지표입니다. 결측값은 임의로 보간하지 않습니다.",
        },
        {
          question: "원/kg 환산은 제공되나요?",
          answer:
            "단위 의미가 검증되기 전까지 원/kg 환산은 표시하지 않습니다. 무게 기준이 확인되면 정규화 구현만 교체해 반영합니다.",
        },
      ],
      uniquePoints: input.rawData.uniqueDataPoints,
    };
  }
}

export class HttpGeminiClient implements GeminiClient {
  constructor(
    private readonly options: {
      apiKey: string;
      fetcher?: FetchLike;
    },
  ) {}

  async enrichPage(input: PageDraftInput): Promise<GeminiEnrichment> {
    const fetcher = this.options.fetcher ?? fetch;
    const response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.options.apiKey}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "한국어 농수산물 시세 페이지용 보강 문장을 생성하되 JSON으로만 응답하세요. " +
                    JSON.stringify(input),
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed with ${response.status}`);
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") {
      throw new Error("Gemini response did not include text content.");
    }

    return JSON.parse(text) as GeminiEnrichment;
  }
}

export function createGeminiClient(
  source: Partial<Record<string, string | undefined>> = process.env,
): GeminiClient {
  const env = readEnv(source);

  if (!env.GEMINI_API_KEY) {
    return new MockGeminiClient();
  }

  return new HttpGeminiClient({ apiKey: env.GEMINI_API_KEY });
}

