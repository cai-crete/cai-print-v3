# Error Review Report — v.6

> 작성일: 2026-04-20
> 검토 범위: project.10_print/ 전체 코드베이스 — 세션 9 이후 누적 변경 정합성 검토
> 검토자 역할: 시니어 개발 전문가 (독립 정합성 검토)
> 이전 보고서: Error_Review_Report-v.5-260416.md / review-n10-print-render-failure-2026-04-17.md

---

## 개요

**검토 배경**

세션 9(2026-04-17)에서 두 가지 런타임 버그(BUG-A: 다중 페이지 렌더링 / BUG-B: agentError GlobalHeader 반영)가 수정되었다. 본 리뷰는 해당 수정 이후 코드베이스 전체를 독립적으로 재검토하여 잔존 결함 및 신규 위험 요소를 식별한다.

**검토 대상 파일 목록**

| 레이어 | 파일 |
|--------|------|
| Entry | `app/page.tsx`, `app/layout.tsx` |
| API Routes | `app/api/print/route.ts`, `app/api/library/route.ts`, `app/api/library/image/route.ts` |
| Components — Layout | `app/components/layout/Canvas.tsx`, `GlobalHeader.tsx`, `PreviewStrip.tsx`, `Toolbar.tsx` |
| Components — Sidebar | `app/components/sidebar/ImageInsert.tsx`, `PurposeSelector.tsx`, `ActionButtons.tsx` |
| Components — Templates | `app/components/templates/DocumentFrame.tsx`, `ReportTemplate.tsx`, `PanelTemplate.tsx`, `DrawingTemplate.tsx`, `VideoTemplate.tsx` |
| Lib | `lib/types.ts`, `lib/prompt.ts`, `lib/htmlUtils.ts`, `lib/imageUtils.ts`, `lib/export.ts`, `lib/saves.ts`, `lib/agentErrors.ts` |
| Config | `next.config.ts`, `tsconfig.json`, `package.json` |

---

## 결함 목록

### [HIGH-1] API 응답 타입 불일치 — library route 조기 반환

**파일**: `app/api/library/route.ts`
**위치**: 17–18줄

**현상**:
```typescript
if (!fs.existsSync(LIBRARY_DIR)) {
  return NextResponse.json([] as LibraryFolder[])  // ← 배열 반환
}
// ...정상 경로:
return NextResponse.json({ folders, rootImages })  // ← 객체 반환
```

라이브러리 디렉토리가 없을 때 `[]`(배열)을 반환하고, 정상 경로에서는 `{ folders, rootImages }`(객체)를 반환한다. 클라이언트 코드가 항상 객체 형태를 기대하므로 타입 불일치 발생.

**영향**: `LIBRARY_DIR` 미존재 시 클라이언트에서 `response.folders` → `undefined`, `response.rootImages` → `undefined` 로 읽혀 라이브러리 모달에서 런타임 에러 또는 빈 화면 표시.

**처방**:
```typescript
if (!fs.existsSync(LIBRARY_DIR)) {
  return NextResponse.json({ folders: [], rootImages: [] })
}
```

---

### [HIGH-2] lib/saves.ts — 'use client' 지시자 누락

**파일**: `lib/saves.ts`
**위치**: 파일 최상단

**현상**: 파일이 `localStorage`를 직접 사용하나 `'use client'` 지시자가 없다. Next.js 15에서 서버 컴포넌트가 이 모듈을 import하면 `localStorage is not defined` 에러가 발생할 수 있다.

**영향**: 현재는 클라이언트 컴포넌트에서만 사용 중이나, 향후 서버 컴포넌트나 서버 액션에서 실수로 import 시 런타임 에러 유발. 코드 경계가 불명확해 유지보수 위험 증가.

**처방**: 파일 첫 줄에 `'use client'` 추가.

---

### [MEDIUM-1] lib/export.ts — DOC_SIZE를 UI 컴포넌트에서 역임포트

**파일**: `lib/export.ts`
**위치**: 20줄

**현상**:
```typescript
import { DOC_SIZE, docSizeKey } from '@/app/components/templates/DocumentFrame'
```

`lib/` 레이어(데이터/유틸)가 `app/components/` 레이어(UI)에 의존한다. 이는 레이어 방향성 역전 (lib → app/components).

**영향**: `DocumentFrame` 리팩토링 시 `export.ts`도 함께 수정해야 하는 결합도 증가. lib 레이어 독립성 훼손. 테스트 작성 시 UI 컴포넌트 mock 필요.

**처방**: `DOC_SIZE`, `docSizeKey` 상수를 `lib/types.ts` 또는 `lib/constants.ts`로 이동하고, `DocumentFrame`과 `export.ts` 모두 해당 위치에서 import.

---

### [MEDIUM-2] app/api/print/route.ts — pageCount NaN 검증 미흡

**파일**: `app/api/print/route.ts`
**위치**: 124–126줄

**현상**:
```typescript
const pageCount = formData.get('pageCount')
  ? parseInt(formData.get('pageCount') as string)
  : undefined
```

`parseInt`는 파싱 실패 시 `NaN`을 반환하나 검증이 없다. 예: `pageCount = "abc"` 입력 시 `NaN`이 페이지 카운트로 전달된다.

**영향**: `NaN`이 Gemini 프롬프트에 포함되어 AI 응답 품질 저하 가능. 조건 분기(예: `pageCount > 1`)에서 의도치 않은 결과 유발.

**처방**:
```typescript
const pageCountRaw = formData.get('pageCount')
const pageCountParsed = pageCountRaw ? parseInt(pageCountRaw as string, 10) : undefined
const pageCount = pageCountParsed !== undefined && !isNaN(pageCountParsed)
  ? pageCountParsed
  : undefined
```

---

### [MEDIUM-3] page.tsx — agent1 임시 타입 사용

**파일**: `app/page.tsx`
**위치**: ~268줄 (`let agent1: ReturnType<typeof Object>` 또는 유사 임시 타입)

**현상**: `agent1` 변수에 구체적 인터페이스 대신 임시 타입이 사용된다. 이후 `agent1.images`, `agent1.masterData` 접근 시 타입 안전성이 보장되지 않는다.

**영향**: TypeScript가 `agent1` 속성 접근을 검증하지 못해 런타임에만 오류 발견. `strict: true` 환경에서 명시적 타입 캐스팅이 강제되어 코드 가독성 저하.

**처방**: `lib/types.ts`에 `Agent1Output` 인터페이스를 정의하고 적용:
```typescript
interface Agent1Output {
  images: Array<{ id: string; filename: string; base64: string }>
  masterData: Record<string, string>
  logPreStep: string
  logStep1: string
  logStep2: string
}
```

---

### [LOW-1] lib/htmlUtils.ts — splitHtmlPages 빈 입력 반환값 불일치

**파일**: `lib/htmlUtils.ts`
**위치**: 29–31줄

**현상**:
```typescript
if (!html || html.trim() === '') return []   // 빈 배열 반환
if (matches.length === 0) return [html]       // 단일 원소 배열 반환
```

빈 HTML 입력 시 빈 배열(`[]`)을 반환하는 분기와, 페이지 분리 실패 시 원본을 단일 원소로 감싸 반환하는 분기가 의미적으로 다르다. 호출처(`page.tsx:504`)에서는 빈 배열을 처리하나, 의도상 "유효한 HTML이 있으면 최소 1개 페이지 반환" 의미로 통일하는 것이 명확하다.

**영향**: 빈 문자열이 전달될 경우 `pages = []` → 캔버스에 아무것도 렌더링되지 않음(현재는 생성 완료 후에만 호출되므로 실제 발생 가능성 낮음).

**처방**: 의미 통일 또는 주석 명시.
```typescript
if (!html || html.trim() === '') return []  // 유효한 HTML 없음 — 빈 배열 의도적 반환
```

---

### [LOW-2] ImageInsert.tsx — useMemo 의존성 불완전

**파일**: `app/components/sidebar/ImageInsert.tsx`
**위치**: ~131줄

**현상**:
```typescript
const previewUrl = useMemo(() => URL.createObjectURL(file), [file])
```

`file` 객체가 동일한 파일명과 내용이지만 새로 생성된 객체일 경우, React 비교(참조 동일성)에서 불일치가 발생해 불필요한 ObjectURL 재생성이 일어날 수 있다. 반대로, 파일 교체 시에도 참조 동일성이 유지된다면 재생성이 안 될 수 있다.

**영향**: ObjectURL 메모리 누수(revoke 없이 재생성) 가능성.

**처방**: `file.name + file.lastModified`를 의존성에 포함하거나, `useEffect`에서 revoke를 처리:
```typescript
const previewUrl = useMemo(() => URL.createObjectURL(file), [file.name, file.lastModified, file.size])
```

---

### [LOW-3] lib/prompt.ts — 서버 전용 모듈 클라이언트 import 혼재 위험

**파일**: `lib/prompt.ts`
**위치**: 1–2줄

**현상**: `import fs from 'fs'`가 포함된 서버 전용 파일. 현재 `page.tsx`가 `buildVideoInjectionPrompt`를 import하지 않으나, `prompt.ts` 전체를 import하면 번들러가 `fs` 모듈 처리 실패 또는 경고를 발생시킬 수 있다.

**영향**: 현재는 `app/api/print/route.ts`에서만 import되므로 문제 없음. 그러나 향후 클라이언트 컴포넌트에서 실수로 import 시 `Module not found: Can't resolve 'fs'` 에러.

**처방**: 파일 상단에 서버 전용임을 명시하는 주석 또는 Next.js `server-only` 패키지 사용:
```typescript
import 'server-only'
```

---

## 결함 요약

| 심각도 | 건수 | 주요 내용 |
|--------|------|----------|
| CRITICAL | 0 | — |
| HIGH | 2 | library route 응답 타입 불일치, saves.ts 클라이언트 경계 미표시 |
| MEDIUM | 3 | export.ts 레이어 역전, pageCount NaN, page.tsx 임시 타입 |
| LOW | 3 | splitHtmlPages 반환 의미, useMemo 의존성, prompt.ts 서버 전용 미표시 |
| ADVISORY | 0 | — |
| **합계** | **8** | |

---

## 긍정 항목 (잘 된 것)

1. **splitHtmlPages() 구현 완결성** — DOMParser + 중첩 div 추출 로직(`extractBalancedDiv`)이 정확하게 구현되어 BUG-A(표지만 렌더링)를 근본적으로 해결했다.

2. **agentErrors.ts 구조화** — `AgentError` 클래스가 심각도(CRITICAL/HIGH/MEDIUM/LOW), 단계(STAGE), 복구 가이드를 포함하여 UI에서 맥락 있는 에러 메시지 표시가 가능하다.

3. **export.ts iframe 격리 패턴** — 히든 `<iframe srcdoc>` 방식으로 앱 CSS와 격리된 환경에서 html2canvas 캡처를 수행하여 스타일 오염 없이 정확한 출력물 생성이 가능하다.

4. **app/api/print/route.ts 보안 검증** — 파일 크기, MIME 타입, 프롬프트 길이 등 입력 검증이 체계적으로 구현되어 있다.

5. **GlobalHeader agentError 반영** — `(error || agentError)` 조건으로 BUG-B가 정확히 수정되었다.

6. **TypeScript strict 모드** — `tsconfig.json`에서 `strict: true`가 활성화되어 전반적인 타입 안전성이 유지된다.

---

## 권고 사항

### 즉시 수정 권고 (HIGH)

| 순위 | 결함 ID | 이유 |
|------|---------|------|
| 1 | HIGH-1 | 라이브러리 디렉토리 없는 환경(초기 설정, 배포)에서 런타임 에러 발생 가능 |
| 2 | HIGH-2 | Next.js 15 서버 컴포넌트 모델에서 잠재적 런타임 에러, 코드 경계 불명확 |

### 다음 개발 단계 전 권고 (MEDIUM)

| 순위 | 결함 ID | 이유 |
|------|---------|------|
| 3 | MEDIUM-1 | lib/export.ts 레이어 역전 — 테스트 및 리팩토링 시 결합도 증가 |
| 4 | MEDIUM-2 | pageCount NaN — 잘못된 값이 Gemini 프롬프트에 노출될 수 있음 |
| 5 | MEDIUM-3 | page.tsx 임시 타입 — TypeScript 보호막 해제 상태 |

### 선택적 개선 (LOW)

- LOW-1~3: 코드 품질 및 미래 유지보수성 개선. 기능 동작에는 현재 영향 없음.

---

## 전체 판정

| 항목 | 판정 |
|------|------|
| CRITICAL | 0건 ✅ |
| HIGH | 2건 ⚠️ — 수정 권고 |
| MEDIUM | 3건 ⚠️ — 다음 단계 전 수정 권고 |
| LOW | 3건 ℹ️ — 선택적 개선 |
| 코드베이스 완결성 | **조건부 PASS** |

> **판정 근거**: 세션 9에서 수정된 BUG-A/BUG-B는 올바르게 해결되었다. CRITICAL 결함은 없으나, HIGH-1(library route 응답 타입 불일치)은 초기 배포 환경 또는 라이브러리 디렉토리 미존재 시 즉시 런타임 에러를 유발할 수 있으므로 수정 후 Stage 진입 권고.

---

## 수정 체크리스트

- [ ] [HIGH-1] library route 조기 반환 응답 타입 불일치 — `app/api/library/route.ts:18`
- [ ] [HIGH-2] saves.ts 'use client' 지시자 누락 — `lib/saves.ts:1`
- [ ] [MEDIUM-1] export.ts DOC_SIZE 역임포트 — `lib/export.ts:20`
- [ ] [MEDIUM-2] pageCount NaN 검증 부재 — `app/api/print/route.ts:124`
- [ ] [MEDIUM-3] agent1 임시 타입 — `app/page.tsx:~268`
- [ ] [LOW-1] splitHtmlPages 빈 입력 반환 의미 명확화 — `lib/htmlUtils.ts:29`
- [ ] [LOW-2] ImageInsert useMemo 의존성 보강 — `app/components/sidebar/ImageInsert.tsx:131`
- [ ] [LOW-3] prompt.ts server-only 표시 — `lib/prompt.ts:1`

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
