import { createDatabase } from "@/lib/db/client";
import { promoteQualityPassedPages } from "@/lib/publish/drip-feed";

const defaultLimit = 5;
const maxLimit = 50;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runPublish(request);
}

export async function POST(request: Request) {
  return runPublish(request);
}

async function runPublish(request?: Request) {
  const auth = authorizeCronRequest(request);

  if (!auth.authorized) {
    return Response.json(
      {
        published: 0,
        blocked: true,
        reason: auth.reason,
      },
      { status: 401 },
    );
  }

  const parsedLimit = parseLimit(request);

  if (!parsedLimit.ok) {
    return Response.json(
      {
        published: 0,
        blocked: true,
        reason: parsedLimit.reason,
      },
      { status: 400 },
    );
  }

  if (!process.env.TURSO_DATABASE_URL) {
    return Response.json(
      {
        published: 0,
        blocked: true,
        reason: "TURSO_DATABASE_URL is not configured.",
      },
      { status: 200 },
    );
  }

  try {
    const result = await promoteQualityPassedPages(createDatabase(), {
      limit: parsedLimit.limit,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        published: 0,
        blocked: true,
        reason:
          error instanceof Error ? error.message : "Unknown publish error",
      },
      { status: 500 },
    );
  }
}

function authorizeCronRequest(request?: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return { authorized: true as const };
  }

  const authHeader = request?.headers.get("authorization");
  const querySecret = request
    ? new URL(request.url).searchParams.get("secret")
    : null;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (bearerToken === secret || querySecret === secret) {
    return { authorized: true as const };
  }

  return {
    authorized: false as const,
    reason: "Unauthorized publish cron request.",
  };
}

function parseLimit(
  request?: Request,
): { ok: true; limit: number } | { ok: false; reason: string } {
  const rawLimit = request
    ? new URL(request.url).searchParams.get("limit")
    : null;

  if (!rawLimit) {
    return { ok: true, limit: defaultLimit };
  }

  const limit = Number(rawLimit);

  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    return {
      ok: false,
      reason: `limit must be an integer from 1 to ${maxLimit}.`,
    };
  }

  return { ok: true, limit };
}
