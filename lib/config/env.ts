import { z } from "zod";

const booleanFlag = z
  .string()
  .optional()
  .default("false")
  .transform((value) => value === "true");

const optionalRatio = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().min(0).max(1).optional(),
);

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1).optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  SITE_URL: z.string().url().default("https://nongsusangogo.kr"),
  GSC_SITE_URL: z.string().url().optional(),
  GSC_PROPERTY_URL: z.string().optional(),
  GSC_SITEMAP_URL: z.string().url().optional(),
  GSC_SERVICE_ACCOUNT_FILE: z.string().optional(),
  GSC_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GA4_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: z.string().optional(),
  GOOGLE_ADSENSE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID: z.string().optional(),
  GOOGLE_ADSENSE_ARTICLE_SLOT: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_ADSENSE_ARTICLE_SLOT: z.string().optional(),
  KAMIS_CERT_ID: z.string().optional(),
  KAMIS_CERT_KEY: z.string().optional(),
  KAMIS_BASE_URL: z.string().url().optional(),
  KAMIS_RESPONSE_FORMAT: z.enum(["auto", "xml", "json"]).default("auto"),
  KAMIS_PROBE_OUTPUT_PATH: z.string().default(".tmp/gate05-probe.json"),
  GEMINI_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().min(1).optional(),
  REGION_ENABLED: booleanFlag,
  HEADLINE_RANK: z.enum(["high", "middle", "low"]).default("middle"),
  DATA_LICENSE_CONFIRMED: booleanFlag,
  KAMIS_REGION_SOURCE: z
    .enum(["unknown", "free", "paid", "none"])
    .default("unknown"),
  WHOLESALE_RETAIL_MATCH_RATE: optionalRatio,
  UNIT_WEIGHT_SHARE: optionalRatio,
  BACKFILL_PAGING_CONFIRMED: booleanFlag,
  DATALAB_INTENT_CONFIRMED: booleanFlag,
  CPA_RATE_CONFIRMED: booleanFlag,
  UNIT_ECONOMICS_CONFIRMED: booleanFlag,
  ZERO_CLICK_REVIEWED: booleanFlag,
  ALLOW_FIXTURE_PUBLIC: booleanFlag,
});

export type AppEnv = z.infer<typeof envSchema>;

type EnvSource = Partial<Record<string, string | undefined>>;

export function readEnv(source: EnvSource = process.env): AppEnv {
  return envSchema.parse(source);
}

export function requireDatabaseUrl(source: EnvSource = process.env) {
  const env = readEnv(source);

  if (!env.TURSO_DATABASE_URL) {
    throw new Error("TURSO_DATABASE_URL is required for database operations.");
  }

  return {
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  };
}
