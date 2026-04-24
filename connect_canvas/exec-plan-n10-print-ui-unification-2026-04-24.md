# Exec Plan — N10 Print 노드 Canvas UI/UX 통일 설계 (Slot 패턴)

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: UI/UX 아키텍처 개선 (Render Props/Slot 패턴 적용)
- **대상 노드**: N10 Print
- **시작일**: 2026-04-24

---

## 목표

CAI Canvas가 제공하는 공통 UI/UX 틀(좌측 Toolbar, 우측 Sidebar)과 Print 노드의 전용 기능(Print 툴, 패널)을 이질감 없이 결합하기 위해, Print 내부 상태 관리를 뜯어고치지 않으면서도 외부(Canvas)에서 UI 껍데기를 씌울 수 있는 **Slot(구멍) 패턴**을 도입합니다.

---

## 현행 구조와 개선 방안 (대안 B: Render Props 패턴)

### 현행 구조의 문제점
현재 `Print_ExpandedView.tsx`는 내부적으로 자체 `Toolbar`와 `Sidebar` 레이아웃 껍데기까지 모두 직접 렌더링하고 있습니다. 이를 그대로 Canvas에 넣으면 Canvas의 툴바/사이드바와 Print의 툴바/사이드바가 중복 노출됩니다.

### 개선 방안: Slot (Render Props) 패턴 적용
기존의 복잡한 Context 분리 작업(대공사) 없이, `Print_ExpandedView`가 렌더링할 때 "어떤 껍데기(틀)를 입을지"를 외부(Canvas)에서 결정할 수 있도록 Props에 함수형 구멍(Slot)을 뚫어줍니다.

1. **`types/print-canvas.ts` 업데이트**:
   - `renderToolbarWrapper`, `renderSidebarWrapper` Props를 추가합니다.
2. **`Print_ExpandedView.tsx` 렌더링 로직 수정**:
   - Canvas가 Wrapper 함수를 넘겨주면, Print는 기능 알맹이(버튼, 패널 뭉치)를 그 함수에 넘겨주어 Canvas의 틀 안에서 렌더링되도록 합니다.
   - Wrapper 함수가 없으면(로컬 Standalone 모드), 기존처럼 Print 자체 레이아웃을 사용합니다.
3. **Canvas 측 통합 아키텍처 (통합 효과)**:
   - **스타일 통일**: Print 알맹이 기능들은 이미 CSS 토큰화가 되어 있으므로 Canvas 테마와 일치합니다.
   - **기능 통합**: Canvas가 자신의 Undo/Redo 대신 Print가 넘겨준 Undo/Redo를 수직 툴바의 알맞은 위치에 배치합니다. Canvas 전용 Zoom Scale은 수직 구조에 맞게 위/아래로 자유롭게 끼워 넣을 수 있습니다.
   - **툴바 재구성 지원**: 뭉뚱그려진 하나의 컴포넌트가 아니라, 각각의 버튼을 객체(Object) 형태로 쪼개서 넘겨주어 Canvas 팀이 버튼 위치 및 구조, 스타일을 규칙에 맞게 재배치할 수 있게 합니다.

---

## Canvas 팀 통합 예시 (가상)

```tsx
<PrintExpandedView
  // 1. 상태 및 콜백
  selectedImages={images}
  onSave={handleSave}
  
  // 2. 툴바 껍데기 주입 (버튼들을 개별 객체로 받아 수직 재구성)
  renderToolbarWrapper={(tools) => (
    <CanvasVerticalToolbar>
      {tools.undo}    {/* Print 전용 기능 */}
      {tools.redo}
      <Divider />
      <CanvasZoomScale /> {/* Canvas 전용 기능 (수직 배치) */}
      <Divider />
      {tools.library}
      {tools.saves}
      {tools.save}
    </CanvasVerticalToolbar>
  )}
  
  // 3. 사이드바 껍데기 주입 (큰 틀과 상단 탭은 Canvas가, 내부 패널만 Print가 제공)
  renderSidebarWrapper={(printPanels) => (
    <CanvasRightSidebar>
      <CanvasNodeTabs /> {/* Canvas 고유 상단 노드 탭 */}
      <CanvasSidebarHeader title="PRINT SETTINGS" /> 
      
      <div className="canvas-panel-content">
        {printPanels} {/* Print가 넘겨준 이미지 삽입, 모드 선택 등 패널 구성요소 */}
      </div>
    </CanvasRightSidebar>
  )}
/>
```

---

## Progress

세분화된 체크포인트와 타임스탬프 — 실제 완료된 작업만 기록합니다.

- [x] 2026-04-24 — 단계 1: `types/print-canvas.ts`에 Render Props(`renderToolbarWrapper`, `renderSidebarWrapper`) 타입 추가
- [x] 2026-04-24 — 단계 2: `Print_ExpandedView.tsx` 내부의 툴바 기능 및 사이드바 기능을 별도 노드로 묶어(Slot) Wrapper를 통해 렌더링하도록 구조 변경
- [x] 2026-04-24 — 단계 3: Standalone 렌더링 호환성 검증 (Wrapper 미제공 시 기존과 동일하게 동작 확인)

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
