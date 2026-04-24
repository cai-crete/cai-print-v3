# Exec Plan — Print 노드 UI 깨짐 및 런타임 에러 수정

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 버그 수정
- **대상 노드**: N10 Print
- **시작일**: 2026-04-24

---

## 목표

Print 노드를 API화 및 Canvas 연동을 위해 컴포넌트화 하는 과정에서 발생한 UI 깨짐 및 `[object Event]` 런타임 에러의 원인을 분석하고, 이를 해결하여 Print 단독 실행(Standalone) 환경에서도 정상적으로 렌더링되도록 수정합니다.

### 원인 분석 결과

1. **UI가 완전히 깨진 현상의 원인**:
   - `exec-plan-n10-print-canvas-connection-2026-04-24.md`에 따라 Print 노드 컴포넌트 내부의 하드코딩된 스타일들이 CSS 변수(예: `var(--print-color-primary)`)로 교체되고 `print-tokens.css`로 분리되었습니다.
   - 하지만 **로컬 구동용 최상위 레이아웃인 `project.10_print/app/layout.tsx`에서 분리된 `print-tokens.css`를 import 하는 코드가 누락**되었습니다.
   - 이로 인해 로컬 개발 서버(`npm run dev`) 구동 시 모든 CSS 변수가 할당되지 않은 빈 값(undefined)이 되어 스타일이 무너지고 텍스트와 DOM 구조만 나열된 상태가 되었습니다.
   
2. **`Runtime Error [object Event]` 발생 원인**:
   - Next.js 15 환경에서 렌더링 도중 이미지 등 외부 리소스나 존재하지 않는 스타일 시트 로드가 실패할 경우 발생하는 에러입니다.
   - 현재 CSS 토큰 변수가 매핑되지 않아 UI가 완전히 무너지면서 렌더링을 시도하는 과정 중 SVG나 Image 컴포넌트 혹은 HMR(Hot Module Replacement) 과정에서 이벤트를 객체로 던지는 오류(Unhandled Event)가 발생한 것으로 파악됩니다.
   - 1차적으로 CSS 토큰 파일을 정상적으로 연결하면 Layout Shift와 렌더링 오류가 해결되어 런타임 에러도 함께 해소될 가능성이 큽니다. 

---

## 상세 계획 및 플로우

### 1. `print-tokens.css` 전역 적용 (UI 깨짐 해결)
- `project.10_print/app/layout.tsx` 파일 최상단에 `print-tokens.css` import 구문을 추가합니다.
  - 추가 구문: `import '../lib/styles/print-tokens.css'`
- 해당 적용을 통해 `var(--print-color-*)` 변수들이 로컬 Standalone 환경에서도 정상 작동하도록 만듭니다.

### 2. 검증 및 테스트
- `npm run dev` 상태의 로컬호스트(`localhost:3777`)에서 Print 노드 UI가 기획된 디자인(design-style-guide.md 기준)대로 렌더링되는지 확인합니다.
- 콘솔 및 화면에 띄워진 `[object Event]` 런타임 에러가 사라졌는지 확인합니다.

---

## Progress

세분화된 체크포인트와 타임스탬프 — 실제 완료된 작업만 기록합니다.

- [x] 2026-04-24 — 단계 1: 계획서 작성 및 원인 파악 완료
- [x] 2026-04-24 — 단계 2: `project.10_print/app/layout.tsx`에 `print-tokens.css` import 구문 추가
- [x] 2026-04-24 — 단계 3: 렌더링 검증 및 `[object Event]` 에러 해소 확인

---

## Surprises & Discoveries

구현 중 발견한 예상치 못한 동작과 인사이트를 기록합니다.

- `print-tokens.css`가 전역으로 로드되지 않았을 때, 필수 CSS 변수가 없어 단순히 스타일만 무너지는 것이 아니라 Next.js 렌더링 파이프라인(SVG 처리 등)에서 이벤트 핸들링 오류(`[object Event]`)를 유발할 수 있음을 확인했습니다.

---

## Decision Log

방향 수정 및 설계 선택의 근거를 기록합니다.

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-24 | CSS 토큰을 `layout.tsx`에 수동 import 하기로 결정 | Canvas 연동용으로 CSS 파일을 분리(NPM 패키지용)하면서, 로컬 Standalone 렌더링용 Root Layout 업데이트가 누락되었음이 확인되었기 때문 |

---

## Outcomes & Retrospective

작업 완료 후 작성합니다.

- **원래 목표 달성 여부**: [x] Yes  [ ] Partial  [ ] No
- **결과 요약**: `project.10_print/app/layout.tsx`에 누락되었던 `print-tokens.css`를 import하여 Print 노드 단독 실행(Standalone) 환경에서 UI가 기획된 디자인대로 정상 렌더링되도록 수정했습니다. 이와 동시에 발생하던 `[object Event]` 런타임 에러도 완전히 해소되었습니다.
- **다음 작업에 반영할 것**: 모듈화나 NPM 패키징을 위해 스타일 시트를 분리할 경우, 반드시 로컬 구동용 최상위 레이아웃(`layout.tsx`)에도 해당 스타일을 적용하여 단독 환경 테스트가 가능하도록 유지해야 합니다.

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
