import { getQualityPassedPages } from "@/lib/content/site-pages";
import { getOptionalDatabase } from "@/lib/content/db-pages";
import { createDatabase } from "@/lib/db/client";
import {
  canUseFixturePublicFallback,
  isPublicLaunchAllowedForDb,
} from "@/lib/gates/public-launch";

export async function GET() {
  const db = getOptionalDatabase(createDatabase);

  if (
    !(await isPublicLaunchAllowedForDb(db)) &&
    !canUseFixturePublicFallback()
  ) {
    return new Response(
      "# 농수산고고\n\nPublic launch is blocked while readiness gates are pending.\n",
      {
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
      },
    );
  }

  const pages = getQualityPassedPages()
    .map((page) => `- ${page.title}: /items/${page.slug}`)
    .join("\n");

  return new Response(
    `# 농수산고고\n\nKAMIS 농수산물 시세 기반 pSEO 사이트입니다. 현재 실데이터 발행은 라이선스 확인 전까지 보류됩니다.\n\n${pages}\n`,
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    },
  );
}
