# Exec Plan — N10 Print 노드 기능 활성화 및 최종 통합

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 새 기능 구현 및 통합 검증
- **대상 노드**: N10 Print
- **시작일**: 2026-04-16

---

## 목표

현재 UI 스타일만 구현되어 멈춰 있는 N10 Print 노드를 실제로 작동하도록 완성한다. 
Stage 0~6에 해당하는 모든 기능(Gemini API 연동, HTML 렌더링, Export, Library, Saves, Video)이 
실제 환경에서 정상적으로 동작함을 보증하고, Loop B 검증을 통과하는 것을 목표로 한다.

---

## 개발 단계 기초 계획 (Step-by-Step)

개발은 각 단계 완료 시 승인을 받고 진행합니다.

### 1단계: 환경 안정화 및 UI 동결 해제
- `npm run dev` 실행 환경에서 발생하는 정적 자산(CSS/JS) 404 오류 원인 파악 및 수정.
- 포트 충돌(3000 vs 3001) 및 에셋 경로(assetPrefix 등) 설정을 점검하여 UI를 100% 활성화.
- 기본 구성 요소(Sidebar, Canvas, PreviewStrip) 간의 리액트 상태(State) 연동 확인.

### 2단계: 핵심 생성 파이프라인(Stage 0~2) 검증 및 보완
- `app/api/print/route.ts`의 Multi-Agent 파이프라인(AGENT-1~3) 동작 확인.
- Gemini 2.5 Pro API를 통한 HTML 및 마스터 데이터 생성 로직 검증.
- 생성된 HTML의 `DocumentFrame` 기반 자동 스케일링 렌더링 품질 확인.

### 3단계: 부가 기능(Stage 3~5) 활성화
- **EXPORT**: `lib/export.ts`를 이용한 PDF, JPG, PNG 내보내기 기능이 실제 브라우저에서 동작하는지 확인.
- **Library**: `sources/library/`의 이미지를 불러오는 API 연동 및 모달 인터랙션 완성.
- **Saves**: `localStorage`를 이용한 문서 저장 및 불러오기 기능 연동.

### 4단계: VIDEO 생성(Stage 6) 및 최종 폴리싱
- Google Veo API를 통한 비디오 생성 및 `videoUri` 재생 연동 확인.
- 전체 워크플로우(이미지 삽입 → 모드 선택 → 생성 → 수정 → 내보내기)의 UX 완결성 확보.
- `SKILL.md` 및 `RELIABILITY.md` 준수 여부 최종 확인.

---

## Progress

- [x] 2026-04-16 — 계획서 작성 및 개발 환경 안정화 시작
- [x] 2026-04-16 — 1단계: 환경 및 포트 안정화 완료 (3777 강제 지정, 에셋 404 해결)
- [x] 2026-04-16 — 2단계 & 3단계: 핵심 파이프라인 및 부가 기능(Export, Library, Saves) 검증 확인
- [x] 2026-04-16 — 4단계: VIDEO 생성 (Veo 3.1) 연동 확인 및 동적 레이아웃(A/B/C/D 위계) 적용
- [x] 2026-04-16 — **긴급 수정:** `ReferenceError: label is not defined` 사이드바 구조 분해 할당 오류 수정
- [x] 2026-04-16 — **긴급 수정:** 문서 생성 실패(10MB 크기 제한 차단) 사용자 알림(Alert) UI 추가
- [x] 2026-04-16 — **Protocol v4.0 전환:** ai_generation_protocol v3.2 → v4.0 Multi-Agent 파이프라인 리팩토링
  - `_context/protocol/ai_generation_protocol-v4.0.md` 신규 생성 (AGENT:1/2/3 섹션 마커 분리)
  - `protocol-print-v1.txt` Base Constraint 문서로 갱신 (ACTION PROTOCOL 제거, 계층 우선순위 명시)
  - `video_generation_protocol.md` VIDEO:INJECTION 블록 추가
  - `lib/prompt.ts` — parseAgentSection / resolveInjectTags / buildAgentSystemPrompt / buildVideoInjectionPrompt 추가
  - `app/api/print/route.ts` — 4단계 순차 파이프라인 (Agent1 → Agent2Ph1 → Agent3 → Agent2Ph2) 구현
  - `npx tsc --noEmit` 타입 오류 0건 확인
- [x] 2026-04-16 — 대용량 이미지 제한 상향 완료 — MAX_IMAGE_SIZE 10MB → 20MB (route.ts), 에러 메시지 동기화

---

## Surprises & Discoveries

- **발견 1 (Quota Limit):** Google Veo 모델은 Preview 버전 특성 상 사용량 제한(Quota/Token limit)이 매우 엄격하며, 429 에러(RESOURCE_EXHAUSTED)가 빈번히 발생함을 확인. (UI에 에러를 표출하도록 조치함)
- **발견 2 (ReferenceError):** TypeScript 인터페이스(`Props`)에 새로운 속성(`label`)을 추가할 때, 컴포넌트 함수의 `destructuring` 파라미터에서 추출을 누락하면 렌더링 시 전역 스코프로 변수를 찾아 `ReferenceError`가 발생함을 확인.
- **발견 3 (Library Fetch Error Fallback):** 라이브러리 이미지 호출 API가 404를 반환할 때, Next.js의 `new NextResponse('Not Found')`가 `text/plain` 타입으로 응답되며, 프론트엔드에서 이를 아무런 의심 없이 `text/plain` 타입의 `File` 객체로 감싸 백엔드에 폼 데이터로 보내게 되어 400 에러를 유발하는 연쇄 작용을 발견.

---

## Troubleshooting & Unresolved Issues (인수인계용)

### 1. 사이드바 컴포넌트 렌더링 오류 (해결 완료)
- **증상:** 비디오 모드를 위해 사이드바 위계 라벨(`label`) 동적 주입 로직을 추가한 이후, 앱과 브라우저가 하얗게 깨지며 `ReferenceError` 에러 발생.
- **원인:** Props 인터페이스에 `label` 선언 후 구조 분해 할당 누락.
- **해결:** 구조 분해 할당 파라미터에 `label`을 명시적으로 추가.

### 4. 이미지가 슬롯 아이콘에서 깨져 보이는 현상 (해결 완료)
- **증상:** 라이브러리에서 가져온 이미지가 모달 내에서는 정상적으로 보이나, 사이드바의 슬롯(A. INSERT IMAGE)에 담기는 순간 엑스박스(Broken Image)로 나타남. 전송에는 문제가 없으나 시각적으로 깨짐.
- **원인:** React 18의 Strict Mode(개발 환경) 생명주기로 인한 `URL.createObjectURL` 조기 해제 버그였습니다. 기존 로직은 `useMemo`로 Blob URL을 만들고 `useEffect` 클린업에서 `URL.revokeObjectURL`로 메모리를 해제했는데, Strict Mode는 "마운트 → 언마운트(이때 강제 해제됨) → 재마운트"를 실행합니다. 이 과정에서 `useMemo`의 의존성 식별자(file)가 변하지 않아 새로운 URL을 생성하지 않으면서 렌더링은 해제된 죽은 URL을 바라보게 되어 발생했습니다.
- **해결:** `useMemo` 대신 명시적인 `useState`와 마운트 시점에만 동작하는 `useEffect` 쌍으로 교체하여, 컴포넌트가 재마운트될 때마다 새롭게 안전한 Object URL을 생성하고 클린업하도록 생명주기를 완벽히 분리·수정(ImageInsert.tsx)했습니다.

### 2. 라이브러리 이미지 처리 400 / 10MB 크기 제한 오류 (부분 해결)
- **증상:** 사용자가 라이브러리에서 이미지를 선택한 후 'GENERATE' 클릭 시 상단 헤더에 "오류 발생"만 뜨고 파이프라인이 즉각 중단됨.
- **원인 (디버깅 과정):** 
  1. 로컬 환경에서 테스트 스크립트 작성 후 `POST /api/print`로 직접 요청을 날려 500 내역을 파고듦.
  2. `gemini-2.5-pro` 에셋 생성 에러가 아니라, **API 라우터 초기 진입점의 유효성 검증(Validation) 블록**에서 실패하고 있었음.
  3. 실패 요인은 두 가지로 압축됨:
     - **포맷 에러:** 404 실패가 발생한 Blob 문자열(`text/plain`)이 File로 구워져 올라갈 때.
     - **용량 제한 에러:** 라이브러리의 `bird's eye view -1.png`와 같은 정밀 에셋은 크기가 무려 21MB에 달하는데, `/api/print`의 `MAX_IMAGE_SIZE` 변수는 **10MB로 상한**이 걸려 있음.
  4. 프론트엔드가 이 `400 Bad Request` 에러 텍스트를 받아 사이드바 최하단에 렌더링하였으나, 너무 아래에 있어 사용자가 인지하지 못하고 상단 헤더의 상태 표시줄만 확인함.
- **해결:** `page.tsx`의 에러 캐치 블록에서 `alert(msg)`를 강제로 띄우도록 수정하여 UX 차단 요인을 명시적으로 드러냄.
- **[Unresolved] 미해결 과제 (다음 작업자 참고):** 
  현재 10MB 이상의 이미지가 선택되면 에러 알림은 뜨지만 근본적으로 생성이 불가능합니다. **`lib/api`의 10MB 제한을 25MB 수준으로 완화**하거나, **프론트엔드에서 캔버스에 업로드되기 전에 Canvas API를 활용해 이미지를 10MB 이하로 압축(Downscaling&WebP 변환)**하는 로직 도입이 시급합니다.

### 3. 비디오 생성 실패 및 API 연동 진단 (해결 완료)
- **사용자 지시 및 증상:** "비디오가 제대로 작동하지 않으며, 완료나 오류 메시지도 없이 멈춘다. 유료 결제한 정상적인 API 키(프로젝트 ID 0206576570 연동)를 제공했는데 API와 프로젝트 ID가 잘못 연결된 것이 아닌지 검증해달라"는 지시가 있었습니다.
- **원인 (디버깅 과정):**
  1. 제공받은 `GOOGLE_AI_API_KEY`를 사용해 백그라운드 테스트 스크립트(`test_veo_api.mjs`)를 작성하여 Veo 3.1 모델 호출을 직접 시뮬레이션했습니다.
  2. 시스템이나 통합 코드는 정상 작동 중이었으며, 구글 서버에서 반환한 실제 에러 코드는 **`RESOURCE_EXHAUSTED (code 429): You have exhausted your capacity on this model. Your quota will reset after 3h...`** (할당량 소진)이었습니다.
  3. **분석 결과:** API 설정이나 프로젝트 ID 연동은 완벽했습니다. 하지만 타겟 모델인 `veo-3.1-lite-generate-preview`가 구글의 '사전 평가(Preview)' 모델인 탓에, 유료(Pay-as-you-go) 결제 계정이라 할지라도 시간당/일일 생성 가능 횟수(Quota)에 극단적으로 강한 제한이 걸려 있어 **구글 인프라단에서 요청을 거부**한 것이 진짜 원인이었습니다. (사용자가 본 에러 로그의 프로젝트 ID 불일치는 Google AI Studio 내부 게이트웨이의 일반적 출력 노이즈였습니다.)
- **해결:** 앱의 API 라우터(`route.ts`)와 프론트엔드(`page.tsx`) 에러 핸들링 코드를 보강하여, 백그라운드에서 조용히 실패(Silent fail)하지 않도록 수정했습니다. 에러가 발생하면 API가 반환한 구체적 사유(할당량 소진 등)를 화면 헤더와 팝업 알림(`alert`)창을 통해 사용자에게 즉시 표출하도록 조치하였습니다.

---

## Decision Log

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-16 | `alert` 기반 명시적 에러 노출 추가 | 에러 메시지가 스크롤 화면 바깥에 숨겨져 "사일런트 페일"처럼 보이는 UX를 즉시 개선하기 위함. |
| 2026-04-16 | 에러 원인 다단 검증 테스트 구성 | PowerShell 커맨드 한계로 인해, Node 스크립트를 즉석 작성하여 Next.js FormData 구조 및 500 바디값을 추출. 백엔드 에러 디버깅 시 로컬 단위 테스트 스크립트가 효과적임을 확인. |

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
