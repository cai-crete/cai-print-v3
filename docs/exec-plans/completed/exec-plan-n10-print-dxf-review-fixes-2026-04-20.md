# Exec Plan — DXF Export 리뷰 수정사항 일괄 반영

> 이 문서는 살아있는 문서(living document)입니다.
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 코드 품질 수정 (버그 픽스 + 리팩터링)
- **대상 파일**: `app/api/convert/route.ts`, `lib/export.ts`
- **참조 리뷰**: `docs/reviews/review-n10-print-dxf-export-convertio-2026-04-20.md`
- **시작일**: 2026-04-20
- **완료일**: 2026-04-20

---

## 체크리스트

- [x] **Step 1 — H-1**: `route.ts` `filename` null 안전성 처리 → `safeName` fallback 추가
- [x] **Step 2 — H-2**: `route.ts` Convertio 다운로드 응답 상태 검증 추가 (`fileRes.ok` 체크)
- [x] **Step 3 — M-1**: `export.ts` scale 4 → **3** (scale:2 적용 후 품질 저하 확인, scale:3으로 재조정)
- [x] **Step 4 — M-2**: `route.ts` MIME 타입 → `application/octet-stream`
- [x] **Step 5 — L-1**: `export.ts` 미사용 함수 2개 삭제 (`applyThresholdToCanvas`, `preprocessImagesInIframe`)
- [x] **Step 6 — L-2**: `route.ts` 미사용 `from_format` 파라미터 구조분해 제거
- [x] **Step 7 — L-3**: `route.ts` 주석 번호 오류 수정 (3 → 4)

---

## Surprises & Discoveries

- **scale:2 품질 저하 실측**: scale:2 적용 후 직선이 쭈글쭈글한 점 연결로 보이는 품질 저하 실측 확인. 텍스트도 깨짐. scale:4가 v8에서 명시적으로 선택된 이유가 이 현상을 방지하기 위한 것임을 재확인.
- **scale:3 절충**: 캔버스 크기 4761×3366 px. scale:4(6348×4488) 대비 페이로드 ~44% 감소. Vercel 배포 시 4.5 MB 한도 초과 위험을 낮추면서 품질 타협점으로 채택.

---

## Decision Log

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-20 | M-1 scale:2 → scale:3 재조정 | scale:2 적용 후 선 품질 저하 실측. 배포 환경이 Vercel이므로 scale:4 원복 불가. scale:3이 품질·페이로드 절충점 |

---

## Outcomes & Retrospective

- **원래 목표 달성 여부**: [x] Yes  [ ] Partial  [ ] No
- **결과 요약**:
    1. H-1, H-2 버그 2건 수정으로 서버 크래시 및 빈 파일 반환 위험 제거.
    2. M-1 scale:3 확정으로 Vercel 페이로드 위험 완화.
    3. M-2 MIME 타입 표준화.
    4. L-1~L-3 코드 품질 정리 완료.
- **다음 작업에 반영할 것**:
    - Vercel 배포 시 base64 JSON 전송 방식의 페이로드 한계(4.5 MB)를 고려해야 함. 향후 고해상도 export 기능 추가 시 `multipart/form-data` 전환 검토 필요.

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
