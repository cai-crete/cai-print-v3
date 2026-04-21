# 작업지시서: n10-print 코드 리뷰 & 정합성 검토
**생성일**: 2026-04-20  
**요청**: 전체 코드 리뷰 및 정합성 검토

## 체크리스트

- [x] 전체 소스 파일 탐색 (`app/`, `lib/`, `app/api/`)
- [x] 오류·정합성 이슈 분석
- [x] 리뷰 문서 작성 (`docs/reviews/review-n10-print-code-integrity-2026-04-20.md`)

## 발견된 주요 이슈 (상세는 리뷰 문서 참고)

| 등급 | 항목 |
|------|------|
| HIGH | thumbnailUtils.ts visibility:hidden 사용 (html2canvas 렌더링 차단) |
| HIGH | lib/htmlUtils.ts 미사용 파일 (page.tsx와 중복 구현) |
| MED | Canvas.tsx mode prop 미사용 |
| MED | SavesModal.tsx onAddDocument dead code |
| MED | export.ts DXF scale 주석 불일치 |
| MED | convert/route.ts from_format 파라미터 미사용 |
| LOW | onSelectImages useCallback 누락 |
| LOW | MM 상수 중복 |
| LOW | thumbnailUtils.ts 불필요한 동적 import |

## 결과물

- `docs/reviews/review-n10-print-code-integrity-2026-04-20.md` 작성 완료

COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
