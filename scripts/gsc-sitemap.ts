import {
  getSubmittedSitemapStatus,
  submitAndVerifySitemap,
} from "@/lib/gsc/sitemaps";

const command = process.argv[2] ?? "submit";

try {
  const result =
    command === "status"
      ? await getSubmittedSitemapStatus()
      : await submitAndVerifySitemap();

  console.log(
    JSON.stringify(
      {
        siteType: result.siteType,
        siteUrl: result.siteUrl,
        propertyUrl: result.propertyUrl,
        sitemapUrl: result.sitemapUrl,
        submitted: result.submitted,
        preflight: result.preflight,
        status: result.status,
        success:
          result.preflight.sitemapOk &&
          result.preflight.robotsOk &&
          Number(result.status?.errors ?? 0) === 0 &&
          result.status?.isPending !== true,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
