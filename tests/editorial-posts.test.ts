import { describe, expect, it } from "vitest";
import {
  editorialPosts,
  getPublishedEditorialPosts,
} from "@/lib/content/editorial-posts";
import { keywordPages } from "@/lib/content/keyword-pages";
import { sitePages } from "@/lib/content/site-pages";

const mojibakePattern = /�|怨|媛|濡|鍮|諛|寃|쇱|띿|쨌|鍮좊|異쒖|援ъ|듬\?|紐|臾|醫|湲|踰|占/;

describe("editorial post package", () => {
  it("contains 123 priority publish-ready Codex-only posts", () => {
    expect(editorialPosts).toHaveLength(123);
    expect(editorialPosts.every((post) => post.codexOnly)).toBe(true);
  });

  it("keeps titles, slugs, and main keywords unique", () => {
    expect(new Set(editorialPosts.map((post) => post.title)).size).toBe(123);
    expect(new Set(editorialPosts.map((post) => post.slug)).size).toBe(123);
    expect(new Set(editorialPosts.map((post) => post.mainKeyword)).size).toBe(
      123,
    );
  });

  it("does not duplicate existing static page titles or slugs", () => {
    const existingTitles = new Set([
      ...sitePages.map((page) => page.title),
      ...keywordPages.map((page) => page.title),
    ]);
    const existingSlugs = new Set([
      ...sitePages.map((page) => page.slug),
      ...keywordPages.map((page) => page.slug),
    ]);

    for (const post of editorialPosts) {
      expect(existingTitles.has(post.title)).toBe(false);
      expect(existingSlugs.has(post.slug)).toBe(false);
    }
  });

  it("meets publish-ready keyword, trust, and structure requirements", () => {
    for (const post of editorialPosts) {
      expect(post.qualityScore).toBeGreaterThanOrEqual(90);
      expect(post.title).toContain(post.mainKeyword);
      expect(
        post.expandedKeywords.some((keyword) => post.title.includes(keyword)),
      ).toBe(true);
      expect(post.subtitle).toContain(post.mainKeyword);
      expect(
        post.expandedKeywords.some((keyword) =>
          post.subtitle.includes(keyword),
        ),
      ).toBe(true);
      expect(post.expandedKeywords.length).toBeGreaterThanOrEqual(3);
      expect(post.quickAnswer.length).toBeGreaterThanOrEqual(80);
      expect(post.body.length).toBeGreaterThanOrEqual(5);
      expect(
        post.body.join("").length +
          post.deepDives.map((section) => section.body).join("").length,
      ).toBeGreaterThanOrEqual(1600);
      expect(post.deepDives.length).toBeGreaterThanOrEqual(3);
      expect(
        post.deepDives.every(
          (section) => section.heading.length >= 8 && section.body.length >= 180,
        ),
      ).toBe(true);
      expect(post.checklist.length).toBeGreaterThanOrEqual(4);
      expect(post.faq.length).toBeGreaterThanOrEqual(2);
      expect(post.internalLinks.length).toBeGreaterThanOrEqual(2);
      expect(post.externalSource.href).toMatch(/^https:\/\//);
      expect(post.externalSource.note).not.toHaveLength(0);
      expect(post.cta.length).toBeGreaterThanOrEqual(20);
      expect(post.contentElements.length).toBeGreaterThanOrEqual(5);
      expect(post.accentColors).toHaveLength(2);
      expect(
        post.accentColors.every((color) => /^#[0-9a-f]{6}$/i.test(color)),
      ).toBe(true);
    }
  });

  it("does not expose mojibake or obvious thin-content patterns", () => {
    const paragraphs = editorialPosts.flatMap((post) => post.body);
    const uniqueParagraphs = new Set(paragraphs);
    const ctas = new Set(editorialPosts.map((post) => post.cta));
    const elementSets = new Set(
      editorialPosts.map((post) => post.contentElements.join("|")),
    );
    const text = editorialPosts
      .map((post) =>
        [
          post.title,
          post.subtitle,
          post.excerpt,
          post.quickAnswer,
          ...post.body,
          ...post.deepDives.flatMap((section) => [
            section.heading,
            section.body,
          ]),
          ...post.checklist,
          ...post.faq.flatMap((item) => [item.question, item.answer]),
          post.cta,
        ].join(" "),
      )
      .join(" ");

    expect(text).not.toMatch(mojibakePattern);
    expect(uniqueParagraphs.size).toBe(paragraphs.length);
    expect(ctas.size).toBeGreaterThanOrEqual(18);
    expect(elementSets.size).toBeGreaterThanOrEqual(12);
  });

  it("provides structured data ready fields for rich article rendering", () => {
    for (const post of editorialPosts) {
      expect(post.quickAnswer).toContain(post.mainKeyword);
      expect(new Set(post.deepDives.map((section) => section.heading)).size).toBe(
        post.deepDives.length,
      );
      expect(
        post.deepDives.some((section) => section.body.includes(post.mainKeyword)),
      ).toBe(true);
      expect(post.faq.every((item) => item.question.endsWith("?"))).toBe(true);
      expect(post.metaDescription).toContain(post.mainKeyword);
      expect(post.externalSource.label.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("publishes ten posts immediately and schedules the rest every five hours", () => {
    const immediatePublishAt = editorialPosts[0]!.publishAt;

    for (let index = 0; index < 10; index += 1) {
      expect(editorialPosts[index]!.publishAt).toBe(immediatePublishAt);
    }

    for (let index = 11; index < editorialPosts.length; index += 1) {
      const previous = new Date(editorialPosts[index - 1]!.publishAt).getTime();
      const current = new Date(editorialPosts[index]!.publishAt).getTime();
      expect(current - previous).toBe(5 * 60 * 60 * 1000);
    }
  });

  it("only exposes posts after their scheduled time", () => {
    const beforeImmediate = new Date("2026-06-05T14:59:00.000Z");
    const immediateSlot = new Date("2026-06-05T15:00:00.000Z");
    const beforeNextSlot = new Date("2026-06-06T18:59:00.000Z");
    const nextSlot = new Date("2026-06-06T19:00:00.000Z");

    expect(getPublishedEditorialPosts(beforeImmediate)).toHaveLength(0);
    expect(getPublishedEditorialPosts(immediateSlot)).toHaveLength(10);
    expect(getPublishedEditorialPosts(beforeNextSlot)).toHaveLength(10);
    expect(getPublishedEditorialPosts(nextSlot)).toHaveLength(11);
  });

  it("keeps immediate internal blog links published", () => {
    const immediatePosts = getPublishedEditorialPosts(
      new Date("2026-06-05T15:00:00.000Z"),
    );
    const immediateSlugs = new Set(immediatePosts.map((post) => post.slug));
    const allSlugs = new Set(editorialPosts.map((post) => post.slug));

    expect(immediateSlugs.has("soup-vegetable-cost")).toBe(true);
    expect(immediateSlugs.has("stir-fry-vegetable-choice")).toBe(true);

    for (const post of immediatePosts) {
      for (const link of post.internalLinks) {
        const blogSlug = link.href.match(/^\/blog\/(.+)$/)?.[1];

        if (blogSlug && allSlugs.has(blogSlug)) {
          expect(immediateSlugs.has(blogSlug)).toBe(true);
        }
      }
    }
  });
});
