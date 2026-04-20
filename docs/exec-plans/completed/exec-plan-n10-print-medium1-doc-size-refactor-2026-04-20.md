# Exec Plan — MEDIUM-1: DOC_SIZE 레이어 역전 리팩토링

> 작성일: 2026-04-20
> 참조: docs/reviews/Error_Review_Report-v.6-260420.md — MEDIUM-1
> 목표: lib/export.ts가 app/components/templates/DocumentFrame.tsx를 역방향 import하는 레이어 역전 해소

---

## 작업 요약

`DOC_SIZE`, `docSizeKey`, `MM` 상수를 `DocumentFrame.tsx`에서 `lib/types.ts`로 이동.
모든 사용처(export.ts, DocumentFrame.tsx, PreviewStrip.tsx)가 `lib/types`에서 import하도록 통일.

---

## 체크리스트

- [ ] lib/types.ts — DOC_SIZE, docSizeKey, MM 상수/함수 추가
- [ ] DocumentFrame.tsx — 로컬 정의 제거, lib/types에서 import
- [ ] lib/export.ts — import 경로 변경 (DocumentFrame → lib/types)
- [ ] PreviewStrip.tsx — import 경로 변경 (DocumentFrame → lib/types)
- [ ] TypeScript 빌드 검증 (tsc --noEmit)

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
