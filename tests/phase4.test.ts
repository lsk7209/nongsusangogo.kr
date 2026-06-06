import { describe, expect, it } from "vitest";
import { getHubPages, getQualityPassedPages } from "@/lib/content/site-pages";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

describe("phase 4 site and seo", () => {
  it("keeps rejected pages out of public page lists", () => {
    const pages = getQualityPassedPages();

    expect(pages.map((page) => page.slug)).not.toContain("weak-sample");
  });

  it("filters hub pages by category", () => {
    const pages = getHubPages("fruit");

    expect(pages).toHaveLength(1);
    expect(pages[0]?.slug).toBe("apple-price");
  });

  it("builds sitemap from quality passed pages only", () => {
    const entries = buildSitemapEntries("https://example.com");
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://example.com/items/baechu-price");
    expect(urls).not.toContain("https://example.com/items/weak-sample");
  });

  it("supports configured site url for sitemap entries", () => {
    const entries = buildSitemapEntries("https://nongsusangogo.example");

    expect(entries[0]?.url).toBe("https://nongsusangogo.example");
  });

  it("adds only published editorial posts to sitemap", () => {
    const beforeFirst = buildSitemapEntries(
      "https://example.com",
      undefined,
      undefined,
      new Date("2026-06-05T14:59:00.000Z"),
    );
    const afterImmediate = buildSitemapEntries(
      "https://example.com",
      undefined,
      undefined,
      new Date("2026-06-05T15:00:00.000Z"),
    );
    const beforeNext = buildSitemapEntries(
      "https://example.com",
      undefined,
      undefined,
      new Date("2026-06-06T18:59:00.000Z"),
    );

    expect(beforeFirst.map((entry) => entry.url)).not.toContain(
      "https://example.com/blog/cucumber-summer-price-buying-window",
    );
    expect(afterImmediate.map((entry) => entry.url)).toContain(
      "https://example.com/blog/cucumber-summer-price-buying-window",
    );
    expect(afterImmediate.map((entry) => entry.url)).toContain(
      "https://example.com/blog/stir-fry-vegetable-choice",
    );
    expect(beforeNext.map((entry) => entry.url)).not.toContain(
      "https://example.com/blog/radish-soup-seasonal-choice",
    );
  });
});
