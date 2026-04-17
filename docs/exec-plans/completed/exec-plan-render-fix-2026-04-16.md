# Exec Plan — 문서 렌더링 6개 결함 수정

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 버그 수정 (렌더링 결함)
- **대상 노드**: N10 Print
- **시작일**: 2026-04-16

---

## 목표

GENERATE 이후 결과물을 사용자에게 올바르게 보여주지 못하는 6개 결함을 수정한다.
완료 기준: 이미지가 정상 표시되고, 다중 페이지가 캔버스/프리뷰에서 독립적으로 전환되며,
레이아웃 오버레이가 의도된 영역에서만 보인다.

---

## 이슈별 근본 원인 분석

### ISSUE-1: 이미지 파일이 깨져 보임 [CRITICAL]

**근본 원인 — 아키텍처 결함:**

`route.ts`의 Multi-Agent 파이프라인에서 이미지 데이터 흐름이 끊겨 있다.

```
사용자 이미지 File[] → base64 → Agent 1 (분류, imageId 부여)
                                         ↓
                            Agent 2 Ph2 (HTML 생성, slotMapping 반환)
                                         ↓
                            { html, slotMapping: { slotId: imageId } }
```

Agent 1에 전달된 이미지 base64는 이후 어떤 에이전트에도 전달되지 않는다.
Agent 2 Phase 2가 생성한 HTML의 `<img>` 태그 src는 비어 있거나 placeholder ID이며,
프론트엔드는 실제 이미지 데이터 없이 HTML을 iframe에 주입한다.

**필요한 수정:**
`route.ts`에서 Agent 2 Phase 2 응답 직후, `slotMapping`과 `contentsParts`(base64 이미지 배열)를 조합하여 HTML img src를 실제 `data:{mimeType};base64,...` URI로 교체하는 후처리(post-process) 로직 추가.

- `slotMapping: { slotId → imageId }` + `agent1.images[].{ id, filename }` + `contentsParts[]` 조합
- HTML 내 `<img>` 태그 또는 이미지 슬롯 요소에서 imageId/slotId를 찾아 src 주입
- Gemini 프롬프트에 이미지 참조 방식 명시 (`src` 속성에 이미지 인덱스 placeholder 사용 지시)

---

### ISSUE-5: 모든 페이지가 단일 스크롤 페이지로 표시 [CRITICAL]

**근본 원인 — 데이터 모델 결함:**

`page.tsx` L356:
```typescript
const pages: string[] = result?.html ? [result.html] : []
```

Gemini는 다중 페이지 문서 전체를 **단일 HTML 문자열** (`<div class="page">...</div><div class="page">...</div>...`)로 반환한다.
현재 코드는 이를 분리하지 않고 전체를 1개 항목으로 배열에 담는다.
결과: PreviewStrip에 썸네일 1개만 표시, Canvas에 전체 페이지가 스크롤되는 형태로 렌더링.

**참조 코드 확인:**
`sources/document_template/references/DrawingTemplate.tsx`, `PanelTemplate.tsx`, `ReportTemplate.tsx` 모두 각 페이지를 `<div class="page" style="width: NNmm; height: NNmm;">` 단위로 구성한다.

**필요한 수정:**

1. `lib/` 에 HTML 파싱 유틸 추가:
   ```typescript
   // HTML에서 <div class="page"> 단위를 배열로 분리
   export function splitHtmlPages(html: string): string[] { ... }
   ```
   - `<div class="page"` 마커로 split
   - 각 페이지에 상위 HTML의 `<head>` (CSS 포함) 복사 (스타일 격리 유지)

2. `page.tsx`:
   ```typescript
   // Before: const pages = result?.html ? [result.html] : []
   // After:
   const pages = result?.html ? splitHtmlPages(result.html) : []
   ```

3. `renderDocument()`:
   ```typescript
   // currentPage 인덱스에 해당하는 단일 페이지 HTML만 DocumentFrame에 전달
   html: pages[currentPage] ?? ''
   ```

4. API 타입 (`lib/types.ts`): `PrintResult.html: string` 유지, 프론트에서만 split (서버 응답 구조 변경 없음)

---

### ISSUE-6: 프리뷰바 / 사이드바 회색 오버레이 + 민트색 그리드 위치 오류 [HIGH]

**근본 원인 A — CSS 스타일 오염:**

`PreviewStrip.tsx`의 PageThumbnail 컴포넌트가 `dangerouslySetInnerHTML`로 Gemini 생성 HTML을 직접 삽입한다.
Gemini 생성 HTML에 `<style>` 태그가 포함된 경우, 그 스타일이 앱 전체 DOM에 전파되어 sidebar/preview에 의도치 않은 배경색·오버레이가 생긴다.

**근본 원인 B — Canvas guide 오버플로우:**

`Canvas.tsx` L111:
```typescript
data-canvas-guide
className="absolute inset-0 pointer-events-none"
style={{
  border: '1px dashed var(--color-guide)',  // rgba(0, 255, 255, 0.5) — 민트색
  borderRadius: 'var(--radius-box)',
}}
```
이 가이드 레이어는 문서 대지 위에 absolute로 얹혀 의도된 것이나, 
썸네일에서 `dangerouslySetInnerHTML`로 주입된 HTML 내부에도 동일한 CSS 변수가 존재할 경우 복수 렌더링된다.

**필요한 수정:**

1. `PreviewStrip.tsx` PageThumbnail:
   - `dangerouslySetInnerHTML` → `<iframe srcdoc={html}>` 로 교체
   - iframe 사용 시 HTML이 완전히 격리되어 앱 스타일 오염 차단
   - 단, iframe는 로드 비용이 있으므로 `loading="lazy"` + `sandbox` 속성 적용

2. `globals.css`:
   - `--color-guide` 색상을 민트(cyan) → 앱 테마 색상(`rgba(0,0,0,0.15)` 등 회색 계열)으로 변경
   - 캔버스 가이드가 문서 콘텐츠와 구분되면서도 불필요하게 눈에 띄지 않도록 조정

---

### ISSUE-1: 날짜 표기 오류 [MEDIUM]

**근본 원인:**
Gemini는 날짜를 추론 없이 임의로 생성하거나 학습 데이터 기반 날짜를 사용한다.
현재 `route.ts`의 Agent 호출에 현재 날짜 컨텍스트가 포함되지 않는다.

**필요한 수정:**
`route.ts` Agent 1 호출의 contents에 현재 날짜 주입:
```typescript
{ text: `Mode: ${mode}, PageCount: ..., UserPrompt: ..., CurrentDate: ${new Date().toLocaleDateString('ko-KR')}` }
```

---

### ISSUE-2: 목차 페이지 비어있음 [MEDIUM]

**근본 원인:**
참조 코드(`ReportTemplate.tsx` 참고용)의 `ReportContents` 컴포넌트는 `chapter-1-title` 등 블록 데이터를 통해 목차를 동적으로 렌더링한다.
현재 Gemini가 생성하는 HTML이 목차 항목을 비워두거나 플레이스홀더만 넣는 것으로 추정.

**필요한 수정:**
`ai_generation_protocol-v4.0.md`의 AGENT:3 섹션에 REPORT 모드 목차 페이지 작성 규칙 추가:
- 사용자가 요청한 pageCount와 이미지 분류 결과(Agent 1 Schema A의 visionTags)를 기반으로 챕터 제목/설명 자동 작성
- 목차 항목을 비워두지 말 것 명시

---

### ISSUE-3: Company Name 누락 [MEDIUM]

**근본 원인:**
AGENT-1이 이미지 OCR/masterData에서 company를 추출하며, 도면 이미지(L3)가 없을 경우 `""` 반환(protocol Failure Mode 규칙).
Gemini-generated HTML이 masterData.company를 반영하지 않거나, 생성 HTML 템플릿에 company 위치가 명시되지 않았을 가능성.

**필요한 수정:**
AGENT:2 Phase 2 시스템 프롬프트에 masterData → HTML 바인딩 규칙 명시:
- `masterData.company` → HTML 내 `.comp-name`, `#company` 등 지정 슬롯에 반드시 삽입
- masterData 값이 `""` 인 경우에도 해당 요소는 비어있는 상태로 유지 (임의 내용 금지)

---

## 수정 파일 목록

| 파일 | 변경 내용 | 이슈 |
|------|----------|------|
| `lib/htmlUtils.ts` (신규) | `splitHtmlPages(html)` 유틸 함수 | ISSUE-5 |
| `app/page.tsx` | pages 계산 → splitHtmlPages 적용 | ISSUE-5 |
| `app/api/print/route.ts` | 이미지 후처리 주입 로직 + CurrentDate 주입 | ISSUE-1(이미지), ISSUE-1(날짜) |
| `app/components/layout/PreviewStrip.tsx` | dangerouslySetInnerHTML → iframe srcdoc | ISSUE-6 |
| `app/globals.css` | --color-guide 색상 수정 | ISSUE-6 |
| `_context/protocol/ai_generation_protocol-v4.0.md` | AGENT:3 목차/AGENT:2 company 바인딩 규칙 추가 | ISSUE-2, ISSUE-3 |

---

## 수정 우선순위

| 순위 | 이슈 | 영향 |
|------|------|------|
| 1 | ISSUE-5 다중 페이지 분리 | 전체 페이지 네비게이션 불가 → 핵심 기능 미작동 |
| 2 | ISSUE-4 이미지 주입 | 문서의 모든 이미지 표시 불가 → 핵심 기능 미작동 |
| 3 | ISSUE-6 CSS 오염 / 민트 가이드 | 시각적 오류, 사이드바/프리뷰 UI 오작동 |
| 4 | ISSUE-1 날짜 | 날짜 오류 — 정확도 문제 |
| 5 | ISSUE-2 목차 | 생성 품질 문제 |
| 6 | ISSUE-3 company | 생성 품질 문제 |

---

---

## 2차 이슈 (스크린샷 재검토 — 2026-04-16 세션 6)

아래 4개 이슈가 1차 수정 이후에도 잔존 또는 신규 발생한 것으로 확인됨.

### NEW-1: 단일 페이지 내 무의미한 스크롤 [HIGH]

**현상:** 캔버스 artboard에 문서 한 페이지가 표시되는 상태에서 스크롤이 가능하다.  
**근본 원인:** `Canvas.tsx` artboard div(`<div className="relative w-full h-full">`)에 `overflow: hidden`이 없어 DocumentFrame 자식이 오버플로우할 경우 스크롤 영역이 생긴다.  
**수정:** artboard div에 `style={{ overflow: 'hidden' }}` 추가.

---

### NEW-2: 요청보다 많은 페이지 생성 + 이전 페이지 텍스트가 상단에 부유 [HIGH]

**현상 A — 이전 페이지 텍스트 부유:**  
1차 수정에서 삽입한 `injectionScript`가 템플릿 리터럴 안에서 `<\/script>`로 닫혔다.  
JS 문자열에서 `\/`는 단순 백슬래시+슬래시이므로, HTML 파서는 `<\/script>`를 유효한 닫힘 태그로 인식하지 않는다.  
결과: `</script>`가 없어 스크립트 블록이 닫히지 않고, 이후 HTML 본문이 스크립트 내용으로 파싱되거나 페이지 위에 텍스트로 렌더링된다.

**현상 B — 과다 페이지 생성:**  
AGENT-2 Phase 1이 `totalPages`를 사용자 요청 `PageCount`와 무관하게 결정한다.  
Protocol에 `totalPages == PageCount` 강제 규칙이 없음.

**수정 A:** `injectionScript` 방식을 폐기. `src="img_0"` 패턴을 직접 string-replace로 대체.  
**수정 B:** `ai_generation_protocol-v4.0.md` AGENT:2 Phase 1에 `totalPages = PageCount` 강제 규칙 추가.

---

### NEW-3: Canvas guide 점선 잔존 [MEDIUM]

**현상:** `--color-guide` 색상은 변경됐으나 점선 테두리 자체가 여전히 표시된다.  
**근본 원인:** `Canvas.tsx` `data-canvas-guide` div가 삭제되지 않고 남아 있음.  
**수정:** `data-canvas-guide` div 전체 삭제.

---

### NEW-4: 이미지 404 에러 [CRITICAL]

**현상:** 터미널에 이미지 404 오류. 브라우저에서 이미지 슬롯이 비어있음.  
**근본 원인:**  
(a) `injectionScript` `<\/script>` 버그로 스크립트 자체가 동작하지 않음 (NEW-2 현상 A와 동일 원인).  
(b) `splitHtmlPages()`는 `</body>` 이전에 삽입된 스크립트를 개별 페이지 HTML에 포함하지 않는다.  
따라서 스크립트 주입 방식으로는 split 이후 각 페이지에서 이미지가 복원되지 않는다.  
**수정:** `injectionScript` 전면 폐기. route.ts에서 `finalHtml` 전체를 대상으로 `src="imageId"` → `src="data:...;base64,..."` 직접 치환. split 이전에 완료되므로 각 페이지에 데이터 URI가 이미 포함된 상태로 전달됨.

---

## 체크리스트

- [x] `lib/htmlUtils.ts` — splitHtmlPages() 구현
- [x] `app/page.tsx` — pages 분리 적용 + renderDocument에 currentPage HTML 전달
- [x] `app/api/print/route.ts` — CurrentDate Agent 1 컨텍스트 주입
- [x] `app/components/layout/PreviewStrip.tsx` — iframe srcdoc 전환
- [x] `app/globals.css` — --color-guide 색상 조정
- [x] `_context/protocol/ai_generation_protocol-v4.0.md` — AGENT:3 목차 규칙 + AGENT:2 company 바인딩 규칙 추가
- [x] `app/components/layout/Canvas.tsx` — data-canvas-guide div 삭제 (NEW-3)
- [x] `app/components/layout/Canvas.tsx` — artboard div overflow:hidden 추가 (NEW-1)
- [x] `app/api/print/route.ts` — injectionScript 폐기 → src 직접 string-replace (NEW-4 + NEW-2A)
- [x] `_context/protocol/ai_generation_protocol-v4.0.md` — AGENT:2 Phase 1 totalPages = PageCount 강제 규칙 추가 (NEW-2B)
- [x] `npx tsc --noEmit` — 타입 오류 0건

---

## Progress

- [x] 2026-04-16 — 근본 원인 분석 완료, 계획서 작성
- [x] 2026-04-16 — 무한 캔버스 그리드: globals.css body에 그리드 이동, --color-guide 수정, Canvas.tsx 투명 처리
- [x] 2026-04-16 — ISSUE-5: lib/htmlUtils.ts splitHtmlPages() 신규 생성, page.tsx pages 분리 적용
- [x] 2026-04-16 — ISSUE-4: route.ts templatePart 이미지 src 지시 강화 + Agent 2 Ph2 후처리 이미지 주입 스크립트 삽입
- [x] 2026-04-16 — ISSUE-6: PreviewStrip PageThumbnail dangerouslySetInnerHTML → iframe srcdoc 전환
- [x] 2026-04-16 — globals.css --color-guide rgba(0,255,255,0.5) → rgba(0,0,0,0.12) 수정
- [x] 2026-04-16 — ISSUE-1: route.ts Agent 1 컨텍스트에 CurrentDate 주입
- [x] 2026-04-16 — ISSUE-2/3: ai_generation_protocol-v4.0.md AGENT:3 목차 생성 규칙 + AGENT:2 company/date/src 바인딩 규칙 추가
- [x] 2026-04-16 — npx tsc --noEmit 타입 오류 0건 확인 (세션 5)
- [x] 2026-04-16 — NEW-3: Canvas.tsx data-canvas-guide 삭제 + artboard overflow:hidden (NEW-1)
- [x] 2026-04-16 — NEW-4 + NEW-2A: route.ts injectionScript 폐기 → src 직접 치환
- [x] 2026-04-16 — NEW-2B: protocol AGENT:2 Phase 1 totalPages 강제 규칙 추가
- [x] 2026-04-16 — npx tsc --noEmit 타입 오류 0건 재확인 (세션 6)

---

## Surprises & Discoveries

- **구조적 발견 (이미지 주입):** Agent 2 Phase 2는 HTML을 생성하지만 입력 이미지 base64를 받지 않는다. Agent 1에 전달된 이미지 데이터는 이후 파이프라인에서 소실된다. 이미지 슬롯을 채우는 것은 Gemini가 아닌 서버사이드 후처리여야 한다.
- **구조적 발견 (다중 페이지):** 현재 API 계약(`html: string`)은 단일 HTML 반환을 전제하므로, 페이지 분리는 서버 응답 변경 없이 프론트엔드 파싱으로 처리하는 것이 적합하다.
- **CSS 오염 메커니즘:** `dangerouslySetInnerHTML`로 주입된 HTML 내 `<style>` 태그는 shadow DOM 격리 없이 앱 전체 DOM에 즉시 적용된다. 썸네일 크기 1개라도 전체 앱 스타일에 영향을 미친다.

---

## Decision Log

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-16 | 이미지 주입: 서버사이드 후처리 채택 | Gemini에게 base64를 재전달하면 토큰 비용이 수십 배 증가. 서버에서 slotMapping 기반으로 post-process하는 것이 효율적 |
| 2026-04-16 | 페이지 분리: API 응답 구조 유지(html:string), 프론트엔드 파싱 | lib/types.ts PrintResult 변경 시 다른 컴포넌트 연쇄 수정 필요. 프론트 유틸로 분리하면 API 계약 불변 유지 가능 |
| 2026-04-16 | 썸네일: iframe srcdoc 전환 | dangerouslySetInnerHTML은 CSS 오염 구조적 해결 불가. iframe은 로드 비용이 있으나 완전한 격리 보장 |

---

## Outcomes & Retrospective

- **원래 목표 달성 여부**: [ ] Yes  [ ] Partial  [ ] No
- **결과 요약**: (완료 후 작성)
- **다음 작업에 반영할 것**: (완료 후 작성)

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
