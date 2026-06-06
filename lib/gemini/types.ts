export type PageDraftInput = {
  slug: string;
  title: string;
  itemCode: string;
  itemName: string;
  regionName?: string | null;
  rawData: {
    uniqueDataPoints: string[];
    comparisons: Array<{
      label: string;
      current: number | null;
      basis: number | null;
    }>;
  };
};

export type GeneratedFaq = {
  question: string;
  answer: string;
};

export type GeminiEnrichment = {
  commentary: string;
  faq: GeneratedFaq[];
  uniquePoints: string[];
};

export interface GeminiClient {
  enrichPage(input: PageDraftInput): Promise<GeminiEnrichment>;
}

