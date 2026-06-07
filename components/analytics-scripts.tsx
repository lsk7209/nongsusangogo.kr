import Script from "next/script";
import { readEnv } from "@/lib/config/env";

export function AnalyticsScripts() {
  const env = readEnv();
  const ga4MeasurementId =
    env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? env.GA4_MEASUREMENT_ID;

  return (
    <>
      {ga4MeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-config" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4MeasurementId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
