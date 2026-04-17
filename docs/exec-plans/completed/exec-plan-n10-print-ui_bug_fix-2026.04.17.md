# Exec Plan — N10 Print UI/UX 및 로직 버그 수정

사이드바 스크롤 복구, 라이브러리/세이브 로직 상세화, 문서 모드별 설정 최적화 및 비디오 모드 UI 개선을 위한 계획입니다.

## 개요
- **작업 유형**: UI/UX 개선 및 버그 수정
- **대상 노드**: N10 Print
- **시작일**: 2026-04-17
- **파일 경로**: `docs/exec-plans/completed/exec-plan-n10-print-ui_bug_fix-2026.04.17.md`

---

## 1. 사이드바 레이아웃 및 스크롤 복구

### [MODIFY] [Sidebar.tsx](file:///c:/Users/USER01/Downloads/cai-harness-print/project.10_print/app/components/layout/Sidebar.tsx)
- **변경 사항**: `aside` 태그의 `style`에서 `overflow: 'visible'` 필드를 제거하거나 `hidden`으로 변경합니다.
- **이유**: `overflow: visible`은 내부 스크롤 영역(`overflow-y-auto`)의 높이 컨테이너 계산을 방해하여 스크롤이 작동하지 않게 만듭니다. 이를 수정하여 하단 요소가 잘리지 않도록 합니다.

---

## 2. 저장된 문서(SAVES) 및 라이브러리(LIBRARY) 모달 로직 수정

### [MODIFY] [SavesModal.tsx](file:///c:/Users/USER01/Downloads/cai-harness-print/project.10_print/app/components/modals/SavesModal.tsx)
- **변경 사항**: 상단 헤더 영역의 `AddButton` (L88-96) 컴포넌트 및 호출부를 삭제합니다.

### [MODIFY] [page.tsx](file:///c:/Users/USER01/Downloads/cai-harness-print/project.10_print/app/page.tsx)
- **신규 함수**: `handleLibraryAddFolder` 구현 (이름 입력 → `libraryFolders` 상태 업데이트).
- **상태 업데이트**: `handleModeChange`에서 `PANEL` 선택 시 `pageCount`를 1로 설정, `REPORT` 선택 시 6으로 설정하는 로직 추가.

---

## 3. LIBRARY 내 이미지 추가 로직 고도화

### [MODIFY] [LibraryModal.tsx](file:///c:/Users/USER01/Downloads/cai-harness-print/project.10_print/app/components/modals/LibraryModal.tsx)
- **이미지 추가 소스 선택**: 폴더 내부에서 `+` 버튼 클릭 시 '디바이스' 또는 '라이브러리'를 선택할 수 있는 팝오버 메뉴를 추가합니다.
- **라이브러리 통합 뷰**: 모든 폴더의 이미지를 평면(flat) 리스트로 보여주는 전용 상태(`isInternalSelecting`)를 추가합니다.
- **다중 선택 및 ADD**: 통합 뷰에서 이미지 선택 후 상단 'ADD' 버튼을 누르면 현재 활성화된 폴더로 선택된 이미지들이 복사되도록 구현합니다.

---

## 4. VIDEO 모드 이미지 전환 버튼 UI 개선

### [MODIFY] [ImageInsert.tsx](file:///c:/Users/USER01/Downloads/cai-harness-print/project.10_print/app/components/sidebar/ImageInsert.tsx)
- **스타일 변경**: `handleSwap` 버튼 배경을 `white`로, 보더를 `gray-200` 또는 `black`으로 변경하여 Secondary 스타일을 적용합니다.
- **아이콘 변경**: 수평으로 교차하는 두 화살표 형태의 SVG로 교체합니다.

---

## 체크리스트

### 1단계: 사이드바 스크롤 및 기본 설정 수정
- [x] `Sidebar.tsx` overflow 수정 및 스크롤 작동 확인
- [x] `page.tsx` 모드별 기본 장수 설정 (PANEL 1장, REPORT 6장)
- [x] `SavesModal.tsx` 추가 버튼 제거

### 2단계: 라이브러리 폴더 및 이미지 복사 기능
- [x] `page.tsx` 폴더 추가 로직 구현 및 연동
- [x] `LibraryModal.tsx` 이미지 추가 소스 선택 메뉴 추가
- [x] 라이브러리 통합 뷰(평면 리스트) 구현
- [x] 이미지 복사(ADD) 기능 개발

### 3단계: VIDEO UI 및 검증
- [x] `ImageInsert.tsx` 전환 버튼 아이콘 및 스타일 수정
- [x] npx tsc --noEmit 검증
- [x] 브라우저 실 동작 테스트 및 최종 승인

### 4단계: 추가 버그 수정 및 안정화
- [x] Library 모달: 드롭다운 메뉴 클릭 미작동 문제 해결 (이벤트 전파 및 Outside Click 로직 수정)
- [x] 저장 로직: 문서 저장 시 성공 피드백 제공 및 저장 상태 동기화 확인

---

## Progress

- [x] 2026-04-17 — 계획서 작성 완료
- [x] 2026-04-17 — 1단계 완료
- [x] 2026-04-17 — 2단계 완료
- [x] 2026-04-17 — 3단계 완료
- [x] 2026-04-17 — 4단계 완료 (최종 종료)

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
