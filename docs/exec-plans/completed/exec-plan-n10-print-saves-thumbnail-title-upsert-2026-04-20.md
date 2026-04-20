# 작업지시서 — SAVES 모달 개선 (썸네일·제목·덮어쓰기)

**프로젝트**: n10-print  
**날짜**: 2026-04-20  
**작성자**: Claude (세션 12)

---

## 목표

SAVES 모달의 세 가지 기능 개선:
1. **썸네일 추가** — 저장 시 첫 페이지를 캡처하여 카드에 표시 (letterbox 처리)
2. **문서 제목 자동화** — `masterData.projectName`을 문서 제목으로 사용
3. **덮어쓰기 저장** — 동일 세션에서 같은 문서를 재저장 시 새 항목 생성하지 않고 덮어쓰기

---

## 체크리스트

- [x] `docs/exec-plans/active/` 작업지시서 생성
- [x] `lib/thumbnailUtils.ts` 생성 — html2canvas 기반 썸네일 생성 + 제목 추출 유틸
- [x] `page.tsx` 수정 — currentDocId 상태, handleSave 업데이트
- [x] `claude-progress.txt` 업데이트

---

## 구현 상세

### 1. `lib/thumbnailUtils.ts` (신규)

```
generateThumbnail(html, mode, orientation?) → Promise<string | null>
extractTitle(result, mode) → string
```

- hidden iframe에 첫 페이지 HTML 주입 → 로드 대기
- html2canvas(iframe.contentDocument.documentElement) → 캡처
- 4:3(320×240) 고정 캔버스에 letterbox(회색) 처리
- JPEG 0.65 품질로 base64 반환
- 실패 시 null 반환 (썸네일 없음으로 폴백)

### 2. `page.tsx` 수정

- `currentDocId: string | null` 상태 추가
- `handleSave`: generateThumbnail + extractTitle 호출, currentDocId 기반 upsert
- `handleSavesOpen`: setCurrentDocId(doc.id) 설정
- `handleNewProject`: setCurrentDocId(null) 초기화

---

COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
