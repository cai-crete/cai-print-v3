# Exec Plan — Print 노드 Canvas 연결 세팅

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 새 기능 (Print 노드 Canvas 연동 및 환경 세팅)
- **대상 노드**: N10 Print
- **시작일**: 2026-04-24

---

## 목표

Print 노드를 CAI Canvas 앱의 확장 가능한 컴포넌트이자 API 공급자로 이식하기 위한 구조 개편 및 환경 설정을 완수한다.
Print_ExpandedView를 Controlled 컴포넌트로 전환하여 Canvas에서 상태를 주입할 수 있게 하고, CORS 및 API 프록시 설정을 추가하여 보안과 연동 안정성을 확보한다. 또한, NPM 패키지로 디자인 토큰과 함께 배포하여 Canvas 팀에서 쉽게 적용할 수 있도록 한다.

---

## 상세 계획 및 플로우 (플로우 생성 및 환경 세팅)

본 작업은 `connect_canvas/work-instruction.md`를 기반으로 다음 흐름으로 진행된다:

### 1. Print 컴포넌트 전환 및 입출력(Props) 설정
- **타입 정의**: `types/print-canvas.ts` 신규 생성
  - `SelectedImage`, `PrintSavedState`, `PrintSaveResult` 인터페이스 정의
  - `PrintExpandedViewProps`, `PrintSidebarPanelProps` 인터페이스 정의
- **Print_ExpandedView 전환**
  - **입력 (Props)**: `selectedImages` 자동 로드, `initialAction` 연동, `apiBaseUrl` 프록시 경로 주입
  - **출력 (Callbacks)**: Standalone 모드 지원을 유지하면서, `onSave` 발생 시 `html2canvas`로 썸네일(base64)을 생성하여 `PrintSaveResult` 형태로 콜백 호출
- **PrintSidebarPanel 개발**: Canvas의 우측 사이드바에 상시 노출되어 문서 미리보기 및 `initialAction` 트리거 역할 수행

### 2. 엔드포인트 추가 및 API 계약
- **신규 API (`GET /api/print/limits`)**: Canvas에서 사전 검사를 수행할 수 있도록 이미지 장수 제한(REPORT, PANEL, DRAWING, VIDEO) 데이터를 노출하는 엔드포인트 추가
- **API 에러 표준화**: 모든 API 에러 응답의 최상위 키를 `"error"`로 통일
- **내부 API 문서화**: Print_ExpandedView 및 하위 컴포넌트가 사용하는 프록시 대상 API 전체 목록을 정리하여 Canvas 팀에 제공

### 3. 인증 및 보안 설정 (CORS 및 미들웨어)
- **시크릿 검증 추가**: `project.10_print/.env.local`에 `CANVAS_API_SECRET` 추가
  - `/api/print` 및 모든 관련 서버 API 라우트 상단에 `x-canvas-api-secret` 검증 로직 적용
- **CORS 및 미들웨어 설정**: `project.10_print/middleware.ts` 신규 생성
  - 허용 Origin: 운영(`https://cai-canvas-v2.vercel.app`), 로컬(`http://localhost:3900`)
  - OPTIONS Preflight 시 CORS 헤더 설정 및 허용되지 않은 Origin 차단 로직 포함

### 4. 스타일 토큰 분리 및 패키징 (GitHub Packages 배포)
- **스타일 분리**:
  - 두 컴포넌트의 루트 엘리먼트에 `className` prop 추가
  - 하드코딩된 색상 및 폰트를 CSS 변수(`--print-color-*`, `--print-font-*`)로 교체
  - 외부 오버라이드가 가능하도록 `print-tokens.css` 분리
- **NPM 패키징 세팅**:
  - `project.10_print/lib/index.ts` 파일 생성하여 주요 컴포넌트와 인터페이스 배럴 export 적용
  - `package.json`에 npm 패키지 이름(`@cai-crete/print-components`) 및 `publishConfig` 명시
  - 로컬 테스트용 `.npmrc` 구성 및 첫 릴리즈 (v0.1.0)를 위한 GitHub Actions 워크플로우 구성 (설정 완료 후 배포 알림)

### 5. Canvas 팀 인수인계 및 최종 연동 방법 (Handover)
작업이 모두 완료된 후, CAI CANVAS(Canvas 팀)에는 파일 단위의 복사가 아닌 **패키지 배포 및 환경 설정 가이드** 형태로 전달됩니다.

**[Print 팀 → Canvas 팀 제공 목록]**
1. `@cai-crete/print-components` 첫 릴리즈(v0.1.0) 배포 완료 알림
2. 보안 시크릿 키: `CANVAS_API_SECRET` (보안 채널로 전달)
3. Print 노드 API 배포 URL (Production / Local)
4. 내부 API 호출 경로 명세 (Canvas 프록시 라우트용 `/api/print-proxy/*` 구축을 위함)
5. UI 컴포넌트 인벤토리 (AGENT C가 오버라이드할 CSS 변수 목록)

**[Canvas 팀 연동 진행 흐름]**
1. **패키지 설치**: `.npmrc`에 GitHub Packages Registry를 등록하고 `npm install @cai-crete/print-components`를 수행.
2. **트랜스파일 설정**: Canvas의 `next.config.ts` 파일에 `transpilePackages: ['@cai-crete/print-components']`를 추가.
3. **전역 스타일 적용**: Canvas의 `app/layout.tsx`에 `import '@cai-crete/print-components/styles/print-tokens.css'`를 추가하여 기본 변수 로드 후, Canvas 자체 테마(`print-canvas-overrides.css`)로 덮어쓰기.
4. **컴포넌트 렌더링**: Canvas 프로젝트 내에서 `PrintSidebarPanel`과 `Print_ExpandedView`를 import하여 각각 RightSidebar와 NodeCard Expand View 위치에 렌더링하고, Props(`selectedImages`, `onSave` 등)를 주입.
5. **환경변수 추가**: Vercel에 `GITHUB_TOKEN`, `PRINT_API_URL`, `PRINT_API_SECRET` 등록.

---

## Progress

세분화된 체크포인트와 타임스탬프 — 실제 완료된 작업만 기록합니다.

- [x] 2026-04-24 — 단계 1: `types/print-canvas.ts` 생성 및 Props 인터페이스 정의
- [x] 2026-04-24 — 단계 1: `Print_ExpandedView` 컴포넌트 Controlled 구조로 전환 (selectedImages, apiBaseUrl, onSave 연동)
- [x] 2026-04-24 — 단계 1: `PrintSidebarPanel` 컴포넌트 생성 및 액션 트리거 연결
- [x] 2026-04-24 — 단계 2: `GET /api/print/limits` 엔드포인트 추가 및 API 에러 규격 통일
- [x] 2026-04-24 — 단계 3: `project.10_print/middleware.ts` 생성하여 CORS 설정 및 `x-canvas-api-secret` 보안 검증 적용
- [x] 2026-04-24 — 단계 4: 컴포넌트에 CSS 변수 전면 적용 및 `print-tokens.css` 스타일 분리
- [x] 2026-04-24 — 단계 4: `lib/index.ts` 구성 및 `package.json` GitHub Packages 배포 설정

---

## Surprises & Discoveries

구현 중 발견한 예상치 못한 동작과 인사이트를 기록합니다.

- (작업 중 발견 시 작성 예정)

---

## Decision Log

방향 수정 및 설계 선택의 근거를 기록합니다.

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-24 | 실행 계획서 저장 위치를 `connect_canvas/`로 지정 | 사용자의 명시적인 예외 규칙(Canvas 연결 관련 문서는 무조건 `connect_canvas/` 하위에 작성)을 준수 |

---

## Outcomes & Retrospective

작업 완료 후 작성합니다.

- **원래 목표 달성 여부**: [ ] Yes  [ ] Partial  [ ] No
- **결과 요약**: (완료 후 작성 예정)
- **다음 작업에 반영할 것**: (완료 후 작성 예정)

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
