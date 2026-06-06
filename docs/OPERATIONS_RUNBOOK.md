# Operations Runbook

This project is built in gated-launch mode. Code, pipelines, and public templates can run before the external business/data gates pass, but real public data must not be exposed until the gate decisions are recorded and publish cron promotes pages to `published`.

## 1. Baseline Checks

Run these before deploy or after code changes:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run phase1:smoke
npm run phase2:smoke
npm run phase3:smoke
npm run probe:gate05
```

`phase1:smoke` and `phase2:smoke` use Turso when `TURSO_DATABASE_URL` is set. Without it, they create a migrated local smoke DB under `.tmp/`.

## 2. Required Environment

Core deployment:

```bash
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
SITE_URL=https://nongsusangogo.kr
CRON_SECRET=
```

KAMIS probe and collection:

```bash
KAMIS_BASE_URL=
KAMIS_CERT_ID=
KAMIS_CERT_KEY=
KAMIS_RESPONSE_FORMAT=auto
```

AI enrichment:

```bash
GEMINI_API_KEY=
```

Gate fallback env values still work for local evaluation, but production should use DB-backed gate decisions:

```bash
DATA_LICENSE_CONFIRMED=false
KAMIS_REGION_SOURCE=unknown
WHOLESALE_RETAIL_MATCH_RATE=
UNIT_WEIGHT_SHARE=
BACKFILL_PAGING_CONFIRMED=false
DATALAB_INTENT_CONFIRMED=false
CPA_RATE_CONFIRMED=false
UNIT_ECONOMICS_CONFIRMED=false
ZERO_CLICK_REVIEWED=false
```

## 3. Gate Workflow

Run the API probe:

```bash
npm run probe:gate05
```

When `TURSO_DATABASE_URL` is configured, the probe writes a `gate_runs` row and updates measurable Gate 0.5 decisions. Mock probe results never pass manual-only business gates.

Record manual gate decisions after external verification:

```bash
npm run gate:set -- --check license --status pass --decision "Commercial redistribution confirmed" --value public-nuri-type-1
npm run gate:set -- --check datalab_intent --status pass --decision "Timing, trend, season, and substitute intent confirmed"
npm run gate:set -- --check cpa_rate --status pass --decision "CPA or AdSense fallback economics confirmed"
npm run gate:set -- --check unit_economics --status pass --decision "Expected revenue covers hosting, data, and automation cost"
npm run gate:set -- --check zero_click --status pass --decision "Tool and substitute value remains beyond instant answers"
```

Inspect current gate state:

```bash
npm run gate:list
```

Publishing remains blocked until every readiness check is `pass` or an allowed `branch`.

## 4. Batch Workflow

Collect data:

```bash
npm run batch:collect
```

Build drafts:

```bash
npm run batch:build-drafts
npm run batch:build-keyword-pages
```

Enrich and gate content:

```bash
npm run batch:enrich
npm run batch:quality-gate
npm run batch:quality-audit
```

`batch:quality-gate` moves `enriched` rows to `quality_passed` or `rejected`. `batch:quality-audit` fails with a non-zero exit code if publishable pages are missing required quality fields.

## 5. Publishing And Exposure

Vercel Cron is configured in `vercel.json`:

```json
{
  "path": "/api/cron/publish",
  "schedule": "0 21 * * *"
}
```

That schedule is 06:00 KST. Collection is scheduled by GitHub Actions at 09:00 KST.

The publish endpoint supports:

```bash
GET /api/cron/publish?limit=5
POST /api/cron/publish?limit=5
Authorization: Bearer $CRON_SECRET
```

Only `published` DB pages are publicly exposed through page loaders, keyword loaders, and sitemap generation. `quality_passed` means ready for drip-feed, not publicly visible.

## 6. Status API

Use `/api/status` to inspect:

- DB connectivity and page counts
- latest collection checkpoint
- latest gate run
- readiness source (`db` or `env`)
- blocked and branch checks
- cron auth configuration warning

Both `/api/status` and `/api/cron/publish` are forced dynamic so they read live DB/env state on every request.
