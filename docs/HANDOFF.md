# Handoff

## Reader-detail advertising containment staged (2026-07-29 KST)

- User goal: improve fleet reader experience, AdSense review readiness, and search usefulness without treating technical changes as external AdSense approval or Google-ranking proof.
- Current evidence: public `/api/status` reports `publicLaunchAllowed=false`, `publishAllowed=false`, `dataMode=fixture_fallback`, KAMIS API credentials absent, all nine readiness checks pending, and zero DB `published` pages. The public Home and a sample blog article were 200 with one H1 and a global AdSense loader.
- Scoped repair: remove the root-layout AdSense loader and render it only with a configured `AdSlot` on detail pages. Home, trust, navigation, and fixture-gated surfaces no longer receive the global script; existing blog/item slots retain their loader when an explicit article slot is configured.
- Side-effect boundary: no KAMIS collection, DB write, gate decision, publishing, sitemap/GSC action, or AdSense-console action has occurred. No real-data claim, launch gate, or schedule is being changed.
- Validation completed: dependency installation used `npm install --package-lock=false --ignore-scripts`, leaving the mismatched existing lockfile untouched. Typecheck passed, Vitest passed 84/84, and the Next.js production build passed for 236 routes. The generated Home has `ads=0` and one H1; source inspection confirms the loader exists only in `AdSlot` used by blog/item detail routes. Public Home/article verification remains required after deployment.
- Rollback: revert the one pending source commit after release.
- Single next step: commit the scoped source/handoff change, push `main`, then verify Vercel and public Home/article responses.
