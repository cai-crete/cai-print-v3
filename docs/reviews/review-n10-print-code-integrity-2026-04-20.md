# 코드 리뷰 & 정합성 검토 보고서
**프로젝트**: n10-print  
**검토일**: 2026-04-20  
**검토 범위**: `app/`, `lib/`, `app/api/` 전체 소스

---

## 요약

| 등급 | 건수 |
|------|------|
| HIGH (기능 오류 가능) | 2 |
| MED (정합성·품질 문제) | 4 |
| LOW (개선 사항) | 3 |

---

## HIGH — 기능 오류 가능

### H-1. `lib/thumbnailUtils.ts` — `visibility:hidden` 사용 (html2canvas 렌더링 차단 위험)

**파일**: `lib/thumbnailUtils.ts` (L37)

```ts
`visibility:hidden`,  // ← 문제
```

`lib/export.ts` 주석(L106)에 명시적으로:
> `// 화면 밖 오프스크린 배치 — visibility: hidden 금지 (렌더링 차단됨)`

`export.ts`는 `left: -(docW+500)px` 오프스크린 방식을 사용하지만, `thumbnailUtils.ts`는 `visibility:hidden`을 사용합니다.  
html2canvas는 `visibility:hidden` 요소 내부를 캡처하지 못하거나 빈 결과를 반환할 수 있습니다.  
현재는 try/catch로 실패 시 `null`을 반환해 폴백 처리되고 있어 무음 실패 중일 가능성이 높습니다.

**수정 방향**: `export.ts`와 동일하게 `left: -(docW+200)px` 오프스크린 방식으로 교체, `visibility:hidden` 제거.

---

### H-2. `lib/htmlUtils.ts` — 미사용(dead) 파일

**파일**: `lib/htmlUtils.ts`

`splitHtmlPages()`의 더 정교한 버전(균형 잡힌 div 파싱, 정규식 기반 page 탐지)이 구현되어 있으나, 프로젝트 어디에서도 **import되지 않습니다**.

`page.tsx`(L75)에는 동일 목적의 단순한 자체 버전이 별도로 구현되어 있습니다:
- `page.tsx` 버전: `DOMParser` 기반, `.page` querySelector 사용
- `htmlUtils.ts` 버전: 정규식 + `extractBalancedDiv()` 방식, SSR-safe

두 구현이 공존하면서 `htmlUtils.ts`는 완전히 사문화된 상태입니다.  
중첩 div가 복잡한 HTML에서 `page.tsx` 버전이 `.page` 단위 분리를 잘못 할 경우 htmlUtils.ts가 더 안전하게 처리할 수 있으나 현재 사용되지 않습니다.

**수정 방향**: `page.tsx`의 `splitHtmlPages`를 `htmlUtils.ts`로 교체하고 import, 또는 `htmlUtils.ts`를 명시적으로 삭제.

---

## MED — 정합성·품질 문제

### M-1. `app/components/layout/Canvas.tsx` — `mode` prop 미사용

**파일**: `Canvas.tsx` (L84, L95)

```ts
interface CanvasProps {
  mode?: string  // 정의는 되어 있으나…
  ...
}

export default function Canvas({ children, isEmpty, isLoading }: CanvasProps) {
  // mode가 destructure조차 되지 않음
```

`page.tsx`에서 `mode={mode}`를 전달하지만(`page.tsx` L582) Canvas 컴포넌트 내부에서 전혀 사용되지 않습니다. 불필요한 prop으로 인터페이스를 오염시킵니다.

**수정 방향**: `CanvasProps`에서 `mode` 필드 제거, `page.tsx`의 prop 전달도 제거.

---

### M-2. `app/components/modals/SavesModal.tsx` — `onAddDocument` dead code

**파일**: `SavesModal.tsx` (L11, L55–59)

```ts
onAddDocument?: (mode: string) => void  // prop 정의
...
const handleAddClick = () => {
  if (onAddDocument) { ... }  // 핸들러 정의
}
```

`handleAddClick`은 정의되어 있으나 **실제 JSX에 연결된 버튼이 없습니다**. UI에 렌더링되지 않고, `page.tsx`에서도 해당 prop을 전달하지 않습니다. 완전한 dead code입니다.

**수정 방향**: `onAddDocument` prop, `handleAddClick` 함수 전체 제거.

---

### M-3. `lib/export.ts` — DXF scale 주석과 코드 불일치

**파일**: `lib/export.ts` (L70–71)

```ts
// DXF는 텍스트 가독성과 선 정밀도를 위해 서버급 고도화 처리(scale: 4) 적용
const canvas = await captureCanvas(iframeBody, docW, docH, 3)
```

주석에는 `scale: 4`라고 명시했지만, 실제 코드는 `scale: 3`을 사용합니다.

**수정 방향**: 주석을 `scale: 3`으로 수정하거나, 의도가 4라면 코드를 수정.

---

### M-4. `app/api/convert/route.ts` — `from_format` 수신 파라미터 미사용

**파일**: `app/api/convert/route.ts` (L27, L57)

```ts
const { file, filename } = await req.json()  // from_format 수신하지 않음
...
from_format: 'png'  // 하드코딩
```

`lib/export.ts`(L206)는 `from_format: 'png'`를 요청 body에 포함해 전송하지만, route handler에서 해당 값을 읽지 않고 하드코딩합니다. 클라이언트에서 전달하는 의미가 없는 파라미터입니다.

**수정 방향**: 클라이언트(`export.ts`)에서 `from_format` 파라미터 전송 제거.

---

## LOW — 개선 사항

### L-1. `app/page.tsx` — `onSelectImages` 인라인 async 함수 (useCallback 누락)

**파일**: `page.tsx` (L724–741)

`LibraryModal`의 `onSelectImages` prop으로 인라인 async 함수를 전달합니다. `useCallback`으로 감싸지 않아 매 렌더링 시 새 함수 참조가 생성됩니다. 다른 핸들러들은 모두 `useCallback`을 사용하는 것과 일관성이 없습니다.

**수정 방향**: `onSelectImages` 핸들러를 `useCallback`으로 추출.

---

### L-2. `lib/export.ts` & `lib/types.ts` — `MM` 상수 중복

`types.ts`(L179)와 `export.ts`(L22) 양쪽에 `const MM = 3.7795275591` 로컬 상수가 각각 정의되어 있습니다.  
`types.ts`의 MM은 내보내지 않기 때문에 각 파일이 독자적으로 정의하는 구조입니다.  
값이 다르게 수정될 경우 불일치 가능성이 있습니다.

**수정 방향**: `types.ts`에서 `export const MM = ...`으로 내보내고, `export.ts`에서 import하여 단일 소스 유지.

---

### L-3. `lib/thumbnailUtils.ts` — `html2canvas` 동적 import로 인한 타입 참조 혼용

**파일**: `lib/thumbnailUtils.ts` (L61–70)

`export.ts`는 `import html2canvas from 'html2canvas'`를 정적으로 사용하는 반면, `thumbnailUtils.ts`는 `await import('html2canvas')`를 동적으로 사용합니다. 파일 선두에 `'use client'`가 명시된 클라이언트 전용 파일이므로 번들 분리 목적의 동적 import가 필요하지 않습니다.

**수정 방향**: 정적 import로 교체하여 `export.ts`와 일관성 유지.

---

## 불필요 코드 및 파일 요약

| 파일 | 유형 | 판단 |
|------|------|------|
| `lib/htmlUtils.ts` | 미사용 lib 파일 | 전체 미사용 — import하거나 삭제 필요 |
| `SavesModal.tsx` `onAddDocument` | dead prop + handler | 제거 가능 |
| `Canvas.tsx` `mode` prop | 미사용 prop | 제거 가능 |
| `export.ts` → `from_format` 전송 | 불필요 파라미터 | 제거 가능 |
| `sources/document_template/references/` | 참조용 원본 파일 | 앱에서 import 안 됨, 의도적 보관으로 보임 (요청 시 정리) |

---

## 정합성 확인 결과

| 항목 | 상태 |
|------|------|
| TypeScript 타입 정의 (`lib/types.ts`) ↔ 실제 사용 | ✅ 정합 |
| `DOC_SIZE` / `docSizeKey` 공유 사용 | ✅ 정합 (types → export, thumbnailUtils, DocumentFrame) |
| `SavedDocument` 인터페이스 ↔ saves.ts CRUD | ✅ 정합 |
| `AgentError` 체계 ↔ route.ts 오류 처리 | ✅ 정합 |
| `ExportFormat` 타입 ↔ ActionButtons FORMAT_OPTIONS | ✅ 정합 (dxf 포함) |
| `ALLOWED_MIME_TYPES` ↔ `compressImage` 출력 포맷 | ✅ 정합 (WebP 허용) |
| `currentDocId` 흐름 (새 저장/덮어쓰기/불러오기/초기화) | ✅ 정합 |
| library image API 경로 traversal 방지 | ✅ 구현됨 |
| Convertio 폴링 타임아웃 | ✅ 60초(30회×2s), 504 반환 |
| `splitHtmlPages` 두 구현 공존 | ⚠️ H-2 참고 |

---

COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
