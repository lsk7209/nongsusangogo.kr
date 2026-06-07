import { readEnv } from "@/lib/config/env";

type AdSlotProps = {
  label: string;
};

const defaultAdsenseClientId = "ca-pub-3050601904412736";

export function AdSlot({ label }: AdSlotProps) {
  const env = readEnv();
  const client =
    env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID ??
    env.GOOGLE_ADSENSE_CLIENT_ID ??
    defaultAdsenseClientId;
  const slot =
    env.NEXT_PUBLIC_GOOGLE_ADSENSE_ARTICLE_SLOT ??
    env.GOOGLE_ADSENSE_ARTICLE_SLOT;

  if (!client || !slot) {
    return null;
  }

  return (
    <aside className="ad-slot" aria-label={label}>
      <ins
        className="adsbygoogle"
        data-ad-client={client}
        data-ad-format="auto"
        data-ad-slot={slot}
        data-full-width-responsive="true"
        style={{ display: "block" }}
      />
    </aside>
  );
}
