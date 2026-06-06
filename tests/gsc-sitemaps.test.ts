import { describe, expect, it } from "vitest";
import { countSitemapUrls, hasGlobalRobotsBlock } from "@/lib/gsc/sitemaps";

describe("gsc sitemap preflight helpers", () => {
  it("counts sitemap loc entries", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/items/apple</loc></url>
</urlset>`;

    expect(countSitemapUrls(xml)).toBe(2);
  });

  it("detects global robots disallow", () => {
    expect(
      hasGlobalRobotsBlock(`User-agent: *
Disallow: /`),
    ).toBe(true);
    expect(
      hasGlobalRobotsBlock(`User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml`),
    ).toBe(false);
  });
});
