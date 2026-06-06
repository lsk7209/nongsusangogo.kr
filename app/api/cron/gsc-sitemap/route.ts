import {
  getSubmittedSitemapStatus,
  submitAndVerifySitemap,
} from "@/lib/gsc/sitemaps";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return runGscSitemap(request, true);
}

export async function POST(request: Request) {
  return runGscSitemap(request, true);
}

async function runGscSitemap(request: Request, submit: boolean) {
  const auth = authorizeCronRequest(request);

  if (!auth.authorized) {
    return Response.json(
      {
        submitted: false,
        blocked: true,
        reason: auth.reason,
      },
      { status: 401 },
    );
  }

  try {
    const result = submit
      ? await submitAndVerifySitemap()
      : await getSubmittedSitemapStatus();

    return Response.json({
      ...result,
      success:
        result.preflight.sitemapOk &&
        result.preflight.robotsOk &&
        Number(result.status?.errors ?? 0) === 0 &&
        result.status?.isPending !== true,
    });
  } catch (error) {
    return Response.json(
      {
        submitted: false,
        blocked: true,
        reason:
          error instanceof Error ? error.message : "Unknown GSC sitemap error",
      },
      { status: 500 },
    );
  }
}

function authorizeCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return { authorized: true as const };
  }

  const authHeader = request.headers.get("authorization");
  const querySecret = new URL(request.url).searchParams.get("secret");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (bearerToken === secret || querySecret === secret) {
    return { authorized: true as const };
  }

  return {
    authorized: false as const,
    reason: "Unauthorized GSC sitemap cron request.",
  };
}
