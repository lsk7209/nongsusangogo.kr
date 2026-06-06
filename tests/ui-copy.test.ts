import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const mojibakePattern = /�|怨|媛|濡|鍮|諛|寃|쇱|띿|쨌|鍮좊|異쒖|援ъ|듬\?|紐|臾|醫|湲|踰|占/;

describe("public UI copy", () => {
  it("keeps global and blog-facing Korean labels readable", () => {
    const files = [
      "app/layout.tsx",
      "app/blog/page.tsx",
      "app/blog/[slug]/page.tsx",
    ];
    const text = files
      .map((file) => readFileSync(path.join(process.cwd(), file), "utf8"))
      .join("\n");

    expect(text).not.toMatch(mojibakePattern);
    expect(text).toContain("농수산고고");
    expect(text).toContain("빠른 답변");
    expect(text).toContain("체크리스트");
    expect(text).toContain("자주 묻는 질문");
    expect(text).toContain("출처와 다음 행동");
    expect(text).toContain("판단표");
    expect(text).toContain("상황별 실행 기준");
  });
});
