import { readEnv } from "@/lib/config/env";
import { mockDailyPricePages } from "@/lib/kamis/fixtures";
import {
  type KamisClient,
  type KamisPriceRequest,
  type KamisPriceResponse,
} from "@/lib/kamis/types";
import {
  parseKamisRawResponse,
  type KamisResponseFormat,
} from "@/lib/kamis/raw";

type FetchLike = typeof fetch;
const DEFAULT_KAMIS_BASE_URL =
  "http://www.kamis.or.kr/service/price/xml.do?action=dailyPriceByCategoryList";

export class MockKamisClient implements KamisClient {
  async fetchDailyPrices(
    request: KamisPriceRequest = {},
  ): Promise<KamisPriceResponse> {
    const pageIndex = request.cursor === "page-2" ? 1 : 0;
    return mockDailyPricePages[pageIndex] ?? {
      sourceCode: "KAMIS",
      records: [],
      nextCursor: null,
    };
  }
}

export class HttpKamisClient implements KamisClient {
  constructor(
    private readonly options: {
      baseUrl: string;
      certId: string;
      certKey: string;
      fetcher?: FetchLike;
      maxRetries?: number;
      retryDelayMs?: number;
      responseFormat?: KamisResponseFormat;
    },
  ) {}

  async fetchDailyPrices(
    request: KamisPriceRequest = {},
  ): Promise<KamisPriceResponse> {
    const fetcher = this.options.fetcher ?? fetch;
    const url = new URL(this.options.baseUrl);
    url.searchParams.set("p_cert_id", this.options.certId);
    url.searchParams.set("p_cert_key", this.options.certKey);
    url.searchParams.set(
      "p_returntype",
      this.options.responseFormat === "xml" ? "xml" : "json",
    );

    if (request.cursor) {
      url.searchParams.set("cursor", request.cursor);
    }

    if (request.limit) {
      url.searchParams.set("limit", String(request.limit));
    }

    const response = await fetchWithRetry(url, {
      fetcher,
      maxRetries: this.options.maxRetries ?? 2,
      retryDelayMs: this.options.retryDelayMs ?? 300,
    });

    return parseKamisRawResponse(response, this.options.responseFormat ?? "auto");
  }
}

export function createKamisClient(
  source: Partial<Record<string, string | undefined>> = process.env,
): KamisClient {
  const env = readEnv(source);

  if (!env.KAMIS_CERT_ID || !env.KAMIS_CERT_KEY) {
    return new MockKamisClient();
  }

  return new HttpKamisClient({
    baseUrl: env.KAMIS_BASE_URL ?? DEFAULT_KAMIS_BASE_URL,
    certId: env.KAMIS_CERT_ID,
    certKey: env.KAMIS_CERT_KEY,
    responseFormat: env.KAMIS_RESPONSE_FORMAT,
  });
}

async function fetchWithRetry(
  url: URL,
  options: {
    fetcher: FetchLike;
    maxRetries: number;
    retryDelayMs: number;
  },
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    try {
      const response = await options.fetcher(url);

      if (response.ok) {
        return response;
      }

      lastError = new Error(`KAMIS request failed with ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < options.maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, options.retryDelayMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("KAMIS request failed");
}
