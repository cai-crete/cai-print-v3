# 진단 리뷰 — N10 Print 문서 생성 렌더링 실패
작성일: 2026-04-17  
대상: `project.10_print`  
증상: Generate 후 표지(커버 페이지)만 보임 / 에러 메시지 미표시

---

## 결론 요약

| # | 분류 | 위치 | 심각도 |
|---|------|------|--------|
| BUG-A | 렌더링 구조 결함 — 다중 페이지가 단일 iframe에 묻힘 | `page.tsx:395`, `DocumentFrame.tsx` | CRITICAL |
| BUG-B | GlobalHeader 오류 상태 미반영 — agentError 시 'idle' 유지 | `page.tsx:431` | MEDIUM |

에이전트 파이프라인(AGENT-1 → 2-P1 → 3 → 2-P2) 자체는 정상 동작 중이다.  
오류 원인은 **렌더링 코드**에 있으며, 에이전트 문제가 아니다.

---

## BUG-A: 다중 페이지 HTML이 단일 iframe에 렌더링됨 (CRITICAL)

### 현상
- 6페이지 REPORT를 생성해도 PreviewStrip에 썸네일 1개만 표시됨
- Canvas에는 1페이지(표지)만 보임
- 2~6페이지는 보이지 않음

### 근본 원인

**[1단계] API는 전체 HTML을 단일 문자열로 반환**

`/api/print` Route는 AGENT-2-P2가 생성한 완성 HTML을 그대로 반환한다.  
이 HTML에는 6개의 `.page` div가 세로로 쌓인 구조다:

```html
<body>
  <div class="page"> ... 표지 ... </div>
  <div class="page"> ... 2페이지 ... </div>
  <div class="page"> ... 3페이지 ... </div>
  ...
</body>
```

Report 템플릿(`Report_template.html:17`)에서 확인:
```css
body { background: #525659; }
.page { width: 420mm; height: 297mm; margin: 20px auto; }
```
→ 모든 `.page`가 `margin: 20px auto`로 세로 스택 배치됨.

**[2단계] page.tsx가 전체 HTML을 1개 항목 배열로 처리**

```ts
// page.tsx:395
const pages: string[] = result?.html ? [result.html] : []
```

6페이지짜리 HTML 전체가 `pages[0]`에 들어간다. `pages.length === 1`.  
→ PreviewStrip 썸네일 1개, currentPage 전환 불가.

**[3단계] DocumentFrame이 iframe을 1페이지 크기로 고정**

```tsx
// DocumentFrame.tsx:149-155
<iframe
  srcDoc={injectNoScroll(html)}
  style={{
    width:  w,     // 1587px (A3 가로)
    height: h,     // 1122px (A3 세로) — 1페이지 분량만
    ...
    transform: `scale(${scale})`,
  }}
/>
```

외부 컨테이너 `overflow: hidden`(line 134) + 1페이지 height로 인해  
2페이지 이후 내용은 잘려서 보이지 않는다.

**[4단계] `pageIndex` prop이 미사용 상태**

`DocumentTemplateProps.pageIndex: number`는 타입 정의에 존재하지만  
`DocumentFrame`은 해당 props를 받지 않으며, 어떤 템플릿 컴포넌트도 페이지 분리 로직을 구현하지 않았다.

### 수정 방향

클라이언트 사이드에서 HTML을 페이지별로 분리한 뒤, 각각을 완전한 독립 HTML 문서로 래핑한다.

**방법:**

1. `page.tsx`에서 `result.html`을 받은 후 `.page` div 단위로 파싱
2. 각 `.page` 내용을 `<head>` 스타일과 함께 완전한 HTML로 래핑
3. 래핑된 HTML들을 `string[]`로 `pages` 상태에 저장
4. `DocumentFrame`은 `pages[currentPage]` 하나만 렌더링
5. `PreviewStrip`은 각 페이지의 독립 HTML을 썸네일로 표시

**파싱 로직 (의사코드):**
```ts
function splitHtmlPages(html: string): string[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headHtml = doc.head.outerHTML
  const pages = Array.from(doc.querySelectorAll('.page'))
  return pages.map(page =>
    `<!DOCTYPE html><html>${headHtml}<body>${page.outerHTML}</body></html>`
  )
}
```

단, `<head>` 재사용 시 인라인 `<script>` 태그에 주의 (Report 템플릿은 `document.write()` JS 사용).  
injectNoScroll은 각 래핑된 HTML에 그대로 적용.

---

## BUG-B: GlobalHeader 오류 상태 미반영 (MEDIUM)

### 현상
- AGENT-2-P2 TIMEOUT 등 에이전트 오류 발생 시 헤더가 'idle' 상태 유지
- 사용자가 생성이 실패했음을 헤더에서 인지 불가

### 근본 원인

```tsx
// page.tsx:431
<GlobalHeader
  status={isGenerating ? 'generating' : error ? 'error' : 'idle'}
/>
```

`agentError` 상태는 status 계산에서 누락됨.

```ts
// AgentApiError 발생 시 (page.tsx:218-221)
if (err instanceof AgentApiError) {
  setAgentError(err.info)  // agentError만 set
  // error는 null 유지 → 헤더 'idle' 표시
}
```

### 수정 방향

```tsx
status={isGenerating ? 'generating' : (error || agentError) ? 'error' : 'idle'}
```

---

## 에이전트 파이프라인 이상 없음

아래 사항은 코드 검토 결과 정상 동작이 확인됨:

| 항목 | 상태 | 근거 |
|------|------|------|
| AGENT-1 스키마 검증 | ✅ | `validateSchema(agent1, ['images', 'masterData'])` |
| AGENT-2-P1 스키마 검증 | ✅ | `validateSchema(agent2Phase1, ['templateType', 'totalPages', 'slots'])` |
| AGENT-3 스키마 검증 | ✅ | `validateSchema(agent3, ['texts'])` |
| AGENT-2-P2 스키마 검증 | ✅ | `validateSchema(agent2Phase2, ['html', 'slotMapping'])` |
| AgentError 격리 (4단계 try-catch) | ✅ | `route.ts:319,363,397,421` |
| 이미지 src 후처리 주입 | ✅ | `route.ts:428-440` |
| partialLog 축적 | ✅ | 각 에이전트 완료 후 축적 |

표지(1페이지)가 정상 렌더링된다는 사실 자체가 AGENT-2-P2까지 성공적으로 실행된 증거다.

---

## 파일 영향 범위

| 파일 | 필요 변경 |
|------|----------|
| `project.10_print/app/page.tsx` | `splitHtmlPages()` 함수 추가, `pages` 상태 로직 교체, GlobalHeader status 수정 |
| `project.10_print/app/components/templates/DocumentFrame.tsx` | 변경 없음 (단일 페이지 HTML 입력 가정이 유지됨) |
| `project.10_print/app/components/templates/ReportTemplate.tsx` | 변경 없음 |
| `project.10_print/app/components/layout/PreviewStrip.tsx` | 변경 없음 (pages[] 구조가 이미 다중 항목을 지원함) |

---

COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
