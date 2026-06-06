import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("deployment automation config", () => {
  it("registers the Vercel publish cron for 06:00 KST", () => {
    const config = JSON.parse(
      readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"),
    ) as {
      crons?: Array<{ path?: string; schedule?: string }>;
    };

    expect(config.crons).toContainEqual({
      path: "/api/cron/publish",
      schedule: "0 21 * * *",
    });
  });

  it("registers the GSC sitemap cron after daily publishing", () => {
    const config = JSON.parse(
      readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"),
    ) as {
      crons?: Array<{ path?: string; schedule?: string }>;
    };

    expect(config.crons).toContainEqual({
      path: "/api/cron/gsc-sitemap",
      schedule: "30 21 * * *",
    });
  });

  it("keeps the GitHub collection workflow on the 09:00 KST schedule", () => {
    const workflow = readFileSync(
      path.join(process.cwd(), ".github", "workflows", "bulk-collect.yml"),
      "utf8",
    );

    expect(workflow).toContain('cron: "0 0 * * *"');
    expect(workflow).toContain("npm run batch:collect");
  });

  it("runs baseline verification in CI", () => {
    const workflow = readFileSync(
      path.join(process.cwd(), ".github", "workflows", "ci.yml"),
      "utf8",
    );

    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("npm run typecheck");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run lint");
    expect(workflow).toContain("npm run phase1:smoke");
    expect(workflow).toContain("npm run phase2:smoke");
    expect(workflow).toContain("npm run phase3:smoke");
    expect(workflow).toContain("npm run probe:gate05");
    expect(workflow).toContain("npm run build");
  });
});
