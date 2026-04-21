# 작업지시서: n10-print 코드 이슈 수정
**생성일**: 2026-04-21  
**참조**: `docs/reviews/review-n10-print-code-integrity-2026-04-20.md`  
**요청**: 리뷰에서 발견된 이슈 전체 수정

## 체크리스트

### HIGH — 기능 오류 수정
- [x] **H-1** `lib/thumbnailUtils.ts` — `visibility:hidden` 제거 (오프스크린 방식은 이미 적용되어 있었음)
- [x] **H-2** `lib/htmlUtils.ts` — `page.tsx`의 `splitHtmlPages` 인라인 구현 제거, `htmlUtils.ts` import로 교체

### MED — 정합성·품질 수정
- [x] **M-1** `app/components/layout/Canvas.tsx` — `mode` prop 제거 (`CanvasProps` 및 `page.tsx` 전달부 동시 제거)
- [x] **M-2** `app/components/modals/SavesModal.tsx` — `onAddDocument` prop·`handleAddClick` 함수 전체 제거
- [x] **M-4** `lib/export.ts` — `from_format: 'png'` 전송 제거

### LOW — 개선 사항
- [x] **L-1** `app/page.tsx` — `onSelectImages` 인라인 async 함수 → `handleSelectImages` useCallback으로 추출
- [x] **L-2** `lib/types.ts` → `export const MM` 으로 변경, `lib/export.ts`에서 import하여 중복 제거
- [x] **L-3** `lib/thumbnailUtils.ts` — `html2canvas` 동적 import → 정적 import로 교체

## 수정 완료 후
- [x] TypeScript 빌드 오류 없음 확인 (`tsc --noEmit`) — 오류 없음
- [x] 작업 완료 후 `docs/exec-plans/progress/claude-progress.txt` 업데이트

## 참고

| 이슈 | 파일 | 위치 |
|------|------|------|
| H-1 | `lib/thumbnailUtils.ts` | L39 |
| H-2 | `lib/htmlUtils.ts`, `app/page.tsx` | page.tsx L75 인라인 구현 |
| M-1 | `app/components/layout/Canvas.tsx` | L85 |
| M-2 | `app/components/modals/SavesModal.tsx` | L12, L55-59 |
| M-4 | `lib/export.ts` | L207 |
| L-1 | `app/page.tsx` | L724 |
| L-2 | `lib/types.ts` L179, `lib/export.ts` L22 | |
| L-3 | `lib/thumbnailUtils.ts` | L62 |

> M-3 (DXF scale 주석 불일치)는 커밋 28abc0d에서 scale이 1로 변경되며 자동 해소됨 — 수정 불필요.

COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
