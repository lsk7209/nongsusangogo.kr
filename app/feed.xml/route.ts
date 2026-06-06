import { readEnv } from "@/lib/config/env";

export function GET() {
  return Response.redirect(`${readEnv().SITE_URL}/rss.xml`, 308);
}
