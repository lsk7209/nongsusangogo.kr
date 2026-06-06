import { describe, expect, it } from "vitest";
import {
  articleTopicPersona,
  optimizationPersona,
  siteTopicPersona,
} from "@/lib/seo/personas";

describe("seo personas", () => {
  it("defines the site topic, article, and optimization decision rules", () => {
    expect(siteTopicPersona.topicScope).toContain("농산물 시세 해석");
    expect(siteTopicPersona.primaryReader).toContain("장보기 비용");
    expect(articleTopicPersona.requiredElements).toContain("FAQ");
    expect(articleTopicPersona.forbiddenPatterns.join(" ")).toContain(
      "키워드 반복",
    );
    expect(optimizationPersona.priorityOrder[0]).toContain("정확성");
    expect(optimizationPersona.conflictRules.join(" ")).toContain("광고");
  });
});
