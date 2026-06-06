import { describe, expect, it } from "vitest";
import {
  getQualityKeywordPages,
  keywordPages,
} from "@/lib/content/keyword-pages";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

describe("keyword landing pages", () => {
  it("keeps primary keywords unique across intents", () => {
    const keywords = keywordPages.map((page) => page.primaryKeyword);
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it("adds quality keyword pages to sitemap", () => {
    const entries = buildSitemapEntries("https://example.com", [], getQualityKeywordPages());
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://example.com/timing/baechu");
    expect(urls).toContain("https://example.com/guide/normal-price");
  });
});

