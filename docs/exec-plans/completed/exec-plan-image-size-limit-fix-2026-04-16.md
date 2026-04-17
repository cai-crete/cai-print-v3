# Exec Plan — 이미지 크기 제한 상향 (10MB → 20MB)

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 버그 수정 (크기 제한 완화)
- **대상 노드**: N10 Print
- **시작일**: 2026-04-16

---

## 배경 (이전 작업자 인계)

`exec-plan-n10-print-functional-activation-2026-04-16.md` §Troubleshooting #2 에서 미해결로 남긴 과제:

> 현재 `app/api/print/route.ts`의 `MAX_IMAGE_SIZE`가 **10MB**로 설정되어 있어,
> `sources/library/` 내 고해상도 에셋(예: `bird's eye view -1.png`, 약 21MB)이
> GENERATE 시 **400 Bad Request**로 차단된다.
>
> 사용자는 에러 팝업만 보고 생성을 진행할 수 없는 상태.

---

## 결정 사항

| 항목 | 선택 | 이유 |
|------|------|------|
| 서버 제한 완화 (10MB → 20MB) | **채택** | 단순·즉시·확실. 라이브러리 대부분 에셋 포함 가능 |
| 프론트엔드 Canvas 압축 | 보류 | 추가 구현 복잡도 대비 현시점 불필요 |

> **20MB** 기준 채택 이유: 라이브러리 에셋 최대 크기가 약 21MB이므로
> 넉넉하게 20MB로 설정. Gemini 2.5 Pro API 이미지 제한(20MB/image)과도 정합.

---

## 수정 범위

| 파일 | 변경 내용 |
|------|----------|
| `project.10_print/app/api/print/route.ts` | `MAX_IMAGE_SIZE = 10 * 1024 * 1024` → `20 * 1024 * 1024` |

에러 메시지 텍스트도 동기화:
- `"이미지 크기는 10MB 이하여야 합니다."` → `"이미지 크기는 20MB 이하여야 합니다."`

---

## 체크리스트

- [ ] `route.ts` MAX_IMAGE_SIZE 상수 변경 (10MB → 20MB)
- [ ] 에러 메시지 텍스트 동기화
- [ ] `npx tsc --noEmit` 타입 오류 0건 확인
- [ ] exec-plan-n10-print-functional-activation 미해결 항목 완료 처리

---

## Progress

- [x] 2026-04-16 — `route.ts` MAX_IMAGE_SIZE 10MB → 20MB 상향
- [x] 2026-04-16 — 에러 메시지 텍스트 동기화 ("10MB 이하" → "20MB 이하")
- [x] 2026-04-16 — `npx tsc --noEmit` 타입 오류 0건 확인
- [x] 2026-04-16 — exec-plan-n10-print-functional-activation 미해결 항목 완료 처리

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
