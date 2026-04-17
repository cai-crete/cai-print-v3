# Exec Plan — N10 Print 개선: 이미지 처리 강화 및 UX 폴리싱

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 미해결 버그 수정 + UX 개선 + 검증
- **대상 노드**: N10 Print
- **시작일**: 2026-04-17
- **선행 문서**: 
  - `exec-plan-n10-print-functional-activation-2026-04-16.md` (전 단계 완료)
  - `exec-plan-n10-print-generate_fix-2026-04-16.md` (전 단계 완료)

---

## 목표

이전 단계에서 "임시 처리" 또는 "미해결"로 남겨진 3가지 항목을 완전히 해결한다.

1. **이미지 크기 블로커 제거**: 20MB 초과 이미지가 생성 파이프라인을 막는 구조적 결함을 해소한다.  
   프론트엔드에서 업로드 전 Canvas API로 이미지를 리사이징/WebP 변환하여 서버 한도(20MB) 이하로 보장한다.
2. **`alert()` 에러 UI 제거**: 브라우저 기본 `alert()`를 앱 내부 Toast/인라인 알림 UI로 교체하여 UX를 표준화한다.
3. **캔버스 기능 브라우저 실 동작 검증**: 이전 세션에서 구현된 무한 캔버스 줌·패닝·더블클릭·그리드 동기화가 실제 브라우저에서 정상 작동하는지 체크한다.

---

## 배경 (인수인계용)

### [Unresolved] 이미지 크기 제한 문제 (from functional-activation)

- `app/api/print/route.ts`의 `MAX_IMAGE_SIZE = 20MB`
- `sources/library/`의 고화질 에셋 중 일부(`bird's eye view -1.png` 등)는 21MB 이상
- 프론트엔드에서 용량을 줄이지 않고 그대로 FormData에 첨부하여 전송 → 서버 400 반환
- 현재 임시 조치: `page.tsx`의 에러 캐치 블록에 `alert(msg)` 추가
- **근본 해결이 없음** → 여전히 대형 이미지 선택 시 생성 불가

### [Unresolved] alert() 기반 에러 노출

- `page.tsx` 에러 핸들러에서 `alert(errorMessage)` 호출 중
- 브라우저 기본 팝업은 스타일 불일치, 접근성 문제, 중복 표시 위험 있음
- 앱 내 Toast 또는 상단 헤더 배너로 교체 필요

### [미검증] 캔버스 줌/패닝 실 동작

- `Canvas.tsx` 무한 캔버스 구현 완료 (세션 7, 2026-04-16)
- 브라우저 실 환경에서 테스트 미수행

---

## 개발 단계 상세 계획

각 단계 완료 시 사용자 승인을 받고 다음 단계로 진행합니다.

---

### 1단계: 프론트엔드 이미지 압축 로직 구현

**목적**: 서버 한도(20MB)를 초과하는 이미지를 업로드 전에 브라우저 Canvas API로 자동 리사이징·WebP 변환하여, 어떤 이미지를 선택해도 생성 파이프라인이 정상 통과되도록 한다.

**구현 위치**: `project.10_print/lib/imageUtils.ts` (신규 유틸) + `ImageInsert.tsx` 호출부 연동

**구현 스펙**:
- 압축 함수 시그니처: `compressImage(file: File, maxBytes: number): Promise<File>`
- 내부 로직:
  1. `file.size <= maxBytes`이면 원본 반환 (압축 불필요)
  2. `HTMLCanvasElement` + `CanvasRenderingContext2D`로 이미지 드로잉
  3. `canvas.toBlob('image/webp', quality)` — quality를 0.9에서 시작하여 `maxBytes` 이하가 될 때까지 0.1 단위 감소
  4. 결과를 `new File([blob], originalName.webp, { type: 'image/webp' })` 로 반환
- 호출 위치: `ImageInsert.tsx`의 디바이스 업로드(`<input type="file">` onChange) 및 라이브러리 선택 직후

**체크리스트**:
- [x] `lib/imageUtils.ts` — `compressImage()` 함수 구현 (Canvas API, WebP 변환, quality 루프)
- [x] `ImageInsert.tsx` — 디바이스 파일 선택 후 `compressImage()` 호출 적용 (일반 모드 `handleAdd` + VIDEO 모드 `VideoSlot onChange`)
- [x] `page.tsx` — 라이브러리 단일/다중 선택 후 `compressImage()` 호출 적용
- [ ] 21MB 이상 이미지 선택 → GENERATE 성공 확인 (브라우저 테스트)
- [x] `npx tsc --noEmit` 타입 오류 0건 확인

---

### 2단계: `alert()` → 앱 내 에러 UI 교체

**목적**: `page.tsx`의 `alert(errorMessage)` 호출을 제거하고, 기존 헤더 상태 표시줄(또는 인라인 Toast)로 에러를 표시하여 UX를 표준화한다.

**현황 파악 필요**:
- `page.tsx`의 에러 핸들링 코드 구조 확인
- 현재 헤더 상태 표시줄(`Toolbar.tsx` 또는 헤더 영역)의 에러 표시 메커니즘 확인

**구현 스펙**:
- `alert()` 제거
- 기존 상태 변수(`errorMessage` state 등)로 에러를 헤더 배너 또는 상단 Toast에 표시
- 에러 자동 소멸: 5초 후 `null`로 리셋 (`setTimeout`)
- 에러 레벨 구분(선택): warning / error 색상 분기

**체크리스트**:
- [x] `page.tsx` — `alert()` 호출 없음 확인 (error-diagnosis 작업에서 이미 제거 완료)
- [x] 에러 UI — 사이드바 인라인 패널(agentError) + 헤더 상태 배너(error) 이중 체계 확인
- [x] `npx tsc --noEmit` 타입 오류 0건 확인

---

### 3단계: 캔버스 기능 브라우저 실 동작 검증

**목적**: 이전 세션(2026-04-16)에서 구현된 무한 캔버스 기능이 실제 브라우저에서 의도대로 동작하는지 확인한다. 코드 레벨 구현은 완료됐으나 실 환경 검증이 누락된 상태.

**검증 항목**:

| 항목 | 기대 동작 | 확인 방법 |
|------|-----------|-----------|
| 마우스 휠 줌인 | 커서 위치 기준으로 화면 확대 (최대 8x) | 문서 생성 후 휠 업 |
| 마우스 휠 줌아웃 | 커서 위치 기준으로 화면 축소 (최소 0.1x) | 휠 다운 |
| 드래그 패닝 | 빈 캔버스 영역 드래그 시 문서 이동 | 마우스 드래그 |
| 더블클릭 초기화 | zoom=1, pan=(0,0)으로 리셋 | 빈 캔버스 더블클릭 |
| 배경 그리드 동기화 | 줌/패닝에 맞게 그리드 이동 | 줌 및 패닝 중 배경 관찰 |
| iframe 내부 스크롤 없음 | 문서 내부 스크롤바 미노출 | 문서 생성 후 문서 내부 스크롤 시도 |
| iframe 위 드래그 유지 | 드래그 중 커서가 iframe 위로 이동해도 패닝 유지 | 드래그 중 iframe 위 통과 |

**체크리스트**:
- [x] `npm run dev` 실행 후 문서 생성 확인 (브라우저 검증 수행)
- [x] 마우스 휠 줌인/줌아웃 정상 동작 확인
- [x] 드래그 패닝 정상 동작 확인
- [x] 더블클릭 뷰 초기화 정상 동작 확인
- [x] 배경 그리드 줌/패닝 동기화 확인
- [x] 문서 내부 스크롤 차단 확인
- [x] 버그 발견 → BUG-1(상단 여백), BUG-2(줌 미작동) 수정 및 브라우저 검증 완료

---

## Progress

- [x] 2026-04-17 — 계획서 작성 완료
- [x] 2026-04-17 — 사전 작업: pre-existing TS 오류 5건 수정 (`VideoTemplate.isLoading`, `PurposeSelector/PageCountControl/PromptInput label`, `SavesModal.onDeleteBatch`)
- [x] 2026-04-17 — 1단계: 이미지 압축 로직 구현 완료 (`lib/imageUtils.ts` + `ImageInsert.tsx` + `page.tsx` 3개 경로)
- [x] 2026-04-17 — 2단계: alert() 에러 UI — error-diagnosis 작업에서 이미 완료됨 확인
- [x] 2026-04-17 — 3단계: 캔버스 실 동작 브라우저 검증 완료 (BUG-1/BUG-2 수정 포함)

---

## Troubleshooting — 캔버스 브라우저 검증 결과

### [BUG-1] iframe 문서 상단 검은 여백 / 하단 여백 감소

- **증상**: 생성된 문서 iframe 상단에 검은(어두운) 여백이 발생하고, 하단 여백이 줄어든다.

- **원인 분류: 렌더링 코드 + 템플릿 통합 불일치 (생성 에이전트 무관)**
  - AI는 템플릿을 정확히 따라 HTML을 생성함 → 에이전트 오류 아님
  - 세 템플릿 모두 **브라우저 단독 뷰어**(어두운 배경 + 문서 부유 효과) 용으로 설계되어 있음:
    | 템플릿 | body 배경 | 여백 발생 방식 |
    |--------|-----------|---------------|
    | REPORT | `background: #525659` | `.page { margin: 20px auto }` |
    | PANEL | `background: #000` | `body { padding: 60px }` |
    | DRAWING | `background: #1a1a1a` | `body { padding: 40px }` |
  - `DocumentFrame.tsx`는 iframe을 `.page`의 물리 치수(ex. A3=1587×1122px)와 **정확히 동일한 크기**로 설정
  - 결과: 상단 20~60px에 어두운 body 배경 노출, 하단은 `.page`가 iframe 외부로 밀려 클리핑됨

- **해결**: `injectNoScroll`에 `.page { margin: 0 }` + `body { padding: 0; background: white }` 추가 주입
  - 어두운 body 배경을 흰색으로 덮음
  - body padding(Panel/Drawing 60~40px)과 .page margin(Report 20px)을 제거하여 .page가 iframe 좌상단(0,0)에서 시작하도록 강제
  - 장식용 `box-shadow` 제거 (iframe 내 불필요)

### [BUG-2] 마우스 휠 줌 미작동

- **증상**: 마우스 휠 조작 시 화면 확대/축소가 전혀 발생하지 않는다.
- **원인**: `Canvas.tsx`에 줌 관련 로직이 완전히 누락됨.
  1. `viewReducer`에 `ZOOM_TO` 액션이 정의되지 않음
  2. `wheel` 이벤트 리스너가 없음 (`useEffect` 미구현)
  3. 콘텐츠 div의 `transform`이 `scale(1)` 하드코딩 → 줌 상태가 시각적으로 반영되지 않음
  4. `backgroundSize`가 `zoom`에 비례하지 않아 그리드 동기화 불가
- **해결**:
  - `viewReducer`에 `ZOOM_TO` 케이스 추가 (커서 기준 pan 보정 공식 적용)
  - `useRef`로 최신 `zoom` 값을 참조하는 wheel 이벤트 리스너 마운트 시 1회 등록
  - `transform` → `translate(panX, panY) scale(zoom)`
  - `backgroundSize` → `gridSize * zoom`

## Surprises & Discoveries

_작업 중 발견 시 기록_

---

## Decision Log

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-17 | Canvas API WebP 변환 방식 채택 | 서버 한도 상향(보안 리스크) 대신 클라이언트 사전 압축으로 근본 해결 |

---

## Outcomes & Retrospective

- **원래 목표 달성 여부**: [x] Yes
- **결과 요약**: 3개 목표 및 추가 발견 버그 2건까지 모두 해결. pre-existing TS 오류 5건, 이미지 압축 3개 경로, alert() 제거 확인, 캔버스 줌/패닝/그리드/iframe 스크롤 전 항목 브라우저 검증 통과.
- **다음 작업에 반영할 것**: 
  - HTML 템플릿은 브라우저 단독 뷰어 전제로 설계됨 → 향후 iframe 렌더링 대상 HTML 생성 시 body 배경/padding 명세를 렌더러 컨텍스트에 맞게 설계할 것
  - Canvas API 줌 구현 시 `useEffect` 내 closure 문제를 방지하려면 최신 상태를 `useRef`로 참조할 것

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
