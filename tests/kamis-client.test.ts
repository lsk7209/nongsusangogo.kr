import { describe, expect, it } from "vitest";
import { HttpKamisClient } from "@/lib/kamis/client";

describe("HttpKamisClient", () => {
  it("uses the official KAMIS credential and return-type parameters", async () => {
    let requestedUrl = "";
    const client = new HttpKamisClient({
      baseUrl:
        "http://www.kamis.or.kr/service/price/xml.do?action=dailyPriceByCategoryList",
      certId: "requester-id",
      certKey: "credential-key",
      responseFormat: "json",
      fetcher: async (input) => {
        requestedUrl = String(input);

        return new Response(
          JSON.stringify([
            {
              date: "2026-07-06",
              itemName: "배추",
              itemCode: "111",
              kindName: "일반",
              kindCode: "00",
              category: "채소류",
              unit: "1kg",
              price: "1000",
            },
          ]),
          { status: 200 },
        );
      },
    });

    await client.fetchDailyPrices({ limit: 5 });
    const url = new URL(requestedUrl);

    expect(url.searchParams.get("action")).toBe(
      "dailyPriceByCategoryList",
    );
    expect(url.searchParams.get("p_cert_id")).toBe("requester-id");
    expect(url.searchParams.get("p_cert_key")).toBe("credential-key");
    expect(url.searchParams.get("p_returntype")).toBe("json");
    expect(url.searchParams.get("limit")).toBe("5");
  });
});
