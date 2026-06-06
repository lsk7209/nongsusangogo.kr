import { describe, expect, it } from "vitest";
import { readEnv, requireDatabaseUrl } from "@/lib/config/env";

describe("env config", () => {
  it("defaults guarded feature flags", () => {
    const env = readEnv({});

    expect(env.REGION_ENABLED).toBe(false);
    expect(env.DATA_LICENSE_CONFIRMED).toBe(false);
    expect(env.HEADLINE_RANK).toBe("middle");
  });

  it("accepts analytics and adsense configuration names", () => {
    const env = readEnv({
      GA4_MEASUREMENT_ID: "G-TEST123",
      GOOGLE_ADSENSE_CLIENT_ID: "ca-pub-123",
      GOOGLE_ADSENSE_ARTICLE_SLOT: "1234567890",
    });

    expect(env.GA4_MEASUREMENT_ID).toBe("G-TEST123");
    expect(env.GOOGLE_ADSENSE_CLIENT_ID).toBe("ca-pub-123");
    expect(env.GOOGLE_ADSENSE_ARTICLE_SLOT).toBe("1234567890");
  });

  it("requires database url for database operations", () => {
    expect(() => requireDatabaseUrl({})).toThrow("TURSO_DATABASE_URL");
  });
});
