# CAI CANVAS 앱 인터페이스 디자인 시스템

본 문서는 CAI CANVAS 서비스의 일관된 브랜드 정체성과 전문가급 UX를 보장하기 위한 인터페이스 디자인 표준입니다.

**문서 구성:**
- **PART A** — 앱 인터페이스 공통 디자인 시스템 (모든 CAI 노드에 적용)
- **PART B** — N10 PRINT 노드 전용 문서 템플릿 디자인 시스템

> **개정 이력**:
> - v2.0 (2026-04-16) — Apple Design Tips · Figma UI Principles · TW Elements Spacing 3대 원칙 적용 개선. Spacing Scale 수치화, 시각적 계층 원칙 신설(A.0), 인터랙션 규칙 신설(A.8), 중복 섹션 정리.
> - v2.1 (2026-04-16) — A.0.3 Alignment 원칙 신설. 터치 영역 규칙 강화(최솟값 44px = 물리적 높이 자체). CTA 높이 체계 조정(primary·secondary 52px, options 44px). §9.3 Z-Index 표 원상복구.
> - v2.2 (2026-04-16) — 구조 재편: PART A(공통) / PART B(N10 PRINT 전용) 명확 분리. 서비스 개요 → PART B 서두(B.0)로 이동. 포커스 링 `#007BFF` → 흑백 시스템 준수(A.8.2). `gray-100` hover 배경 예외 명시(A.3). N10 PRINT 전용 레이아웃 요소 명시(A.6.1, A.7.3). §9 중복 섹션 삭제.
> - v2.3 (2026-04-16) — A.6.1: "문서 캔버스" → 공통 **앱 캔버스**(그레이 배경 + 무한 그리드)와 N10 PRINT 전용 **문서 대지(Artboard)**로 분리. A.7.3: Canvas Layer 설명 업데이트.

---

# PART A · 앱 인터페이스 공통 디자인 시스템

> 이 파트의 모든 규칙은 **CAI CANVAS의 모든 노드**에 공통 적용됩니다.
> 특정 노드에만 해당하는 레이아웃·기능은 `[N10 PRINT 전용]` 등 노드명으로 명시합니다.

---

## A.0 시각적 계층 구조 원칙 (Visual Hierarchy Principles)

> **참조 원칙**: Apple Design Tips (사용자 의도 파악, 가장 중요한 요소 즉각 인식), Figma Principles (대비·정렬)

화면의 모든 요소는 아래 3단계 우선순위 계층을 따릅니다. 계층을 어기는 디자인 결정은 허용되지 않습니다.

### A.0.1 3단계 시각적 우선순위

| 우선순위 | 명칭 | 정의 | 대표 요소 |
| :--- | :--- | :--- | :--- |
| **Tier 1 — Primary** | 핵심 액션 | 사용자가 반드시 인식해야 하는 단 하나의 요소 | CTA-primary (GENERATE) |
| **Tier 2 — Secondary** | 보조 액션 | Tier 1을 보완하는 상황 의존적 요소 | CTA-secondary (EXPORT), 모드 선택 탭 |
| **Tier 3 — Ambient** | 맥락 정보 | 읽히되 눈에 띄지 않아야 할 배경 정보 | Caption, 구분선, 비활성 라벨 |

### A.0.2 계층 적용 원칙

1.  **화면당 Tier 1은 단 1개**: CTA-primary는 화면에 1개만 존재한다. 동시에 2개 이상의 Tier 1 요소를 배치하지 않는다.
2.  **대비(Contrast) 우선**: Tier 1은 항상 배경과의 명도 대비가 가장 높아야 한다. CAI 시스템에서는 `black` 배경 + `white` 텍스트 조합이 최고 대비를 갖는다.
3.  **정렬(Alignment) 일관성**: 동일 Tier의 요소는 동일한 정렬 축을 공유한다. 사이드바 내 CTA 버튼은 모두 좌우 full-width로 정렬한다.
4.  **근접성(Proximity) 그룹화**: 기능적으로 연관된 요소는 8px 그리드 기준 `space-2` (16px) 이내로 묶는다. 비연관 그룹 간에는 최소 `space-4` (32px) 이상의 간격을 둔다.
5.  **반복(Repetition) 일관성**: 같은 역할의 컴포넌트는 어느 화면에서도 동일한 시각적 형태를 유지한다. CTA-primary의 pill 형태, black/white 색상은 예외 없이 반복 적용한다.

### A.0.3 Alignment 원칙

> **참조 원칙**: Figma UI Design Principles (정렬)

- **행(Row) 정렬**: 같은 행에 있는 요소들은 **같은 높이**를 가진다.
- **열(Column) 정렬**: 같은 열에 있는 요소들은 **같은 너비**를 가진다.

---

## A.1 폰트 시스템 (App UI)

앱 인터페이스에는 다음 2종의 폰트만 적용됩니다.
PART B의 템플릿 전용 폰트(§B.1)와 별개로 관리됩니다.

| 폰트 | 용도 |
| :--- | :--- |
| **Bebas Neue** | 헤더 타이틀 / 기능 탭 타이틀 / CTA 버튼 텍스트 전체 / 옵션 버튼 텍스트 / 모달·사이드바 타이틀 / 사이드바 섹션 타이틀(Subtitle) |
| **Pretendard** | Body 텍스트 / 숫자 인디케이터 / 텍스트 홀더 내부 / 안내 문구 |

---

## A.2 타이포그래피 위계 (App UI)

| 계층 | 폰트 | Weight | Size | 행간 | 자간 | 주요 용도 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **타이틀** | Bebas Neue | Regular | 16pt | 100% | 3% | 헤더, 탭, CTA 버튼 문구, 모달·사이드바 메인 타이틀 |
| **서브타이틀** | Bebas Neue | Regular | 14pt | 100% | 3% | 사이드바 섹션 타이틀 |
| **Body 1** | Pretendard | Semibold | 16pt | 140% | — | 강조 본문 |
| **Body 2** | Pretendard | Regular | 16pt | 140% | — | 일반 본문 |
| **Body 3** | Pretendard | Regular | 14pt | 140% | — | 보조 본문 |
| **Caption** | Pretendard | Regular | 12pt | 120% | — | 캡션, 보조 설명 |

---

## A.3 컬러 시스템 (App UI)

앱 인터페이스 전용 컬러 팔레트. 5단계 그레이스케일 + black/white 7색 체계.
위계별로 사용 맥락을 지정하여 그레이 남용을 방지한다.

> **핵심 원칙: 흑백 유지.** 앱 인터페이스에서 색상(무채색 외)은 사용하지 않는다.
> 유일한 예외: 오류 상태(red, §A.8.5), 템플릿 내 텍스트박스 포커스·그리드(§B.2).

**그레이스케일 7색 체계**

| 토큰 | Hex | 명도 | 주요 사용 맥락 | 절대 금지 |
| :--- | :--- | :--- | :--- | :--- |
| `black` | `#000000` | 0% | CTA-primary 배경 / CTA-secondary·options 보더+텍스트 / 헤더 타이틀 / 기본 텍스트 | — |
| `white` | `#FFFFFF` | 100% | 사이드바·헤더·모달·버튼 배경 / CTA-primary 텍스트 | — |
| `gray-500` | `#333333` | 79% | 보조 텍스트 (Body 2·3), 아이콘 기본 색상 | 배경색 |
| `gray-400` | `#666666` | 60% | Caption, 힌트 텍스트, 비활성 라벨 | 주요 텍스트 |
| `gray-300` | `#999999` | 40% | 비활성 아이콘, 비활성 버튼 텍스트, placeholder 텍스트 | 강조 요소 |
| `gray-200` | `#CCCCCC` | 20% | 인터랙션 요소 보더 (입력 영역 테두리, 비활성 버튼 보더, CTA-options default 보더 등) | 텍스트 |
| `gray-100` | `#EEEEEE` | 7% | **구분선 전용** — 섹션 구분선, 툴바 구분선, 사이드바·헤더 구분선 등. **예외**: 인터랙션 hover 배경(§A.8.1) | 텍스트 |

> **`gray-200` vs `gray-100` 구분 기준:**
> `gray-200`은 사용자가 조작하는 **인터랙션 요소의 경계** (버튼·입력 테두리 등).
> `gray-100`은 레이아웃을 **구획하는 구분선** (툴바·사이드바·섹션 구분선 등).
> 구분선에는 항상 `gray-100`을 사용합니다.

---

## A.4 UI 요소 높이 기준

가로로 긴 UI 요소의 높이는 세 가지 기준 중 하나로 통일한다.

| 높이 | rem 값 | 적용 대상 |
| :--- | :--- | :--- |
| **52px** | `3.25rem` | CTA-primary, CTA-secondary |
| **44px** | `2.75rem` | CTA-options, 기능 탭(NodeSelector 드롭다운), 숫자 인디케이터, 아이콘 버튼(툴바), 기타 가로형 입력 요소 |
| **36px** | `2.25rem` | CTA-secondary-small **(예외 — 모달 내부 등 좁은 영역 전용. 최솟값 44px 규칙의 유일한 공인 예외)** |

> **최소 터치/클릭 영역 규칙 (Touch Target Minimum)**
> Apple Human Interface Guidelines 기준: **모든 인터랙티브 요소의 물리적 높이·너비 자체가 44px 이상이어야 한다.**
> padding 보정으로 히트 영역만 44px를 확보하는 방식은 허용하지 않는다. 시각적 높이(height 속성)가 반드시 44px 이상이어야 한다.
> **유일한 예외**: CTA-secondary-small (36px) — 모달 내부 등 좁은 영역에서만 사용하며, 이 예외는 다른 컴포넌트에 확장 적용이 불가하다.

---

## A.5 CTA 컴포넌트 가이드

CTA(Call To Action) 버튼은 3종 + 1 variant로 분류한다.
모든 CTA 문구는 **§A.1 · §A.2 기준: Bebas Neue / 타이틀 위계** 적용.

---

### CTA-primary (예: GENERATE)

주요 액션 버튼. 화면당 단 1개. (§A.0.1 Tier 1 원칙 적용)

| 속성 | 값 |
| :--- | :--- |
| 높이 | `3.25rem` (52px) |
| 너비 | 100% |
| 모서리 곡률 | `radius-pill` (`5rem`) |
| 폰트 | Bebas Neue / 타이틀 (16pt) |

| 상태 | 배경 | 텍스트 | 보더 | 커서 |
| :--- | :--- | :--- | :--- | :--- |
| **default** | `black` | `white` | 없음 | pointer |
| **loading** | `black` | `white` ("GENERATING..." 전환) | 없음 | not-allowed |
| **disabled** | `gray-200` | `gray-300` | 없음 | not-allowed |

---

### CTA-secondary (예: EXPORT)

보조 액션 버튼. primary 하단에 위치. (§A.0.1 Tier 2 원칙 적용)

| 속성 | 값 |
| :--- | :--- |
| 높이 | `3.25rem` (52px) |
| 너비 | 100% |
| 모서리 곡률 | `radius-pill` (`5rem`) |
| 폰트 | Bebas Neue / 타이틀 (16pt) |

| 상태 | 배경 | 텍스트 | 보더 | 커서 |
| :--- | :--- | :--- | :--- | :--- |
| **default** | `white` | `black` | `1.5px solid black` | pointer |
| **disabled** | `white` | `gray-300` | `1.5px solid gray-300` | not-allowed |

---

### CTA-secondary-small

모달 내 단일 버튼 등 컴팩트한 보조 액션이 필요할 때 사용. CTA-secondary의 높이만 축소.

| 속성 | 값 |
| :--- | :--- |
| 높이 | `2.25rem` (36px) — `2.75rem × 0.8 = 2.2rem` 소수 → 36px 정수 치환 |
| 너비 | 상황에 따라 가변 |
| 모서리 곡률 | `radius-pill` (`5rem`) |
| 폰트 | Bebas Neue, **16pt** |
| 보더 | CTA-secondary와 동일 (`1.5px solid`) |

| 상태 | 배경 | 텍스트 | 보더 | 커서 |
| :--- | :--- | :--- | :--- | :--- |
| **default** | `white` | `black` | `1.5px solid black` | pointer |
| **disabled** | `white` | `gray-300` | `1.5px solid gray-300` | not-allowed |

---

### CTA-options (예: PURPOSE 선택 버튼)

선택 그룹 내 단일 옵션 버튼. 복수 존재, 상호 배타적 선택.

| 속성 | 값 |
| :--- | :--- |
| 높이 | `2.75rem` (44px) 고정 |
| 너비 | 100% |
| 모서리 곡률 | `radius-box` (`0.625rem`) |
| 폰트 | Bebas Neue / 타이틀 (16pt) |

| 상태 | 배경 | 텍스트 | 보더 | 커서 |
| :--- | :--- | :--- | :--- | :--- |
| **default** | `white` | `black` | `1.5px solid gray-200` | pointer |
| **selected** | `gray-100` | `black` | `1.5px solid black` | pointer |

> `selected` 상태의 배경 `gray-100` 적용은 "선택 상태 전용 예외"로, §A.3의 `gray-100` 용도와 다릅니다. 이 예외는 CTA-options에만 적용된다.
> 서브 토글 (예: LANDSCAPE / PORTRAIT)도 동일 규칙 적용.

---

## A.6 앱 인터페이스 레이아웃 (App UI Layout)

어플리케이션의 작업 환경을 구성하는 주요 UI 요소들의 배치와 간격 체계입니다.

### A.6.1 주요 컴포넌트 규격

*   **상단 헤더 (Global Header)**:
    *   높이: `3.5rem` (56px)
    *   구성: 서비스 로고 및 상태 정보 배치. 배경색 `#FFFFFF`, 하단 보더 `1px gray-100`.
*   **우측 사이드바 (Primary Sidebar)**:
    *   너비: `18rem` (288px)
    *   배치: Floating 스타일 (`right: 1rem`, `top: 8rem`, `bottom: 1rem`)
    *   내부 패딩: `1.25rem` (20px)
*   **좌측 플로팅 툴바 (Floating Toolbar)**:
    *   배치: `left: 1rem`, 수직 중앙 정렬 (`top: 50%`, `translateY(-50%)`)
    *   **공통 구조**: Pill 묶음(흰 배경, `radius-pill`, `shadow-float`) + 분리된 원형 버튼으로 구성. 버튼 크기 `2.75rem × 2.75rem` (44px × 44px) — §A.4 최솟값 준수.
    *   **버튼 구성은 노드별로 다르며**, 각 노드의 전용 문서에서 정의한다. N10 PRINT 노드의 구성은 §B.0.2 참조.
*   **플로팅 네비게이션 (Floating Nav)**:
    *   높이: `2.75rem` (44px)
    *   배치: `top: 4.5rem`, `right: 1rem`, 너비 `18rem`
*   **`[N10 PRINT 전용]` 하단 문서 미리보기 바 (Preview Strip)**:
    *   높이: `10rem` (160px)
    *   배치: `bottom: 1rem`, `left: 1rem`, `right: 21.25rem` (사이드바와 겹치지 않도록)
    *   출력용 문서의 페이지별 썸네일을 표시하는 N10 PRINT 전용 UI 요소.
*   **애플리케이션 캔버스 (App Canvas)**:
    *   헤더·사이드바·툴바 등 모든 부유 UI 하단에 위치하는 공통 작업 배경 영역.
    *   배경: `gray-50` (#F9F9F9) 단색 + **무한 그리드(Infinite Grid)** 오버레이. 그리드는 줌인/줌아웃에 따라 지속적으로 스케일 조정되며 끊김 없이 반복된다.
    *   Z-Index: `Base` (Canvas Layer) — 모든 부유 UI 레이어 아래.
*   **`[N10 PRINT 전용]` 문서 대지 (Document Artboard)**:
    *   App Canvas 위에 떠 있는 흰 직사각형 영역으로, 생성된 출력 문서(REPORT / PANEL / DRAWING / VIDEO 템플릿)가 렌더링되는 전용 공간.
    *   빈 상태, 로딩 상태, 결과 표시 상태를 포함한다. N10 PRINT 노드에만 존재한다.

---

## A.7 간격 & 곡률 & Z-Index 토큰 (UI Tokens)

### A.7.1 Spacing Scale (8px 그리드 기반)

> **참조 원칙**: TW Elements Spacing — 8px 그리드 기반의 일관된 Spacing Scale.
> 모든 여백·패딩 수치는 아래 토큰 명칭으로 지정한다. 임의의 수치 사용 금지.

| 토큰 | px 값 | rem 값 | 주요 용도 |
| :--- | :--- | :--- | :--- |
| `space-0` | 0px | 0 | 마진·패딩 없음 |
| `space-1` | 8px | 0.5rem | 아이콘 내부 패딩, 인접 요소 최소 간격 |
| `space-2` | 16px | 1rem | 기본 컴포넌트 내부 패딩, 연관 그룹 내 요소 간격 |
| `space-3` | 20px | 1.25rem | 사이드바·카드 내부 패딩 |
| `space-4` | 32px | 2rem | 비연관 그룹 간 구분 간격, 섹션 상단 여백 |
| `space-5` | 40px | 2.5rem | 주요 섹션 간 여백 |
| `space-6` | 48px | 3rem | 페이지 레벨 여백 |
| `space-8` | 64px | 4rem | 대형 레이아웃 구분 여백 |

> **근접성(Proximity) 그룹화 규칙**: 동일 기능군 내 요소는 `space-1` ~ `space-2` (8~16px), 서로 다른 기능군 간에는 `space-4` (32px) 이상을 유지한다.

**기존 토큰과의 매핑:**

| 기존 표현 | 매핑 토큰 | 실제 값 |
| :--- | :--- | :--- |
| "기본 여백 1rem" | `space-2` | 16px |
| "사이드바 내부 패딩 1.25rem" | `space-3` | 20px |
| "툴바 pill 간격 0.5rem" | `space-1` | 8px |

### A.7.2 간격 및 곡률 토큰

*   **기본 여백 (Global Spacing)**: `space-2` = `1rem` (16px)을 기본 단위로 사용합니다.
*   **컴포넌트 곡률 (Corner Radius)**:
    *   모듈형 박스 (`radius-box`): `0.625rem` (10px) — 사이드바, 헤더 버튼, 입력 영역, CTA-options 적용.
    *   캡슐형/원형 요소 (`radius-pill` / `50%`): `5rem` (80px) 또는 50% — 툴바 Pill 묶음 영역, 페이지 카운트 조절기, CTA-primary/secondary 등.
*   **그림자 (Shadow)**: `0 10px 15px -3px rgba(0,0,0,0.1)` — 부유 요소의 깊이감 형성.
    > **플로팅 UI 그림자 단일화 원칙**: 좌측 툴바, 분리된 기능 탭, 모달창, 사이드바 본체 및 토글버튼 등 공간에 떠 있는(Floating) UI는 **명시적인 선(Stroke/Border)을 사용하지 않고 오직 Drop Shadow(`shadow-float`) 단일 속성으로만** 깊이감과 경계를 표현해야 한다.

### A.7.3 레이어 계층 시스템 (Z-Index)

| 계층 | Z-Index | 대상 컴포넌트 |
| :--- | :--- | :--- |
| **Modal Layer** | `1000+` | 툴바, 팝업 모달, 토스트 알림 |
| **Nav Layer** | `100` | 플로팅 메뉴, 상태 표시줄 |
| **Control Layer** | `90` | 우측 사이드바 |
| **Preview Layer** | `20` | `[N10 PRINT 전용]` 하단 문서 미리보기 바 |
| **System Layer** | `10` | 상단 고정 헤더 |
| **Canvas Layer** | `Base` | 애플리케이션 캔버스 (공통 배경 + 무한 그리드); `[N10 PRINT 전용]` 문서 대지(Artboard)도 이 레이어에 위치 |

---

## A.8 인터랙션 & 피드백 규칙 (Interaction & Feedback)

> **참조 원칙**: Apple Design Tips (친숙한 상호작용, 시각적 직관 피드백), Figma 대비 원칙.
> 모든 인터랙티브 요소는 상태 변화를 시각적으로 즉각 피드백해야 한다.

### A.8.1 Hover 상태 규칙

| 요소 유형 | Hover 표현 | 전환 (Transition) |
| :--- | :--- | :--- |
| **CTA-primary** | 배경 `black` → opacity `0.85` (약간 투명) | `opacity 150ms ease` |
| **CTA-secondary** | 배경 `white` → `gray-100` | `background-color 150ms ease` |
| **CTA-options (default)** | 보더 `gray-200` → `black` | `border-color 150ms ease` |
| **CTA-options (selected)** | 변화 없음 (이미 active) | — |
| **툴바 아이콘 버튼** | 배경 `transparent` → `gray-100` | `background-color 100ms ease` |

### A.8.2 Focus 상태 규칙

| 요소 유형 | Focus 표현 |
| :--- | :--- |
| **밝은 배경 위 버튼** (기본) | `outline: 2px solid #000000`, `outline-offset: 2px` |
| **어두운 배경 위 버튼** (CTA-primary 등 `black` bg) | `outline: 2px solid #FFFFFF`, `outline-offset: 2px` |
| **텍스트 입력 영역** | 보더 `gray-200` → `black`, `outline: none` |
| **드롭다운/셀렉트** | 보더 `gray-200` → `black`, `outline: none` |

> Focus 링은 흑백 시스템을 준수한다. `#000000` on `#FFFFFF` = 21:1 명도 대비로 WCAG 2.1 AAA(7:1) 기준을 초과 달성한다.

### A.8.3 Active(클릭 중) 상태 규칙

| 요소 유형 | Active 표현 | 전환 |
| :--- | :--- | :--- |
| **CTA-primary** | `transform: scale(0.97)` | `transform 80ms ease` |
| **CTA-secondary** | `transform: scale(0.97)` | `transform 80ms ease` |
| **툴바 아이콘 버튼** | 배경 `gray-200` | `background-color 80ms ease` |

### A.8.4 전환 속도 원칙

| 유형 | 권장 속도 | 이유 |
| :--- | :--- | :--- |
| 색상·배경 전환 | `150ms ease` | 충분히 인지 가능하되 지연감 없음 |
| 크기·Transform 전환 | `80ms ease` | 즉각적인 물리적 피드백 |
| 모달·오버레이 등장 | `200ms ease-out` | 자연스러운 진입감 |
| 로딩 스피너 | rotating `800ms linear infinite` | 구동 중 인식 |

### A.8.5 비시각적 피드백 규칙

*   **Disabled 요소**는 `opacity: 0.5`를 추가하지 않는다. 대신 §A.5에 정의된 전용 disabled 색상 토큰(`gray-200`, `gray-300`)으로만 표현한다. (opacity 사용 시 배경이 투명해 보이는 부작용 방지)
*   **로딩 상태(CTA-primary)**: 버튼 텍스트를 "GENERATING..."으로 즉시 전환하여 처리 중임을 텍스트로 명확히 전달한다. 스피너 아이콘은 선택적으로 추가할 수 있다.
*   **오류 상태**: Toast 알림(`Modal Layer`, Z-Index 1000+)으로 표시. 붉은 계열 컬러는 이 맥락에서만 허용한다.

---

# PART B · N10 PRINT 노드 — 문서 템플릿 디자인 시스템

> 이 파트의 모든 내용은 **N10 PRINT 노드 전용**입니다.
> 출력용 문서 템플릿(REPORT / PANEL / DRAWING / VIDEO) 내부의 디자인 기준이며,
> PART A의 앱 인터페이스 디자인 기준과 별개로 관리됩니다.

---

## B.0 N10 PRINT 서비스 개요

### B.0.1 문서 모드 (Document Modes)

1.  **REPORT**: 건축 전략 제안 및 대지 분석용 A3 가로형 보고서 시스템.
2.  **PANEL**: 전시 및 현상 설계 프레젠테이션용 A0 대형 패널 시스템.
3.  **DRAWING**: 기술 검토 및 상세 도면 출력을 위한 도각(Title Block) 포함 모드.
4.  **VIDEO**: 이미지 간 시퀀스 전환을 통한 건축적 연출 영상 생성.
    *   비율: `16:9` / 길이: `8초`
    *   생성 엔진: Google Veo 3.1 Lite (`models/veo-3.1-lite-generate-preview`)
    *   입력: 시작 프레임 1장 + 종료 프레임 1장 (순서 고정, 정확히 2장 필수)

*   **대상 사용자**: 건축가, 도시 계획가, 공간 디자이너 및 기획 전문가.
*   **출력 목적**: 포트폴리오, 현상 설계 제출안, 클라이언트 보고용 고해상도 물리적 출력물.

### B.0.2 N10 PRINT 전용 툴바 버튼 구성

§A.6.1의 공통 플로팅 툴바 구조를 기반으로, N10 PRINT 노드에서는 다음 버튼 구성을 사용한다.

*   **Pill 묶음** (흰 배경 `white`, `radius-pill`, `shadow-float`):
    1.  **Undo** — 직전 생성 결과로 되돌리기
    2.  **Redo** — 앞 단계 생성 결과로 이동
    3.  *(구분선 `gray-100` 1px)*
    4.  **Library** — 아이콘: 이미지 갤러리 아이콘. `sources/library/` 이미지 모음 접근.
    5.  **Saves** — 아이콘: **아카이빙 아이콘** (박스+수평선). 저장된 문서 목록 열기.
*   **분리된 원형 버튼** (pill 묶음 하단에 `var(--gap-global)` 간격으로 독립 배치):
    *   **SAVE 버튼**: 흰 배경 `white` + 검은 아이콘 `black`. 아이콘: **플로피디스크 아이콘**. 현재 문서 저장.
    *   **NEW PROJECT 버튼**: 검은 배경 `black` + 흰 아이콘 `white`. 아이콘: 플러스(+). 새 문서 시작.

> **아이콘 구분 원칙**: Saves(문서 목록)는 아카이빙 아이콘, SAVE 버튼(현재 저장)은 플로피디스크 아이콘 — 기능 혼동 방지.

---

## B.1 타이포그래피 (Typography — Template)

### B.1.1 폰트 시스템 및 에셋

템플릿 내부에 적용되는 교체 가능한 6종의 폰트 에셋. 앱 인터페이스 폰트(§A.1)와 별개.

| 계층 (Level) | 용도 | Report (pt) | Panel (pt) | Drawing (pt) | 특이사항 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 1** | 메인 타이틀 | 24 (Cover 72) | 140 | 16 | Black/Bold 적용 |
| **Level 2** | 서브 타이틀 | 16 (Cover 28) | 90 | 10 | Medium/Bold 적용 |
| **Level 3** | 라벨/인덱스 | 12 | 35 | 10 (Semi) | Semi-bold 권장 |
| **Level 4** | 본문/설명 | 11 | 19 ~ 30 | 8 ~ 10 | Regular/Light 적용 |

*   **[템플릿 전용] 지원 폰트**: `Pretendard`, `Gmarket Sans`, `Noto Sans KR`, `KoPub Batang`, `KoPub Dotum`, `S-Core Dream`

### B.1.2 PANEL 텍스트 클래스 속성

PANEL 모드는 3개의 전용 텍스트 클래스를 사용한다. 각 클래스의 행간·자간·정렬은 레이아웃 무결성과 직결되므로 임의 변경 금지.

| 클래스 | font-weight | line-height | letter-spacing | text-align |
| :--- | :--- | :--- | :--- | :--- |
| `t-heavy` | 900 (Black) | 1.0 | `-4px` | — |
| `t-medium` | 500 (Medium) | 1.1 | — | — |
| `t-light` | 200 (ExtraLight) | 1.6 | — | `justify` |

---

## B.2 컬러 팔레트 (Color Palette — Template)

### B.2.1 인터페이스 및 시스템 컬러

*   **어플리케이션 배경**: `#F5F5F5` (캔버스 외부 작업 영역)
*   **문서 배경**: `#FFFFFF` (순백색 출력용 배경)
*   **가이드라인 (Guides)**: `rgba(0, 255, 255, 0.5)` (비인쇄 정렬 보조선)
*   **포커스/액션 (템플릿 텍스트박스·그리드 전용)**: `#007BFF` (§A.3 흑백 원칙의 유일한 템플릿 내 예외)
*   **이미지 플레이스홀더**: `#F8F8F8` (이미지 미지정 영역)

### B.2.2 텍스트 및 보더 컬러

*   **기본 텍스트**: `#000000` (Main black)
*   **보조/캡션**: `#333333`, `#555555`, `#666666` (Gray 계층별 적용)
*   **기본 테두리**: `#CCCCCC` (Dashed, 입력 영역 구분용)
*   **도면 프레임**: `#000000` (1.5pt solid, Drawing 모드 프레임 전용)

---

## B.3 레이아웃 & 그리드 (Layout & Grid — Template)

| 모드 | 규격 (ISO 216) | 치수 (mm) | 내부 패딩 (mm) | 그리드 구조 |
| :--- | :--- | :--- | :--- | :--- |
| **REPORT** | A3 Landscape | 420 x 297 | L/R: 15, T/B: 15 | 1열, 2열, Mixed, 4분할 그리드 지원 |
| **PANEL** | A0 Portrait/Land | 841 x 1189 | L/R: 20, T/B: 20 | 가로/세로 오리엔테이션별 CSS Grid 배치 |
| **DRAWING** | A3 Landscape | 420 x 297 | Outer: 7 | 도면 영역(Drawing Area) + 우측 도각(80mm) |

> **PANEL 패딩 확정**: 기존 `20~25mm` 범위 표현을 `20mm` 단일 값으로 확정. (8px 그리드 원칙상 범위 표현 불허)

---

## B.4 간격 & 측정 체계 (Spacing & Measurement — Template)

모든 물리적 치수는 출력을 위해 `mm` 단위를 기준으로 정의됩니다.

*   **`--pad`**: 기본 문서 여백 (`15mm`)
*   **`--gap`**: 콘텐츠 간격 (**Report**: `5mm`, **Panel**: `10mm`)
*   **`--title-gap`**: 타이틀과 본문 사이 간격 (`5mm`)
*   **기준 스케일**: `1920px` 해상도에서 `1rem = 16px` 기준, `--ui-scale`을 통한 반응형 뷰포트 대응.

---

## B.5 템플릿별 슬롯 명세 (Slot Specifications)

각 템플릿의 슬롯(블록)은 정의된 물리적 높이를 초과할 수 없으며, 자동 스케일링을 통해 폰트 크기를 조정합니다.

### B.5.1 REPORT 슬롯 명세

**헤더 영역 (모든 컨텐츠 페이지 공통)**

| 슬롯 | 클래스 | 물리적 제약 | 비고 |
| :--- | :--- | :--- | :--- |
| 메인 타이틀 | `main-title` | max-height `35mm`, width `300mm` | font-size 24pt, weight 800 |
| 회사명 | `comp-name` | min-width `60mm` | font-size 14pt, 우측 정렬 |
| 서브 타이틀 | `sub-title-box` | 가변 (내용에 따라 늘어남) | font-size 16pt |
| 인덱스 표시 | `index-indicator` | width `150mm` | font-size 12pt, 우측 정렬 |
| 페이지 설명 | `page-desc-area` | height `16mm`, line-height 1.5 | font-size 11pt, **줄 수 한계 약 2줄** |

**이미지·캡션 슬롯**

| 슬롯 | 클래스 | 물리적 제약 | 배치 |
| :--- | :--- | :--- | :--- |
| 세로형 캡션 | `desc-vertical` | height `3.2em` (line-height 1.6, **2줄**), margin-top `5mm` | 이미지 하단 |
| 가로형 캡션 | `desc-horizontal` | padding `5mm`, flex `0.64`, height `100%` | 이미지 우측 |

**컨텐츠 페이지 레이아웃 4종**

| 레이아웃 | 구조 | 이미지 수 | 캡션 유형 |
| :--- | :--- | :--- | :--- |
| **단일 (1열)** | 이미지 1개 + 하단 캡션 | 1 | `desc-vertical` |
| **2열 균등** | 이미지 2개 나란히 + 각 하단 캡션 | 2 | `desc-vertical` × 2 |
| **Mixed (1+2)** | 좌: 이미지 1개 + 하단 캡션 / 우: 이미지 2개 세로 적층 + 각 우측 캡션 | 3 | `desc-vertical` + `desc-horizontal` × 2 |
| **4분할 그리드** | 2×2 그리드, 각 셀에 이미지 + 우측 캡션 | 4 | `desc-horizontal` × 4 |

### B.5.2 DRAWING 도각(Title Block) 슬롯 명세

도각 너비: `40mm` (고정). 도면 영역과 `border-right: 1.5pt solid #000`으로 구분.

| 섹션 | 높이 | 라벨 font | 값 font | 내용 |
| :--- | :--- | :--- | :--- | :--- |
| PROJECT TITLE | `12mm` | S-CoreDream Heavy 5.5pt | S-CoreDream Medium 8pt | 프로젝트명 |
| LOGO | `35mm` | Heavy 20pt (로고) | 5pt (서브라인), 4pt (주소) | `CRE-TE` / `CREATIVE TEMPERATURE` / 주소 |
| NOTE | `flex: 1` (잔여 공간) | Heavy 5.5pt | Light 6pt | 도면 주의사항 |
| DESIGNED BY | 가변 (meta-section) | Heavy 5pt | Medium 7.5pt | 설계자 |
| ARCHITECTURAL ENGINEER | 가변 | Heavy 5pt | Medium 7.5pt | 건축 엔지니어 |
| APPROVED BY | 가변 | Heavy 5pt | Medium 7.5pt | 승인자 |
| SCALE | 가변 | Heavy 5pt | Medium 7.5pt | 축척 (예: `1/100`) |
| DRAWING NO. | 가변 | Heavy 5pt | **Heavy 14pt** | 도면 번호 (예: `A-101`) |
| SHEET NO. | 가변 (last, border-thick) | Heavy 5pt | Medium 7.5pt | 시트 번호 (예: `01 / 10`) |
| FILE NAME | 가변 (border-none) | Heavy 5.5pt | Medium 8pt | 파일명 |

### B.5.3 PANEL 슬롯 명세

PANEL은 고정 슬롯이 없는 CSS Grid 자유 배치 구조다. 슬롯 크기는 그리드 `cols`·`rows` 정의에 따른다.

**A0 Landscape (1189×841mm) 기본 그리드:**

| 열 구성 | 행 구성 |
| :--- | :--- |
| `373mm 373mm 181.5mm 181.5mm` (4열) | `75mm 45mm 130mm 25mm 195mm 281mm` (6행) |

**A0 Portrait (841×1189mm) 기본 그리드:**

| 열 구성 | 행 구성 |
| :--- | :--- |
| `repeat(4, 192.5mm)` (4열 균등) | `75mm 45mm 74mm 25mm 115mm 25mm 115mm 190mm 395mm` (9행) |

---

## B.6 브랜드 요소 (Brand Elements — Template)

*   **브랜드 로고**: 도각(Title Block) LOGO 섹션에 배치되는 `CRE-TE` 텍스트 기반 로고. (Pretendard 800, 16pt 기반)
*   **도각(Title Block) 표준**: 국내외 건축 도면 표준을 따르는 필드 구성.
    *   필수 필드: Project Title, Company, Note, Designed by, Approved by, Scale, Drawing No, Sheet No.
*   **타이포그래픽 브랜딩**: 서브라인 문자 사이 간격(`letter-spacing: -1.5px`)을 통한 세련된 전문가 인상 강조.

> 앱 UI 헤더 타이틀은 §A.1 기준(Bebas Neue)으로 별도 관리합니다.

---

## B.7 인터랙션 & 렌더링 규칙 (Interaction & Rendering — Template)

*   **Auto-scaling (자동 축소)**:
    *   텍스트가 슬롯 높이를 초과할 경우, `min-size` (Report: 8pt, Drawing: 6pt) 도달 시까지 실시간 축소.
    *   하위 계층(Level 2 이상)은 항상 상위 계층 크기의 **85%(Report/Panel)** 또는 **75%(Drawing)**를 초과할 수 없는 논리적 제약 적용.
*   **Overflow 처리**: 편집 중에는 콘텐츠 보임을 위해 `visible` 처리되나, 최종 렌더링 및 출력 시에는 슬롯 영역 외부를 `hidden` 처리하여 레이아웃 무너짐 방지.
*   **Print 렌더링 최적화**:
    *   `@media print` 시 비인쇄 요소(가이드라인, 입력 점선, 캔버스 배경) 자동 소거.
    *   이미지는 `object-fit: cover`를 기본으로 하되 사용자 선택에 따라 `contain` 지원.

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
