# Exec Plan — Design Style Guide Revision (Apple × Figma × TW Elements)

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 디자인 문서 개선 (리팩토링)
- **대상 노드**: N10 (project.10_print)
- **시작일**: 2026-04-16
- **담당 에이전트**: AGENT C (디자인 에이전트)

---

## 목표

기존 `project.10_print/_context/design-style-guide.md`를 Apple Design Tips(명확성·디테일), Figma UI Design Principles(정렬·대비·근접성·반복), TW Elements Spacing(8px 그리드 기반 Spacing Scale) 3대 원칙을 적용하여 개선한다.

### v1 목표 (2026-04-16 완료)
1. 모호한 수치 표현을 8px 그리드 기반의 논리적 Spacing Scale로 수치화한다.
2. 중복된 섹션(A.6 ↔ §9)을 정리하고 시각적 계층 구조 원칙을 명문화한다.
3. Hover / Focus / Active 등 인터랙션 피드백 규칙과 최소 터치 영역 기준을 신설한다.

### v2 목표 (2026-04-16 추가 요청)
1. **§9 보호**: 사용자가 §9 섹션을 복원함. §9의 존재 목적과 §9.3 Z-Index 표 파손 내용을 수정한다.
2. **터치 영역 규칙 명확화**: 기존 "padding 보정" 방식의 모호한 규칙을 제거하고, **최솟값 44px를 물리적 높이·너비 자체에 반드시 적용**하는 강제 규칙으로 명확히 한다.
3. **높이 체계 조정**: CTA-options를 44px로 상향 시, CTA-primary·secondary는 52px로 상향한다. 모든 rem 값 재환산.
4. **Alignment 원칙 신설**: 같은 행(Row) 요소는 동일 높이, 같은 열(Column) 요소는 동일 너비 규칙을 A.0에 추가한다.
5. **실제 UI 코드 반영**: 문서 변경 후 구현 파일에 수치를 반영한다.

---

## 해결해야 할 문제

### v1 문제 (완료)

| # | 문제 | 내용 |
|---|------|------|
| 1 | **모호한 수치** | PANEL 패딩 `20~25mm` 등 범위 표현으로 일관성 없는 구현 가능성 |
| 2 | **Spacing Scale 미정의** | 8px 그리드 기반의 논리적 스케일 없이 rem 값만 나열됨 |
| 3 | **섹션 중복** | A.6 레이아웃 섹션과 §9 레이아웃 섹션이 동일 내용으로 중복 존재 |
| 4 | **인터랙션 규칙 부재** | Hover, Focus, Active 상태 스타일 및 전환 규칙 미정의 |
| 5 | **터치/클릭 영역 기준 없음** | 최소 터치 영역(44px) 규칙 미정의 |
| 6 | **시각적 계층 원칙 미명문화** | 어떤 요소가 우선 눈에 띄어야 하는지 원칙 부재 |

### v2 문제 (신규)

| # | 문제 | 내용 |
|---|------|------|
| 7 | **터치 영역 규칙 모호성** | "padding 보정"으로 히트 영역만 44px 확보하는 방식은 실제 높이가 36px로 남아 시각적 불일치 유발 |
| 8 | **높이 체계 불균형** | CTA-options 44px 상향 시 CTA-primary·secondary와 구분이 사라짐. 계층 차이를 유지하기 위해 primary·secondary를 52px로 상향 필요 |
| 9 | **Alignment 원칙 미정의** | 같은 행/열 요소 간 크기 통일 규칙 부재로 구현 시 자의적 치수 적용 가능성 |
| 10 | **§9.3 Z-Index 표 파손** | 사용자 편집 중 §9.3의 Z-Index 표가 v1 개선 요약 내용과 혼합되어 데이터 손상 |

---

## 해결 방안

### v1 방안 (완료)

| # | 방안 | 근거 |
|---|------|------|
| 1 | PANEL 패딩을 `20mm` 단일 값으로 확정 | 8px 그리드 원칙 (범위 제거) |
| 2 | Spacing Scale 표 신설 (space-1 ~ space-16) | TW Elements 8px 그리드 |
| 3 | §9 섹션 A.6 정본 안내로 처리 (삭제하지 않음) | 문서 무결성 원칙 |
| 4 | A.8 신설 — 인터랙션 상태 규칙 (Hover/Focus/Active/Transition) | Apple 친숙한 상호작용 원칙 |
| 5 | 최소 터치 영역 44px 규칙을 A.4에 명시 | Apple HIG 기준 |
| 6 | A.0 신설 — 시각적 계층 구조 원칙 (Visual Hierarchy Principles) | Figma 대비·정렬 원칙 |

### v2 방안 (신규)

| # | 방안 | 근거 |
|---|------|------|
| 7 | §9 존재 목적 명시 및 §9.3 Z-Index 표 원상복구 | 사용자 명시적 지시: §9 삭제 불가 |
| 8 | A.4 규칙을 "최솟값 44px = 물리적 높이 자체" 강제로 재정의. padding 보정 방식 폐기 | Apple HIG 명확한 적용, 모호성 제거 |
| 9 | CTA-options 높이: `2.25rem(36px)` → `2.75rem(44px)`. CTA-primary·secondary 높이: `2.75rem(44px)` → `3.25rem(52px)` | 계층 간 높이 차이 8px 유지 원칙 |
| 10 | A.0.3 신설 — Alignment 원칙: 같은 행 동일 높이 / 같은 열 동일 너비 | Figma Alignment 원칙 명시적 적용 |
| 11 | 실제 UI 구현 파일에서 높이 관련 CSS 토큰·클래스 수정 | 문서-구현 정합성 유지 |

---

## 위험성 평가

| 위험 | 심각도 | 완화 방안 |
|------|--------|-----------|
| 기존 구현 코드와의 수치 불일치 (v1) | 중 | 변경되는 수치는 기존 수치와의 대조 표를 Decision Log에 기록 |
| §9 삭제 시 참조 링크 오류 가능성 (v1) | 낮 | §9를 삭제하지 않고 A.6으로의 redirection 안내로 대체 |
| 모호함 제거 시 PANEL 기존 구현 영향 (v1) | 낮 | PANEL 패딩은 이미 20mm로 구현되어 있어 영향 없음 |
| **CTA 높이 변경 시 UI 레이아웃 흘러내림** | **높음** | primary/secondary/options 높이 CSS 변수를 동시에 업데이트. 전후 비주얼 확인 필수 |
| ~~CTA-secondary-small 높이 처리~~ | ~~중~~ | ✅ **해소됨** — secondary-small은 모달 내부 등 좁은 영역 전용이므로 **36px 예외 유지** 확정 (사용자 명시) |

---

## Progress

**v1 (완료)**
- [x] 2026-04-16 — 기존 `design-style-guide.md` 전체 분석 완료
- [x] 2026-04-16 — Exec Plan 초안 작성 완료
- [x] 2026-04-16 — 개선된 `design-style-guide.md` v1 작성 및 파일 반영 완료
- [x] 2026-04-16 — Exec Plan `completed/`로 이동

**v2 (진행 중)**
- [x] 2026-04-16 — v2 수정 요청 접수 및 Exec Plan `active/`로 복원
- [x] 2026-04-16 — Exec Plan v2 수정 사항 업데이트 완료
- [x] — 사용자 승인 대기
- [x] — `design-style-guide.md` v2 수정 반영 (문서)
- [x] — 실제 UI 구현 파일 높이 토큰 업데이트

---

## Surprises & Discoveries

- A.6(레이아웃)과 §9(앱 인터페이스 레이아웃)가 동일한 내용을 다른 섹션 번호로 중복 관리 중. 이는 초기 작성 당시 PART A 체계와 구 번호체계가 혼재된 결과로 보임.
- CTA-options의 `selected` 상태 배경(`gray-200`)이 컬러 토큰 용도 정의(`gray-200` = 인터랙션 보더 전용)와 충돌. Decision Log에 기록.

---

## Decision Log

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-16 | PANEL 내부 패딩 `20~25mm` → `20mm` 단일 값으로 확정 | 8px 그리드 원칙상 범위 표현 허용하지 않음 |
| 2026-04-16 | §9 섹션을 삭제하지 않고 "A.6 참조" 리디렉션으로 대체 | 기존 참조 링크 보호 및 문서 무결성 유지 |
| 2026-04-16 | CTA-options `selected` 배경을 `gray-200` 유지, 단 주석으로 "선택 상태 전용 예외" 명시 | 실제 구현 코드와 일치, 혼동 방지를 위한 명시적 예외 처리 |
| 2026-04-16 | A.0 시각적 계층 원칙 섹션 신설 | Figma 대비·정렬 원칙 명문화 필요 |
| 2026-04-16 | A.8 인터랙션 규칙 섹션 신설 | Apple HIG 친숙한 상호작용 + 피드백 원칙 |
| 2026-04-16 (v2) | **§9 삭제 금지** 확정 — A.6에서 "A.6이 정본" 안내 유지, §9.3 Z-Index 표 원상복구 | 사용자 명시적 지시 |  
| 2026-04-16 (v2) | **터치 영역 44px = 물리적 높이 자체** 강제 적용. padding 보정 방식 폐기 | "padding만 44px" 방식은 모호성 유발 및 시각적 불일치 |  
| 2026-04-16 (v2) | CTA-options: **36px → 44px** / CTA-primary·secondary: **44px → 52px** | 44px 최솟값 보장 + 계층 간 8px 차이 유지 |  
| 2026-04-16 (v2) | CTA-secondary-small은 **36px 예외 유지** — 모달 내부 등 좁은 영역 전용 컴포넌트로, 최솟값 44px 규칙의 유일한 공인 예외 | 사용자 명시적 지시. 예외 사유를 문서에 명기하여 오해 방지 |
| 2026-04-16 (v2) | A.0.3 신설 — **Alignment 원칙**: 같은 행 동일 높이 / 같은 열 동일 너비 | Figma Alignment 원칙 명시적 구체화 |

---

## Outcomes & Retrospective

**v1**
- **원래 목표 달성 여부**: [x] Yes
- **결과 요약**: 3대 원칙(Apple, Figma, TW Elements)을 모두 반영하여 모호한 표현 제거, Spacing Scale 수치화, 인터랙션 규칙 신설, 시각적 계층 원칙 명문화 완료

**v2**
- **원래 목표 달성 여부**: [x] Yes  [ ] Partial  [ ] No
- **결과 요약**: 
  - §9 복원 및 Z-Index 표 정리 완료.
  - 최솟값 44px 강제 적용 (패딩 보정 방식 폐기).
  - CTA-primary/secondary 52px, CTA-options 44px로 높이 조정 체계 확립.
  - CTA-secondary-small 36px 예외 유지.
  - Alignment 원칙(행-높이, 열-너비 일치) 신설.
  - 관련 `globals.css` 토큰 신설(`--h-cta-xl`, `--h-cta-sm` 등) 및 `ActionButtons.tsx`, `Toolbar.tsx`, `PurposeSelector.tsx` 등 구현 파일 수치 반영 환산 완료.

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
