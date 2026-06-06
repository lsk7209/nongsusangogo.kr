import { describe, expect, it } from "vitest";
import {
  analyzeGate05Records,
  listProbeBlockers,
  runGate05Probe,
  suggestReadinessEnv,
} from "@/lib/probe/gate05";
import { gate05DecisionsFromReport } from "@/lib/gates/gate-store";
import type { KamisClient } from "@/lib/kamis/types";

describe("Gate 0.5 probe analyzer", () => {
  it("detects region fields and unit weight share", () => {
    const analysis = analyzeGate05Records([
      {
        date: "2026-06-05",
        itemCode: "A",
        kindCode: "A1",
        rank: "middle",
        wsrt: "retail",
        regionCode: "1101",
        unit: "10kg",
        price: "10000",
      },
      {
        date: "2026-06-05",
        itemCode: "A",
        kindCode: "A1",
        rank: "middle",
        wsrt: "wholesale",
        regionCode: "1101",
        unit: "1포기",
        price: "-",
      },
    ]);

    expect(analysis.region.suggestedSource).toBe("free");
    expect(analysis.units.weightShare).toBe(0.5);
    expect(analysis.prices.missingPriceShare).toBe(0.5);
    expect(analysis.wholesaleRetail.matchRate).toBe(1);
  });

  it("suggests readiness env without claiming license or Gate 0 completion", () => {
    const analysis = analyzeGate05Records([
      {
        date: "2026-06-05",
        itemCode: "A",
        kindCode: "A1",
        rank: "middle",
        wsrt: "retail",
        unit: "1개",
        price: "1000",
      },
    ]);

    expect(suggestReadinessEnv(analysis)).toMatchObject({
      KAMIS_REGION_SOURCE: "none",
      UNIT_WEIGHT_SHARE: "0.00",
      BACKFILL_PAGING_CONFIRMED: "false",
    });
    expect(listProbeBlockers(analysis)).not.toContain(
      "No records were returned; API credentials or endpoint need review.",
    );
  });

  it("converts probe output into only measurable Gate 0.5 decisions", () => {
    const analysis = analyzeGate05Records([
      {
        date: "2026-06-05",
        itemCode: "A",
        kindCode: "A1",
        rank: "middle",
        wsrt: "retail",
        regionCode: "1101",
        unit: "10kg",
        price: "10000",
      },
    ]);

    const decisions = gate05DecisionsFromReport({
      source: "mock",
      analysis,
      paging: {
        pagesFetched: 1,
        observedNextCursor: false,
        exhausted: true,
      },
      readinessEnv: suggestReadinessEnv(analysis),
      blockers: [],
    });

    expect(decisions.map((decision) => decision.checkId)).toEqual([
      "region_dimension",
      "wholesale_retail_join",
      "unit_weight_share",
      "backfill_paging",
    ]);
    expect(decisions).not.toContainEqual(
      expect.objectContaining({ checkId: "license", status: "pass" }),
    );
    expect(
      decisions.find((decision) => decision.checkId === "backfill_paging")
        ?.status,
    ).toBe("pending");
  });

  it("records paging telemetry and passes backfill paging only for exhausted HTTP pagination", async () => {
    const client: KamisClient = {
      async fetchDailyPrices(request = {}) {
        if (!request.cursor) {
          return {
            sourceCode: "KAMIS",
            nextCursor: "page-2",
            records: [
              {
                date: "2026-06-05",
                itemCode: "A",
                itemName: "A",
                kindCode: "A1",
                kindName: "A1",
                category: "vegetable",
                unit: "10kg",
                unitType: "weight",
                rank: "middle",
                wsrt: "retail",
                regionCode: "1101",
                price: "1000",
                prevDay: null,
                m1Ma5: null,
                y1Ma5: null,
                normal3yr: null,
              },
            ],
          };
        }

        return {
          sourceCode: "KAMIS",
          nextCursor: null,
          records: [
            {
              date: "2026-06-06",
              itemCode: "A",
              itemName: "A",
              kindCode: "A1",
              kindName: "A1",
              category: "vegetable",
              unit: "10kg",
              unitType: "weight",
              rank: "middle",
              wsrt: "retail",
              regionCode: "1101",
              price: "1100",
              prevDay: null,
              m1Ma5: null,
              y1Ma5: null,
              normal3yr: null,
            },
          ],
        };
      },
    };

    const report = await runGate05Probe({ client, source: "http" });
    const backfillDecision = gate05DecisionsFromReport(report).find(
      (decision) => decision.checkId === "backfill_paging",
    );

    expect(report.paging).toEqual({
      pagesFetched: 2,
      observedNextCursor: true,
      exhausted: true,
    });
    expect(backfillDecision?.status).toBe("pass");
    expect(backfillDecision?.measuredValue).toBe("2");
  });
});
