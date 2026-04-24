# Print Node 인수인계 보고서 (Canvas 연동)

**작성일**: 2026-04-24
**작성자**: CRE-TE / CAI Team
**대상**: CAI Canvas 개발팀
**Print 노드 GitHub 레포지토리**: [https://github.com/cai-crete/cai-print-v3](https://github.com/cai-crete/cai-print-v3)

---

## 1. 개요
이 문서는 Print 노드를 CAI Canvas 앱에 통합하기 위해 Print 노드 측에서 진행한 작업 내역과, 앞으로 CAI Canvas 측에서 진행해야 할 연동 작업에 대한 상세한 가이드를 제공합니다.

CAI 에이전트는 본격적인 연동 작업에 앞서 `connect_canvas/` 폴더 내의 모든 문서를 읽고 맥락을 파악해야 합니다. 각 문서의 내용과 작업 진행 순서는 아래 **[5. 관련 문서 가이드]**를 참고하십시오.

---

## 2. Print 노드에서 완료된 작업

Print 노드를 API화하고 Canvas의 확장 가능한 컴포넌트로 이식하기 위해 다음 작업들이 완료되었습니다.

1. **컴포넌트 구조 개편 (Controlled 컴포넌트화)**
   - `Print_ExpandedView`를 외부에서 상태(`selectedImages`, `savedState`, `initialAction`)를 주입하고 결과를 콜백(`onSave`)으로 받는 구조로 전환했습니다.
   - Canvas 측의 툴바와 사이드바 레이아웃에 Print 노드의 기능을 이질감 없이 삽입할 수 있도록 **Slot (Render Props) 패턴**(`renderToolbarWrapper`, `renderSidebarWrapper`)을 도입했습니다.
   - Canvas RightSidebar에 상시 표시될 `PrintSidebarPanel` 컴포넌트를 신규 개발했습니다.

2. **API 통신 및 CORS 설정**
   - Canvas 서버가 프록시 라우트(`/api/print-proxy/*`)를 통해 Print 서버의 API를 호출할 수 있도록 내부 API 호출 시 `apiBaseUrl` prefix를 적용했습니다.
   - `middleware.ts`를 신규 생성하여 Canvas 운영 서버 및 로컬 서버의 Origin을 허용하는 **CORS 설정**을 완료했습니다.
   - `x-canvas-api-secret` 검증 로직을 추가하여 API 보안을 강화했습니다.
   - 이미지 장수 제한(REPORT, PANEL, DRAWING, VIDEO) 데이터를 노출하는 `GET /api/print/limits` 엔드포인트를 추가했습니다.

3. **스타일 분리 및 패키징**
   - 하드코딩된 스타일을 모두 CSS 변수(`--print-color-*` 등)로 교체하고 `print-tokens.css`로 분리했습니다.
   - npm 패키지 `@cai-crete/print-components` 배포를 위한 `lib/index.ts` 구성 및 `.npmrc`, GitHub Actions 워크플로우를 설정했습니다.

---

## 3. CAI Canvas 측에서 진행해야 할 작업

CAI Canvas 팀(에이전트)은 Print 노드 연동을 위해 다음 단계들을 수행해야 합니다.

### 단계 1: 환경 변수 설정
- Vercel Dashboard 또는 로컬 `.env`에 아래 값을 추가합니다.
  - `GITHUB_TOKEN`: GitHub Packages 접근용 (packages:read 권한)
  - `PRINT_API_URL`: Print 노드 배포 URL (`https://cai-print-v3.vercel.app` 또는 로컬 환경)
  - `CANVAS_API_SECRET`: Print 노드와 합의된 보안 시크릿 키

### 단계 2: Print 컴포넌트 패키지 설치
1. `project_canvas/.npmrc` 파일을 생성하고 아래 내용을 추가합니다.
   ```ini
   @cai-crete:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```
2. `@cai-crete/print-components` 패키지를 설치합니다.
   ```bash
   npm install @cai-crete/print-components
   ```
3. `project_canvas/next.config.ts`에 `transpilePackages: ['@cai-crete/print-components']`를 추가합니다.

### 단계 3: 프록시 라우트 설정
- Print 컴포넌트가 내부적으로 사용하는 API 경로를 Canvas 서버에서 프록시 처리해야 합니다.
- `project_canvas/app/api/print-proxy/[...path]/route.ts` 등을 생성하여 `PRINT_API_URL`로 요청을 전달하되, 헤더에 `x-canvas-api-secret: CANVAS_API_SECRET`을 반드시 포함해야 합니다.

### 단계 4: 디자인 테마 연동 및 컴포넌트 렌더링
1. **스타일 로드 및 오버라이드**:
   - `project_canvas/app/layout.tsx`에서 Print의 기본 토큰을 불러옵니다:
     `import '@cai-crete/print-components/styles/print-tokens.css';`
   - 이후 CAI Canvas의 테마에 맞게 Print의 CSS 변수(`--print-color-*` 등)를 덮어씌우는 `print-canvas-overrides.css`를 작성하고 적용합니다. (AGENT C 담당)
2. **컴포넌트 렌더링**:
   - `PrintSidebarPanel`을 Canvas RightSidebar 영역에 렌더링합니다.
   - `Print_ExpandedView`를 NodeCard Expand View 위치에 렌더링합니다. 이때 Slot (Render Props) 패턴(`renderToolbarWrapper`, `renderSidebarWrapper`)을 활용하여 Canvas의 공통 UI 껍데기를 주입하고 내부 요소들을 재배치합니다.

---

## 4. 참고 사항 (트러블 슈팅)

### UI 깨짐 및 런타임 에러 대응 내역
로컬 Standalone 환경 테스트 중 CSS 변수 누락으로 인한 UI 깨짐 및 `[object Event]` 런타임 에러가 발생한 바 있습니다. 이는 `project.10_print/app/layout.tsx`에 `print-tokens.css` import가 누락되어 발생했던 문제로 조치 완료되었습니다. Canvas 측에서도 전역 스타일에 `print-tokens.css` import가 누락되지 않도록 유의하십시오. (상세 내용은 `exec-plan-n10-print-ui-fix-2026-04-24.md` 참조)

---

## 5. 관련 문서 가이드 (CAI 에이전트 필독)

연동 작업을 진행할 CAI 에이전트는 본 문서를 포함하여 `connect_canvas/` 디렉토리에 있는 아래 문서들을 **순서대로 읽고** 맥락을 완벽히 이해해야 합니다.

1. **`work-instruction.md`** (CAI 측에서 작성)
   - **내용**: Print 노드 API화 및 Canvas 연동을 위한 전반적인 아키텍처와 마스터 작업지시서입니다. Print 측 개발 내용과 Canvas 측 연동 가이드라인이 총망라되어 있습니다.
   
2. **`exec-plan-n10-print-canvas-connection-2026-04-24.md`**
   - **내용**: `work-instruction.md`를 기반으로 Print 노드 측에서 진행한 API 엔드포인트 추가, CORS 미들웨어 적용, 컴포넌트 분리 및 패키지 배포 설정 등의 작업 진행 내역입니다.

3. **`exec-plan-n10-print-ui-unification-2026-04-24.md`**
   - **내용**: Print 노드의 UI를 Canvas 환경에 맞게 이식하기 위해 **Slot (Render Props) 패턴**을 도입한 설계 변경 내역을 담고 있습니다. Canvas 팀이 `renderToolbarWrapper` 및 `renderSidebarWrapper`를 어떻게 주입해야 하는지 예시가 포함되어 있습니다.

4. **`exec-plan-n10-print-ui-fix-2026-04-24.md`**
   - **내용**: 작업 중 발생했던 UI 깨짐 및 런타임 오류의 원인과 해결 내역을 기록한 트러블 슈팅 문서입니다. (간략하게만 참고)

---
`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
