# Exec Plan — N10 Print 다중 페이지 렌더링 수정
작성일: 2026-04-17  
근거: `docs/reviews/review-n10-print-render-failure-2026-04-17.md`

---

## 목표
1. BUG-A: 다중 페이지 HTML 분리 렌더링 구현 (표지만 보이는 문제 수정)
2. BUG-B: GlobalHeader 오류 상태에 agentError 반영

---

## 체크리스트

### BUG-A — 다중 페이지 분리 렌더링
- [x] `page.tsx` — `splitHtmlPages()` 헬퍼 함수 추가
  - DOMParser로 `.page` div 분리
  - 각 페이지를 `<head>` 포함 독립 HTML로 래핑
  - SSR 환경(`window === undefined`) guard 추가
- [x] `page.tsx` — `pages` 계산 로직 교체: `[result.html]` → `splitHtmlPages(result.html)`
- [x] `page.tsx` — `renderDocument()` 내 `commonProps.html` 교체: `result.html` → `pages[currentPage]`

### BUG-B — 헤더 오류 상태 수정
- [x] `page.tsx` — GlobalHeader status: `error ?` → `(error || agentError) ?`

### 검증
- [x] `npx tsc --noEmit` 0 errors

---

## Outcomes

### 수정 내용
- `splitHtmlPages()` 함수 추가: DOMParser로 `.page` div를 분리 → 각각을 `<head>` 포함 독립 HTML로 래핑
- `pages` 배열이 진짜 페이지 개수만큼 채워짐 (6페이지 → `pages.length === 6`)
- `renderDocument()` 는 `pages[currentPage]` 를 DocumentFrame에 전달 → 선택된 페이지만 렌더링
- PreviewStrip 자동으로 6개 썸네일 표시 (기존 코드 수정 없이 작동)
- GlobalHeader: `agentError` 발생 시 'error' 상태 표시

### 재발 방지
- `splitHtmlPages()` 주석에 설계 의도 명시 (`.page` div 다중 스택 → overflow:hidden 문제)
- `.page` 없는 경우 / SSR 환경 양쪽 fallback 처리 완료
