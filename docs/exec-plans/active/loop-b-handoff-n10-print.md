---
LOOP B HANDOFF — n10-print
Written by: Execution Agent
Date: 2026-04-17
Iteration: 4 (Stage 3~6 완료 반영)
---

## What I Built / Fixed

### Stage 0 (Iter 1 → Iter 2 완료)
이번 세션은 N10 print 노드의 1차 구현 + Stage 0 안정화 작업이다.

**1차 구현 (Google 에이전트 + 정합성 검토 수정):**
- `app/api/print/route.ts` — Gemini 2.5 Pro API 연동, FormData 파싱, mode별 분기
- `app/page.tsx` — 이미지 업로드, 프롬프트 입력, Generate 버튼 → API 연동, Canvas 렌더링
- `app/components/VideoTemplate.tsx` — VIDEO 모드 렌더러 (Veo 연동 전 플레이스홀더)
- `project.10_print/.env.local` — GOOGLE_AI_API_KEY 설정

**Stage 0 안정화 (Error_Review_Report-v.4 대응):**
- `route.ts` — CRITICAL-1: `new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })` 명시적 전달
- `route.ts` — MEDIUM-1: VIDEO mock URL → HTTP 501 명시적 응답
- `app/components/VideoTemplate.tsx` — HIGH-2: sources/ 제외 경로 → app/components/ 이동
- `app/page.tsx` — HIGH-1: Generate 버튼 실제 동작 연결

**Stage 0 RELIABILITY.md / SECURITY.md 기준 충족:**
- `route.ts` — timeout 30s (`Promise.race` + setTimeout)
- `route.ts` — 재시도 2회 지수 백오프 (`withRetry`)
- `route.ts` — 이미지 크기 제한 10MB 검증
- `route.ts` — 텍스트 길이 제한 2000자 검증
- `route.ts` — Protocol null 방어 코드 추가
- `route.ts` — `error: unknown` 타입으로 수정 (any 제거)
- `SKILL.md` — RELIABILITY.md / SECURITY.md 경로 수정 (`docs/references/` → `docs/`)

**Loop B Iter 1 FAIL 후 수정:**
- `route.ts:9` — `ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']` 선언
- `route.ts:65-70` — 서버사이드 MIME 타입 검증 루프 추가 (허용 외 타입 시 400 반환)
- `page.tsx:94` — `accept="image/jpeg,image/png,image/webp"` (gif 제거)

**Loop B Iter 2 PASS — DEPLOYMENT APPROVED**
- 보고서: `docs/exec-plans/active/loop-b-report-n10-print-2026-04-15-iter2.md`

---

### Stage 1 (현재 완료)
**HTML 템플릿 → Gemini 레이아웃 참조 연동:**

- `lib/prompt.ts` — `loadTemplate(mode: PrintMode): string` 함수 추가
  - `TEMPLATE_FILES`: REPORT → `Report_template.html`, PANEL → `Panel_template.html`,
    DRAWING → `DrawingSpecification_template.html`, VIDEO → 빈 문자열 (Veo API, 템플릿 없음)
  - `TEMPLATE_DIR = process.cwd()/sources/document_template`
  - 로드 실패 시 FATAL 오류로 앱 중단
- `route.ts` — `loadTemplate` import + 사용
  - `templateHtml = loadTemplate(mode)` 호출
  - `[LAYOUT TEMPLATE]` 블록을 `userText`에 주입
  - Gemini에게 "이 HTML 구조를 유지하여 완성 HTML 생성, `<script>` 무시, img-box는 이미지 슬롯"
  - VIDEO / 없는 모드 → templatePart 빈 문자열 → 주입 없음

**빌드 검증:** `npx next build` ✓ (타입 오류 0, 컴파일 성공)

---

## Files Modified

| File | Change |
|------|--------|
| `project.10_print/app/api/print/route.ts` | Stage 0 전면 재작성 + Stage 1 loadTemplate 연동 |
| `project.10_print/app/page.tsx` | 기능 연결 완성 + ExecutionLog 인터페이스 추가 |
| `project.10_print/app/components/VideoTemplate.tsx` | 신규 생성 (sources/ 이동) |
| `project.10_print/lib/prompt.ts` | loadTemplate() + TEMPLATE_FILES 추가 |
| `.claude/skills/code-reviewer/SKILL.md` | 경로 수정 |

## Protocol Location

`project.10_print/_context/protocol/protocol-print-v1.txt`

## Product-spec Location

`docs/product-specs/N10-print.md`

## Template Files Location

`project.10_print/sources/document_template/`
- `Report_template.html` — A3 landscape, contenteditable, document.write() JS
- `Panel_template.html` — A0, pagesData JS array + renderPages(), labeled img-box divs
- `DrawingSpecification_template.html` — 정적, contenteditable tb-value divs, #VIVE_IMAGE_PIVOT

**주의:** 이 파일들은 JS 구동 인터랙티브 디자인 도구다. Gemini는 시각 구조(레이아웃, 슬롯 배치)를
참조하여 완성 HTML을 생성하며 `<script>` 블록은 무시한다.

---

### Stage 2 (현재 완료)
**문서 렌더링 — 모드별 물리 치수 기반 자동 스케일링:**

- `app/globals.css` — 누락 CSS 토큰 5개 추가
  - `--sidebar-spacing: calc(var(--sidebar-w) + 3.25rem)` — Canvas·PreviewStrip의 `right` 기준 (치명적 누락이었음)
  - `--color-placeholder`, `--color-border`, `--color-border-header`, `--color-guide`
- `app/components/VideoTemplate.tsx` (구) — 삭제 (중복 파일, `app/components/templates/VideoTemplate.tsx`로 통합)
- `app/components/templates/DocumentFrame.tsx` — **신규 생성**
  - ResizeObserver로 캔버스 가용 영역 측정 → `scale = min(aw/docW, ah/docH) × 0.97`
  - `<iframe srcDoc={html}>` — app CSS와 완전 격리하여 Gemini 생성 HTML 렌더링
  - `DOC_SIZE` 상수: REPORT/DRAWING(1587×1122), PANEL_L(4494×3179), PANEL_P(3179×4494), VIDEO(1280×720)
  - `docSizeKey()` 헬퍼 함수 export
  - `srcdoc` → `srcDoc` React camelCase 수정 (빌드 오류)
- `app/components/templates/ReportTemplate.tsx` — DocumentFrame 위임으로 재작성
- `app/components/templates/PanelTemplate.tsx` — DocumentFrame 위임으로 재작성
- `app/components/templates/DrawingTemplate.tsx` — DocumentFrame 위임으로 재작성
- `app/components/layout/Canvas.tsx` — artboard `w-full h-full` 전환, `maxWidth: 860px` 제거
- `app/components/layout/PreviewStrip.tsx` — `mode`/`orientation` props 추가, 모드별 썸네일 스케일 계산
  - 기존 하드코딩 `scale(0.12)` + `width: 833%` → `min(80/docW, 64/docH)` 동적 계산
- `app/page.tsx` — PreviewStrip에 `mode`, `orientation` props 전달

**500 오류 수정:**
- `.env.local` — UTF-16 LE 인코딩 → UTF-8 재작성
  - Next.js가 UTF-16 파일을 파싱하지 못해 `GOOGLE_AI_API_KEY = undefined` → Gemini API 401 → 서버 500
  - BOM 제거, 올바른 key-value 유지

**빌드 검증:** `npx next build` ✓ (타입 오류 0, 컴파일 성공)

---

## Files Modified (Stage 2)

| File | Change |
|------|--------|
| `project.10_print/app/globals.css` | CSS 토큰 5개 추가 (sidebar-spacing 외) |
| `project.10_print/app/components/VideoTemplate.tsx` | 삭제 (중복 제거) |
| `project.10_print/app/components/templates/DocumentFrame.tsx` | 신규 생성 — 자동 스케일링 렌더러 |
| `project.10_print/app/components/templates/ReportTemplate.tsx` | DocumentFrame 위임으로 재작성 |
| `project.10_print/app/components/templates/PanelTemplate.tsx` | DocumentFrame 위임으로 재작성 |
| `project.10_print/app/components/templates/DrawingTemplate.tsx` | DocumentFrame 위임으로 재작성 |
| `project.10_print/app/components/layout/Canvas.tsx` | artboard full-height 전환 |
| `project.10_print/app/components/layout/PreviewStrip.tsx` | 모드별 썸네일 스케일 |
| `project.10_print/app/page.tsx` | PreviewStrip props 추가 |
| `project.10_print/.env.local` | UTF-16 → UTF-8 재인코딩 (500 오류 수정) |

---

## Files Modified (Stage 0 ~ Stage 1 — 이전 누적)

| File | Change |
|------|--------|
| `project.10_print/app/api/print/route.ts` | Stage 0 전면 재작성 + Stage 1 loadTemplate 연동 |
| `project.10_print/app/page.tsx` | 기능 연결 완성 + ExecutionLog 인터페이스 추가 |
| `project.10_print/lib/prompt.ts` | loadTemplate() + TEMPLATE_FILES 추가 |
| `.claude/skills/code-reviewer/SKILL.md` | 경로 수정 |

## Protocol Location

`project.10_print/_context/protocol/protocol-print-v1.txt`

## Product-spec Location

`docs/product-specs/N10-print.md`

## Template Files Location

`project.10_print/sources/document_template/`
- `Report_template.html` — A3 landscape, contenteditable, document.write() JS
- `Panel_template.html` — A0, pagesData JS array + renderPages(), labeled img-box divs
- `DrawingSpecification_template.html` — 정적, contenteditable tb-value divs, #VIVE_IMAGE_PIVOT

**주의:** 이 파일들은 JS 구동 인터랙티브 디자인 도구다. Gemini는 시각 구조(레이아웃, 슬롯 배치)를
참조하여 완성 HTML을 생성하며 `<script>` 블록은 무시한다.

## Known Limitations / Risks

1. **VIDEO 모드 미구현 (Stage 6 예정)**
   VIDEO 분기는 HTTP 501을 반환한다. 의도된 플레이스홀더다.

2. **executionLog UI 미표시**
   API 응답의 `executionLog` 필드가 있으나 UI에 표시되지 않는다.

3. **EXPORT 미구현 (Stage 3 예정)**
   `handleExport()` 핸들러가 비어 있다.

4. **Library/Saves 모달 정적 (Stage 4-5 예정)**
   LibraryModal, SavesModal이 빈 배열을 props로 받고 있다.

## Completed Stages (전체)

| Stage | 내용 | 상태 |
|-------|------|------|
| Stage 0 | 환경 안정화, API 연동, RELIABILITY/SECURITY 기준 충족 | ✅ DEPLOYMENT APPROVED (Iter 2) |
| Stage 1 | HTML 템플릿 → Gemini 레이아웃 참조 연동 | ✅ 완료 |
| Stage 2 | 문서 렌더링 — 모드별 물리 치수 기반 자동 스케일링 | ✅ 완료 |
| Stage 3 | EXPORT (PDF/JPG/PNG) — `lib/export.ts` | ✅ 완료 |
| Stage 4 | Library Modal — `/api/library` + `sources/library/` 연동 | ✅ 완료 |
| Stage 5 | Saves — localStorage 저장/불러오기 | ✅ 완료 |
| Stage 6 | VIDEO — Veo 3.1 API 연동, VIDEO:INJECTION 프롬프트 주입 | ✅ 완료 |

## Post-Stage 개선 작업 (2026-04-17)

| 항목 | 내용 | 상태 |
|------|------|------|
| Protocol v4.0 전환 | v3.2 → Multi-Agent(AGENT-1/2/3) 파이프라인, 4단계 순차 실행 | ✅ 완료 |
| 이미지 크기 제한 상향 | MAX_IMAGE_SIZE 10MB → 20MB | ✅ 완료 |
| 이미지 압축 로직 | `lib/imageUtils.ts` — Canvas API WebP 변환, 3개 업로드 경로 적용 | ✅ 완료 |
| 에이전트 오류 격리 | `lib/agentErrors.ts` — AgentError, validateSchema, 4단계 개별 try-catch | ✅ 완료 |
| 프론트엔드 에러 UI | `page.tsx` — agentError 사이드바 패널 + 헤더 배너 이중 체계, alert() 제거 | ✅ 완료 |
| 무한 캔버스 | `Canvas.tsx` — 휠 줌(0.1~8x), 드래그 패닝, 더블클릭 초기화, 그리드 동기화 | ✅ 완료 |
| iframe 렌더링 수정 | `DocumentFrame.tsx` — injectNoScroll 개선(body 배경/padding 정리) | ✅ 완료 |

## Verification Agent Instructions

`docs/references/loop-b-verification-agent.txt`를 로드하고 전체 검증 시퀀스를 실행하라.
V3 Implementation Check 시 "Known Limitations" 항목 1~4는 후속 Stage 예정 작업으로
인지하고, 현 Iteration 판정에서 차단 결함 여부를 별도 판단하라.

**이번 Iteration 핵심 검증 포인트:**
- `DocumentFrame.tsx` — ResizeObserver + iframe srcDoc 렌더링 정확성
- `PreviewStrip.tsx` — `DOC_SIZE`/`docSizeKey` 썸네일 스케일 계산 정확성
- `.env.local` — UTF-8 인코딩 + `GOOGLE_AI_API_KEY` 올바른 값 유지
- CSS 토큰 `--sidebar-spacing` 정의 완전성

Previous report: `docs/exec-plans/completed/loop-b-report-n10-print-2026-04-15-iter2.md` (Iter 2 PASS)
