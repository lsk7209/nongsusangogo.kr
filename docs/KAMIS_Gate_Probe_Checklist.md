# KAMIS Gate Probe Checklist

이 문서는 `KAMIS_시세_pSEO_기획서_v0.3.md`의 Gate 0.5/0을 실행할 때 기록할 체크리스트다.

## Gate 0.5
- 라이선스: KAMIS 약관, 공공누리 유형, KADX 상품 라이선스의 상업 재배포 가능 여부를 확인한다.
- 지역 차원: 무료 API 응답에 `mrkt_nm`, `ctnp_nm`, `sggu_nm`, `p_country_code` 또는 동등한 지역 필드가 있는지 확인한다.
- 도소매 조인: `pdlt_code`, `spcs_code`, 등급, 단위 기준으로 매칭률을 측정한다.
- 단위 분류: 전체 품목의 `unit_type`을 `weight`, `count`, `volume`, `unknown`으로 분류하고 `UNIT_WEIGHT_SHARE`를 산출한다.
- 등급/결측/할인/백필: rank 차원, `-` 결측 비율, 할인 혼입, 1년 초과 백필 페이징을 확인한다.

## Gate 0
- DataLab: "언제 싸나", "시세 추이", "제철 가격", "대체재" 의도 검색량과 시즌 피크를 확인한다.
- CPA 요율: 신선식품 제휴 요율이 페이지 단가를 넘는지 실측한다.
- 단위경제: 예상 트래픽과 RPM/CPA 수익이 호스팅, 데이터, 자동화 비용을 넘는지 계산한다.
- 제로클릭: 즉답형 쿼리에 잠식되지 않는 도구, 타이밍, 대체재 가치가 있는지 리뷰한다.

## Env Mapping
- `DATA_LICENSE_CONFIRMED=true`
- `KAMIS_REGION_SOURCE=free|paid|none`
- `WHOLESALE_RETAIL_MATCH_RATE=0.0~1.0`
- `UNIT_WEIGHT_SHARE=0.0~1.0`
- `BACKFILL_PAGING_CONFIRMED=true`
- `DATALAB_INTENT_CONFIRMED=true`
- `CPA_RATE_CONFIRMED=true`
- `UNIT_ECONOMICS_CONFIRMED=true`
- `ZERO_CLICK_REVIEWED=true`

모든 필수 값이 통과해야 `/api/cron/publish`가 `published` 전환을 허용한다.

## Probe Command
```bash
npm run probe:gate05
```

키가 없으면 mock fixture를 분석한다. 실제 키가 있으면 다음 값을 설정한 뒤 실행한다.

```bash
KAMIS_BASE_URL=
KAMIS_CERT_ID=
KAMIS_CERT_KEY=
```

출력의 `readinessEnv`는 `.env` 후보값이다. 라이선스, DataLab, CPA, 단위경제는 별도 실측 후 수동으로만 true 처리한다.

## Official References
- KAMIS Open API 안내: https://www.kamis.or.kr/customer/reference/openapi_list.do?action=detail&boardno=1
- KAMIS 메인/고객센터: https://www.kamis.co.kr/customer/main/main.do
