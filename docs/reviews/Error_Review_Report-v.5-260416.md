---
Error Review Report
Node: n10-print (frontend refactor — 프론트엔드 컴포넌트 분리 구현)
Version: v.5
Date: 2026-04-16
Reviewer: Execution Agent (Claude Sonnet 4.6)
Previous report: Error_Review_Report-v.4-260415.md
---

## 검토 범위

다른 에이전트가 구현한 프론트엔드 컴포넌트 분리 작업 전체를 대상으로 한다.
단일 `app/page.tsx` 모놀리식 구조에서 다음 컴포넌트로 분리됨:

```
app/
  components/
    layout/    GlobalHeader, Toolbar, Sidebar, Canvas, PreviewStrip
    sidebar/   NodeSelector, ImageInsert, PurposeSelector, PageCountControl,
               PromptInput, ActionButtons
    modals/    LibraryModal, SavesModal
    templates/ ReportTemplate, PanelTemplate, DrawingTemplate, VideoTemplate
lib/
  types.ts     (신규 — 공유 타입 허브)
app/globals.css (확장 — 디자인 토큰 추가)
app/page.tsx    (전면 재작성 — State Orchestrator)
app/layout.tsx  (폰트 시스템 적용)
```

**검토 방법:**
1. 수동 코드 검토 — 모든 신규 파일 전체 독해
2. 정적 분석 — `code_quality_checker.py` (24개 파일)
3. PR diff 분석 — `pr_analyzer.py` (HEAD~1 vs HEAD)
4. RELIABILITY.md / SECURITY.md 교차검증
5. `npx next build` 빌드 검증

> **Note:** 신규 컴포넌트 파일(layout/, sidebar/, modals/, templates/)은 미커밋 상태로,
> pr_analyzer는 HEAD~1 커밋 범위만 스캔. 신규 파일은 수동 검토로 보완.

---

## 수정이 완료된 결함

### CRITICAL-1 — CSS 토큰 5개 미정의 (수정 완료)

**위치:** `app/globals.css`

**문제:**
컴포넌트 전반에서 참조하는 CSS 변수 5개가 `globals.css`에 정의되지 않았다.

| 미정의 토큰 | 참조 위치 | 영향 |
|---|---|---|
| `--sidebar-spacing` | Canvas, PreviewStrip (`right:`) | **레이아웃 파괴** — Canvas/PreviewStrip이 사이드바와 겹침 |
| `--color-placeholder` | Canvas, ImageInsert, PreviewStrip, LibraryModal, SavesModal, Toolbar | 배경색 투명 처리 |
| `--color-border` | Canvas, PreviewStrip, LibraryModal, SavesModal | 보더 미표시 |
| `--color-border-header` | LibraryModal, SavesModal 헤더 구분선 | 구분선 미표시 |
| `--color-guide` | Canvas 가이드라인 | 대지 외곽선 미표시 |

**수정 내용 (`app/globals.css`):**
```css
--sidebar-spacing: calc(var(--sidebar-w) + 3.25rem); /* = 21.25rem @ desktop */
--color-placeholder:    #F8F8F8;
--color-border:         var(--color-gray-200);  /* #CCCCCC */
--color-border-header:  var(--color-gray-100);  /* #EEEEEE */
--color-guide:          rgba(0, 255, 255, 0.5);
```

`--sidebar-spacing` 근거 (design-style-guide.md §9.1):
- 사이드바 너비: `var(--sidebar-w)` = 18rem
- 우측 여백: `var(--gap-global)` = 1rem
- Preview Strip right 설계값: 21.25rem = 18rem + 3.25rem ✓
- 반응형 적응: `--sidebar-w`가 0rem으로 줄면 `--sidebar-spacing`도 3.25rem으로 자동 축소

**상태:** ✅ 수정 완료 · 빌드 검증 완료

---

### CRITICAL-2 — 구버전 VideoTemplate 중복 잔존 (수정 완료)

**위치:** `app/components/VideoTemplate.tsx` (구버전)

**문제:**
Stage 0에서 생성한 구버전 VideoTemplate이 삭제되지 않은 채 잔존.
신규 구현 (`app/components/templates/VideoTemplate.tsx`)과 공존하여
import 경로 혼란 및 빌드 트리 오염 가능성 존재.

- 구버전: Tailwind 클래스 기반, `VideoTemplateProps` 타입 미적용
- 신버전: CSS 토큰 기반, `lib/types.ts`의 `VideoTemplateProps` 적용
- `page.tsx`는 신버전(`templates/VideoTemplate`)을 정확히 임포트하나
  구버전이 tsconfig include 범위 내에 존재함

**수정 내용:** `app/components/VideoTemplate.tsx` 삭제

**상태:** ✅ 수정 완료 · 빌드 검증 완료

---

## 정적 분석 결과 (code_quality_checker.py)

**실행 범위:** `project.10_print/` 전체 (24개 파일)

| 카테고리 | 건수 | 판정 |
|---|---|---|
| complexity (deep_nesting) | 878 | 비차단 — React/JSX 구조 특성 |
| debug | 1 | 비차단 — 오탐 (의도된 서버 로깅) |
| style (trailing_whitespace, line_too_long) | 2907 | 비차단 — 교차검증 불필요 |
| **security** | **0** | **✓ 이상 없음** |
| **bug / error_handling** | **0** | **✓ 이상 없음** |

**상세:**

- **complexity 878건:** React JSX의 props 객체 / 중첩 컴포넌트 트리 구조에서
  정적 분석기가 블록 깊이를 과대 계산하는 구조적 한계. RELIABILITY.md에 기준 없음. 비차단.

- **debug 1건:** `route.ts:168` `console.error('[API Error]', error)` —
  RELIABILITY.md §로깅 기준 "에러 응답 처리" 항목의 의도된 서버 에러 로깅.
  클라이언트에 노출되지 않음. 오탐. 비차단.

- **style 2907건:** 모두 trailing_whitespace 또는 줄 길이 초과.
  교차검증 기준 문서 해당 없음. 비차단.

---

## PR Diff 분석 결과 (pr_analyzer.py)

**실행 범위:** HEAD~1(Loop B Iter 2 커밋)...HEAD 비교

> 신규 컴포넌트 파일은 미커밋 상태로 pr_analyzer 스캔 범위에 포함되지 않음.
> 해당 파일들은 수동 검토로 대체 (아래 §수동 코드 검토 참조).

| 카테고리 | 건수 | 판정 |
|---|---|---|
| debug_statement | 3 | 비차단 — 오탐 (.md 보고서 파일 내 텍스트) |
| style | 48 | 비차단 — .md 파일 긴 줄, 교차검증 불필요 |
| **security** | **0** | **✓ 이상 없음** |
| **bug / error_handling** | **0** | **✓ 이상 없음** |

debug_statement 3건 상세:
- `docs/exec-plans/active/code-review-n10-print-2026-04-15.md:548` × 2 — 보고서 본문에서 `console.log` 언급. 소스 코드 아님. 오탐.
- `docs/exec-plans/active/loop-b-report-n10-print-2026-04-15-iter1.md:70` — 동일 패턴. 오탐.

---

## RELIABILITY.md / SECURITY.md 교차검증

| 항목 | 기준 | 결과 |
|---|---|---|
| API 응답 타임아웃 30초 | RELIABILITY.md §API 안정성 | ✓ `withTimeout(…, 30_000)` [route.ts:16-21] |
| 재시도 최대 2회 + 지수 백오프 | RELIABILITY.md §API 안정성 | ✓ `withRetry()` [route.ts:23-36] |
| Protocol null 방어 | RELIABILITY.md §Protocol 주입 실패 | ✓ `if (!systemInstruction) throw` [route.ts:109-111] |
| API 키 하드코딩 금지 | SECURITY.md §API 키 관리 | ✓ `process.env.GOOGLE_AI_API_KEY` |
| Protocol 서버사이드 전용 | SECURITY.md §Protocol 파일 보안 | ✓ `buildPrintSystemPrompt()` API Route에서만 호출 |
| 이미지 타입 검증 (JPEG/PNG/WebP) | SECURITY.md §입력 검증 | ✓ `ALLOWED_MIME_TYPES` [route.ts:10] + 서버사이드 루프 |
| 이미지 크기 제한 10MB | SECURITY.md §입력 검증 | ✓ `MAX_IMAGE_SIZE` [route.ts:8] |
| 텍스트 길이 제한 2000자 | SECURITY.md §입력 검증 | ✓ `MAX_PROMPT_LENGTH` [route.ts:9] |
| 이미지 디스크 미저장 | SECURITY.md §입력 검증 | ✓ in-memory base64 변환만 수행 |

**security findings: 0건 ✓**
**RELIABILITY.md 위반 bug/error_handling: 0건 ✓**

---

## 수동 코드 검토 — 신규 컴포넌트

### lib/types.ts

- 전체 타입 중앙화 구조 정상. `PrintMode`, `PrintResult`, `HistoryEntry` 등 일관성 확인.
- `PrintResult.slotMapping: Record<string, string>` ← route.ts responseSchema의 `{ type: 'OBJECT' }` 기반
  Gemini가 실제로 string 값 반환 시 정합. 타입 불일치 위험 낮음 (슬롯 ID → 파일명 매핑).
- 판정: 이상 없음

### app/page.tsx (State Orchestrator)

- 상태 관리 완전성: mode, images, videoStart/EndImage, prompt, pageCount, result,
  isGenerating, error, history/historyIndex, isSidebarOpen, isLibraryOpen, isSavesOpen 전부 존재.
- Undo/Redo 기반 구조 정상 (Stage 2 완성 예정).
- `pages: [result.html]` 단일 원소 배열 — Stage 2에서 다중 페이지 추출 예정. 현재 의도된 구조.
- `eslint-disable-next-line @typescript-eslint/no-unused-vars` 처리: handleExport, handleLibrarySelectImage,
  handleSavesOpen, handleSavesDelete — 모두 Stage 2/3 예정 핸들러. 정상 처리.
- 판정: 이상 없음

### layout/ 컴포넌트

| 파일 | 검토 결과 |
|---|---|
| GlobalHeader | 상태 표시(idle/generating/error), CSS 토큰 정상 적용 |
| Toolbar | `data-toolbar` attr 적용(print CSS 소거 대응), `--color-placeholder` hover (C-1 수정 후 정상) |
| Sidebar | 접기/펼치기 애니메이션, headerSlot/contentSlot/footerSlot 슬롯 구조 정상 |
| Canvas | `data-canvas-guide` attr, 그리드 배경, empty/loading/content 상태 분기, `--sidebar-spacing` (C-1 수정 후 정상) |
| PreviewStrip | 스크롤 썸네일, 페이지 번호 직접 입력 전환, `--sidebar-spacing` (C-1 수정 후 정상) |

### sidebar/ 컴포넌트

| 파일 | 검토 결과 |
|---|---|
| NodeSelector | UI 전용, 기능 비활성 의도적 |
| ImageInsert | ObjectURL 생성/해제(`useMemo` + `useEffect`) 정상, VIDEO/일반 모드 분기 정상 |
| PurposeSelector | PANEL 서브토글, VIDEO 스펙 표시 정상 |
| PageCountControl | VIDEO 숨김, DRAWING 고정(1) 정상 |
| PromptInput | `maxLength` prop 적용, 잔여글자 표시 조건(200자 미만) 정상 |
| ActionButtons | `_onExport` 언더스코어 처리 — Stage 2 예정. 비차단. |

### modals/ 컴포넌트

| 파일 | 검토 결과 |
|---|---|
| LibraryModal | 폴더 목록 → 이미지 그리드 2단계 탐색, 오버레이 클릭 닫기 정상 |
| SavesModal | 문서 열기/삭제 분리, 그룹 hover 삭제 버튼 정상 |

**공통 패턴:** `zIndex: 'var(--z-modal)' as React.CSSProperties['zIndex']` —
`zIndex`에 CSS 변수 문자열 전달. TypeScript 타입 캐스팅 필요한 패턴이나 실제 CSS 변수 해석은
브라우저가 처리하므로 동작상 문제 없음. 비차단.

### templates/ 컴포넌트

| 파일 | 검토 결과 |
|---|---|
| ReportTemplate | `dangerouslySetInnerHTML`, scale prop 정상, Stage 2 비고 명시 |
| PanelTemplate | `aspectRatio` orientation 분기 (1189/841 vs 841/1189) 정상 |
| DrawingTemplate | A3 + 도각 비고, Stage 2 masterData 연동 예정 명시 |
| VideoTemplate | `videoUri` null 처리, `<video>` controls/autoPlay/loop 정상 |

---

## 빌드 검증

```
npx next build (수정 후)
✓ Compiled successfully in 2.5s
✓ Linting and checking validity of types
✓ Generating static pages (5/5)
타입 오류: 0건 / 빌드 오류: 0건
```

---

## Known Limitations (차단 결함 아님)

| ID | 위치 | 내용 | 예정 |
|---|---|---|---|
| L-1 | page.tsx:270 | PreviewStrip pages[]가 항상 단일 원소 배열. 다중 페이지 DOM 추출 미구현. | Stage 2 |
| L-2 | ActionButtons.tsx | EXPORT 버튼 onClick 없음. 클릭 무반응. | Stage 2 |
| L-3 | LibraryModal, SavesModal | folders[], documents[] 항상 빈 배열 전달. UI만 구현. | Stage 2 |
| L-4 | Canvas.tsx | 무한 캔버스 팬/줌 미구현. 고정 레이아웃. | Stage 2 |
| L-5 | route.ts:88-93 | VIDEO 모드 501 반환. Veo API 미연동. | Stage 3 |
| L-6 | 전체 | Undo/Redo 기반 구조만 존재. 실제 편집 이력 없음. | Stage 2 |

---

## 최종 판정

| 검토 항목 | 결과 |
|---|---|
| 수동 정합성 검토 — CRITICAL 결함 수정 | ✅ 2건 수정 완료 (C-1, C-2) |
| 빌드 검증 | ✅ PASS (타입 0건, 오류 0건) |
| code_quality_checker — security | ✅ 0건 |
| code_quality_checker — bug/error_handling | ✅ 0건 |
| pr_analyzer — security | ✅ 0건 |
| pr_analyzer — bug/error_handling | ✅ 0건 |
| SECURITY.md 교차검증 | ✅ 전 항목 준수 |
| RELIABILITY.md 교차검증 | ✅ 전 항목 준수 |

**차단 결함: 0건**

**PASS — 수정 완료 상태로 정합성 확보됨**

---

## 수정 파일 목록

| 파일 | 변경 유형 | 내용 |
|---|---|---|
| `project.10_print/app/globals.css` | 수정 | CSS 토큰 5개 추가 (`--sidebar-spacing` 외) |
| `project.10_print/app/components/VideoTemplate.tsx` | 삭제 | 구버전 중복 파일 제거 |

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`