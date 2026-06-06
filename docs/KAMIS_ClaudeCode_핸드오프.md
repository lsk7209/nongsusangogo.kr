# Claude Code 핸드오프 — KAMIS 농수산물 시세 pSEO 사이트 빌드

> 이 문서를 Claude Code 세션에 붙여넣어 빌드를 시작한다.
> 동반 문서: `KAMIS_시세_pSEO_기획서_v0.3.md`(전체 기획·게이트), `KAMIS_디자인_브리프.md`(UI). 상세는 그쪽 참조.

---

## 0. 미션 한 줄
공공데이터(KAMIS) 농수산물 도·소매 시세를 수집·보강·품질게이트를 거쳐 프로그래매틱 SEO 페이지로 발행하는 Next.js 사이트를 빌드한다.

## 1. ⚠️ 현재 상태 — "가정 격리 모드"로 빌드
이 빌드는 **검증 게이트 미통과 상태에서 의도적으로 선행**한다. 따라서 아래 미확정 변수들을 **하드코딩하지 말고 추상화 경계 뒤로 격리**한다. 프로브 결과가 나오면 **구현 교체/설정 주입만으로** 반영되어야 하며, 광범위한 재작성이 발생하면 설계 실패다.

| 미확정 변수 | 격리 방식 |
|---|---|
| 단위 정규화(무게/개수) | `UnitNormalizer` 인터페이스만 정의, 구현은 스텁 + `unit_type` config 주입. 환산 로직 본구현 금지(미확정) |
| 지역 차원 유무 | `region_code` nullable 컬럼 + `REGION_ENABLED` 피처플래그. 지역 UI는 옵셔널 슬롯(없어도 레이아웃 성립) |
| 등급(상/중/하) | `rank` 차원 스키마 포함 + `HEADLINE_RANK` config로 대표 등급 선택 |
| 소매↔도매 조인 | 마진 계산은 `canJoinWholesaleRetail()` 가드 뒤에서만 |
| **상업 재배포 라이선스** | **데이터 발행 전제.** 출처·면책 컴포넌트 필수 구현. 라이선스 미확인 시 실제 콘텐츠 공개 금지 — 코드는 빌드하되 published 전환은 보류 |

> 즉, **인프라·템플릿·도구·파이프라인 골격은 짓되, 데이터 의미(semantics)에 의존하는 부분은 인터페이스로 비워둔다.**

## 2. 기술 스택 (확정)
Next.js 14 App Router + TypeScript(strict) · Turso(LibSQL) + Drizzle ORM · Google Gemini(Flash) · Vercel(호스팅+Cron) · GitHub Actions(대량작업).

## 3. 빌드 순서 (Phase별, 각 Definition of Done 포함)

### Phase 1 — 인프라 (먼저, 게이트 독립)
- Next.js 초기화, TS strict, ESLint/Prettier
- Turso 연결 + Drizzle 설정 + 스키마 마이그레이션
- 스키마(아래 §4) 생성. **미확정 필드는 nullable/플래그로**
- 환경변수 스캐폴드(.env.example), Vercel 연결
- DoD: `drizzle migrate` 성공, 빈 DB에 시드 1행 삽입/조회 테스트 통과

### Phase 2 — 데이터 계층 (인터페이스 우선)
- `lib/kamis/client.ts`: KAMIS API 클라이언트(cert_id/cert_key, 재시도·레이트리밋·에러핸들링). **엔드포인트는 env로**
- `lib/normalize/`: `UnitNormalizer` 인터페이스 + 스텁 구현(+ unit_type 매핑 config). 본 환산 금지
- `lib/collect/`: 체크포인트 수집 엔진(`collect_checkpoints`), 증분 수집, 배치(GitHub Actions용)
- 비교/특이점 추출기: 평년·전년 대비(이동평균 정의 보존), 결측(`-`) sparse 정책(보간 금지)
- DoD: mock 응답으로 수집→저장→체크포인트 재개 테스트 통과 (실 API 키 없이도 동작)

### Phase 3 — AI 보강 + 품질 게이트
- `lib/gemini/`: 클라이언트 + 페르소나 + 동적 프롬프트(raw_data 특이점 추출)
- 보강 파이프라인: draft→enriched
- 조건부 섹션 엔진(기획서 §6 규칙)
- **품질 게이트**(§7) + 고유성 테스트
- DoD: 샘플 10건 enriched→품질게이트 통과/탈락 분기 동작

### Phase 4 — 사이트 + SEO + GEO
- 프로그래매틱 템플릿(조건부 섹션, 디자인 브리프 컴포넌트), 인터랙티브 도구(타이밍 진단·원/kg 토글·시계열 차트·도소매 게이지·대체재)
- 허브(카테고리/지역 옵셔널) · 홈
- SEO 전체(동적 title/meta, JSON-LD Dataset/Product/FAQPage/Breadcrumb, canonical, OG, 내부링크)
- GEO(llms.txt, SSR, robots AI봇 허용), 분할 sitemap(quality_passed만)
- 출처/면책/AI고지 컴포넌트(전 페이지 공통, 필수)
- DoD: 샘플 데이터로 상세/허브/홈 SSR 렌더 + Lighthouse 모바일 통과

### Phase 5 — 자동화 + 수익화
- 드립피드 발행(Vercel Cron 06:00), 증분 수집(09:00)
- GitHub Actions: bulk-collect/enrich/quality-gate/quality-audit
- 광고 슬롯(플레이스홀더, 승인 후 활성), CPA 링크 자리(서술형·FTC 고지)
- 필수 페이지(about/privacy/terms/contact), 대시보드(/api/status)
- DoD: 드립피드가 quality_passed 페이지만 일정대로 published 전환

## 4. DB 스키마 핵심 (미확정 필드 격리 반영)
```
data_sources, item_codes
item_meta   — unit, unit_type(enum, 미확정시 'unknown'), weight_g(nullable),
              is_discount_capable, category
price_daily — date, item_code, kind_code, rank, wsrt, region_code(nullable),
              price, price_per_kg(nullable), is_discount, prev_day, m1_ma5, y1_ma5, normal_3yr
price_monthly / price_yearly        — 장기 stitching
substitutes — item_code, sub_item_code, relation
season_calendar — event, lead_weeks, target_items[], target_hubs[]
pages       — status(draft|enriched|quality_passed|published|demoted|rejected),
              quality_score, gate_passed, active_sections, unique_points, first_published_at
fillers, evergreens, hubs, publish_log, collect_checkpoints
```

## 5. 코딩 규칙
TS strict · Drizzle(raw SQL 최소) · 에러핸들링 철저(API/DB) · 시크릿 env · `lib/` 기능별 단일책임 모듈화 · 체크포인트 패턴(중단/재개) · 배치(Vercel 타임아웃 고려, 대량은 Actions) · 한국어 주석 OK·식별자 영어 · RSC 우선('use client' 최소) · 모든 페이지 품질게이트 필드 포함.

## 6. 환경변수 (.env.example로)
```
TURSO_DATABASE_URL=, TURSO_AUTH_TOKEN=
KAMIS_CERT_ID=, KAMIS_CERT_KEY=, KAMIS_BASE_URL=
GEMINI_API_KEY=
REGION_ENABLED=false        # 프로브 후 토글
HEADLINE_RANK=middle        # 대표 등급
```

## 7. 품질 게이트 구현 명세
발행 전 전부 통과해야 `quality_passed`:
1. 고유 데이터 포인트 ≥3
2. AI 코멘터리 ≥200자(동적 프롬프트)
3. 기존 제목 유사도 <30%
4. FAQ ≥3 (각 답변 ≥50자)
5. 조건부 섹션 ≥1 활성
6. 비교 데이터(평년/전년 대비) 포함
- 고유성 테스트: "품목/지역명 제거 시 나머지가 유용한가?" → 아니오면 reject
- Weakest-link: 미달 페이지는 published 금지

## 8. 첫 작업 지시
1. **Phase 1부터 시작.** 한 Phase 끝낼 때마다 DoD 확인 후 다음으로.
2. **§1 가정 격리 원칙을 모든 Phase에서 준수** — 미확정 변수에 본구현 넣지 말 것.
3. 실 API 키가 아직 없으므로 **Phase 2까지는 mock/fixture로 동작**하게 작성(키 발급 즉시 교체 가능하게).
4. 각 Phase 시작 전 계획을 짧게 보고하고 진행. 큰 결정(스키마 변경 등)은 확인받기.
5. 라이선스 미확인 상태이므로 **어떤 실데이터도 published로 공개하지 말 것** — quality_passed까지만.

---
*게이트 미통과 상태에서 위험을 감수하고 선행하는 빌드. 데이터 의미 의존부는 인터페이스 뒤에 격리되어 있으며, 프로브 결과로 구현·설정만 교체한다. 실데이터 공개는 라이선스(게이트②)·지역(게이트①)·DataLab(게이트0) 확인 후.*
