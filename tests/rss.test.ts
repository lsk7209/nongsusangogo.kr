import { describe, expect, it } from "vitest";
import { GET as feedRedirect } from "@/app/feed.xml/route";
import { GET as rssRoute } from "@/app/rss.xml/route";
import {
  editorialPosts,
  getPublishedEditorialPosts,
} from "@/lib/content/editorial-posts";
import { buildRssFeed, escapeXml } from "@/lib/seo/rss";

describe("rss feed", () => {
  it("builds a valid RSS 2.0 feed from published editorial posts", () => {
    const now = new Date("2026-06-06T13:40:00.000Z");
    const posts = getPublishedEditorialPosts(now);
    const xml = buildRssFeed({
      siteUrl: "https://nongsusangogo.kr",
      posts,
      now,
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain("<channel>");
    expect(xml.match(/<item>/g)).toHaveLength(posts.length);
    expect(xml).toContain(
      "https://nongsusangogo.kr/blog/cucumber-summer-price-buying-window",
    );
    expect(xml).toContain(
      "https://nongsusangogo.kr/blog/tomato-retail-wholesale-gap",
    );
    expect(xml).toContain(
      "https://nongsusangogo.kr/blog/stir-fry-vegetable-choice",
    );
    expect(xml).not.toContain(
      "https://nongsusangogo.kr/blog/radish-soup-seasonal-choice",
    );
  });

  it("escapes XML special characters", () => {
    expect(escapeXml(`A&B <C> "D" 'E'`)).toBe(
      "A&amp;B &lt;C&gt; &quot;D&quot; &apos;E&apos;",
    );
  });

  it("serves rss.xml with the RSS content type", async () => {
    const response = await rssRoute();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/rss+xml",
    );
    expect(xml).toContain("<rss");
    expect(xml.match(/<item>/g)?.length ?? 0).toBe(
      getPublishedEditorialPosts().length,
    );
  });

  it("redirects feed.xml to rss.xml", () => {
    const response = feedRedirect();

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://nongsusangogo.kr/rss.xml",
    );
  });

  it("keeps future scheduled posts out of RSS", () => {
    const beforeFirst = new Date("2026-06-05T14:59:00.000Z");
    const xml = buildRssFeed({
      siteUrl: "https://nongsusangogo.kr",
      posts: getPublishedEditorialPosts(beforeFirst),
      now: beforeFirst,
    });

    expect(xml.match(/<item>/g)).toBeNull();
    expect(xml).not.toContain(editorialPosts[0]!.slug);
  });
});
