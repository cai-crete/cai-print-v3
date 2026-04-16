# CAI CANVAS | PRINT ver.2 디자인 스타일 가이드

본 문서는 **CAI CANVAS | PRINT ver.2** 서비스의 일관된 건축적 정체성과 전문가급 출력 품질을 보장하기 위한 상세 디자인 인터페이스 표준을 정의합니다.

---

## 1. 서비스 개요 (Service Overview)

*   **문서 모드 (Document Modes)**:
    1.  **REPORT**: 건축 전략 제안 및 대지 분석용 A3 가로형 보고서 시스템.
    2.  **PANEL**: 전시 및 현상 설계 프레젠테이션용 A0 대형 패널 시스템.
    3.  **DRAWING**: 기술 검토 및 상세 도면 출력을 위한 도각(Title Block) 포함 모드.
    4.  **VIDEO**: 이미지 간 시퀀스 전환을 통한 건축적 연출 영상 생성.
        *   비율: `16:9`
        *   길이: `8초`
        *   생성 엔진: Google Veo 3.1 lite (`models/veo-3.1-lite-generate-preview`)
        *   입력: 시작 프레임 1장 + 종료 프레임 1장 (순서 고정, 정확히 2장 필수)
*   **대상 사용자**: 건축가, 도시 계획가, 공간 디자이너 및 기획 전문가.
*   **출력 목적**: 포트폴리오, 현상 설계 제출안, 클라이언트 보고용 고해상도 물리적 출력물.

---

# PART A · 앱 인터페이스 디자인 시스템

서비스 UI를 구성하는 앱 인터페이스 전용 디자인 기준입니다.
아래 PART B의 문서 템플릿 디자인 기준과 별개로 관리됩니다.

---

## A.1 폰트 시스템 (App UI)

앱 인터페이스에는 다음 2종의 폰트만 적용됩니다.
아래 §B.1의 템플릿 전용 6종 폰트와 별개입니다.

| 폰트 | 용도 |
| :--- | :--- |
| **Bebas Neue** | 헤더 타이틀 / 기능 탭 타이틀(PRINT) / CTA 버튼 텍스트 전체 / PURPOSE 옵션 텍스트 / 모달·사이드바 타이틀 / 사이드바 섹션 타이틀(Subtitle) |
| **Pretendard** | Body 텍스트 / 숫자 인디케이터 / 텍스트 홀더 내부 / 안내 문구 |

---

## A.2 타이포그래피 위계 (App UI)

| 계층 | 폰트 | Weight | Size | 행간 | 자간 | 주요 용도 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **타이틀** | Bebas Neue | Regular | 16pt | 100% | 3% | 헤더, 탭, CTA 버튼 문구, 모달·사이드바 메인 타이틀 |
| **서브타이틀** | Bebas Neue | Regular | 14pt | 100% | 3% | 사이드바 섹션 타이틀 (INSERT IMAGE, PURPOSE 등) |
| **Body 1** | Pretendard | Semibold | 16pt | 140% | — | 강조 본문 |
| **Body 2** | Pretendard | Regular | 16pt | 140% | — | 일반 본문 |
| **Body 3** | Pretendard | Regular | 14pt | 140% | — | 보조 본문 |
| **Caption** | Pretendard | Regular | 12pt | 120% | — | 캡션, 보조 설명 |

---

## A.3 컬러 시스템 (App UI)

앱 인터페이스 전용 컬러 팔레트. 5단계 그레이스케일 + black/white 7색 체계.
위계별로 사용 맥락을 지정하여 그레이 남용을 방지한다.

**그레이스케일 7색 체계**

| 토큰 | Hex | 명도 | 주요 사용 맥락 | 절대 금지 |
| :--- | :--- | :--- | :--- | :--- |
| `black` | `#000000` | 0% | CTA-primary 배경 / CTA-secondary·options 보더+텍스트 / 헤더 타이틀 / 기본 텍스트 | — |
| `white` | `#FFFFFF` | 100% | 사이드바·헤더·모달·버튼 배경 / CTA-primary 텍스트 | — |
| `gray-500` | `#333333` | 79% | 보조 텍스트 (Body 2·3), 아이콘 기본 색상 | 배경색 |
| `gray-400` | `#666666` | 60% | Caption, 힌트 텍스트, 비활성 라벨 | 주요 텍스트 |
| `gray-300` | `#999999` | 40% | 비활성 아이콘, 비활성 버튼 텍스트, placeholder 텍스트 | 강조 요소 |
| `gray-200` | `#CCCCCC` | 20% | 인터랙션 요소 보더 (입력 영역 테두리, 비활성 버튼 보더, CTA-options default 보더 등) | 텍스트 |
| `gray-100` | `#EEEEEE` | 7% | **구분선 전용** — 일반 섹션 구분선, 좌측 툴바 구분선, 사이드바 내 구분선, 헤더 하단 보더 등 | 텍스트, 배경 |

> **`gray-200` vs `gray-100` 구분 기준:**
> `gray-200`은 사용자가 조작하는 **인터랙션 요소의 경계** (버튼·입력 테두리 등).
> `gray-100`은 레이아웃을 **구획하는 구분선** (툴바·사이드바·섹션 구분선 등).
> 구분선에는 항상 `gray-100`을 사용합니다.

---

## A.4 UI 요소 높이 기준

가로로 긴 UI 요소의 높이는 두 가지 기준 중 하나로 통일한다.

| 높이 | rem 값 | 적용 대상 |
| :--- | :--- | :--- |
| **44px** | `2.75rem` | CTA-primary, CTA-secondary |
| **36px** | `2.25rem` | CTA-secondary-small, CTA-options, 기능 탭(NodeSelector 드롭다운), 숫자 인디케이터(PageCountControl), 기타 가로형 입력 요소 |

---

## A.5 CTA 컴포넌트 가이드

CTA(Call To Action) 버튼은 3종 + 1 variant로 분류한다.
모든 CTA 문구는 **§A.1 · §A.2 기준: Bebas Neue / 타이틀 위계** 적용.

---

### CTA-primary (예: GENERATE)

주요 액션 버튼. 화면당 단 1개.

| 속성 | 값 |
| :--- | :--- |
| 높이 | `2.75rem` (44px) |
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

보조 액션 버튼. primary 하단에 위치.

| 속성 | 값 |
| :--- | :--- |
| 높이 | `2.75rem` (44px) |
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
| 높이 | `2.25rem` (36px) 고정 |
| 너비 | 100% |
| 모서리 곡률 | `radius-box` (`0.625rem`) |
| 폰트 | Bebas Neue / 타이틀 (16pt) |

| 상태 | 배경 | 텍스트 | 보더 | 커서 |
| :--- | :--- | :--- | :--- | :--- |
| **default** | `white` | `black` | `1.5px solid gray-200` | pointer |
| **selected** | `gray-200` | `black` | `1.5px solid black` | pointer |

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
*   **하단 미리보기 바 (Preview Strip)**:
    *   높이: `10rem` (160px)
    *   배치: `bottom: 1rem`, `left: 1rem`, `right: 21.25rem` (사이드바와 겹치지 않도록 여백 확보)
*   **플로팅 네비게이션 (Floating Nav)**:
    *   높이: `2.75rem` (44px)
    *   배치: `top: 4.5rem`, `right: 1rem`, 너비 `18rem`

---

## A.7 간격 & 곡률 & Z-Index 토큰 (UI Tokens)

### A.7.1 간격 및 곡률 토큰

*   **기본 여백 (Global Spacing)**: `1rem` (16px)을 기본 단위로 사용합니다.
*   **컴포넌트 곡률 (Corner Radius)**:
    *   모듈형 박스 (`radius-box`): `0.625rem` (10px) — 사이드바, 헤더 버튼, 입력 영역, CTA-options 적용.
    *   캡슐형 요소 (`radius-pill`): `5rem` (80px) — 페이지 카운트 조절기, CTA-primary/secondary/secondary-small 등.
*   **그림자 (Shadow)**: `0 10px 15px -3px rgba(0,0,0,0.1)` — 캔버스와의 깊이감 형성.

### A.7.2 레이어 계층 시스템 (Z-Index)

| 계층 | Z-Index | 대상 컴포넌트 |
| :--- | :--- | :--- |
| **Modal Layer** | `1000+` | 툴바, 팝업 모달, 토스트 알림 |
| **Nav Layer** | `100` | 플로팅 메뉴, 상태 표시줄 |
| **Control Layer** | `90` | 우측 사이드바 |
| **Preview Layer** | `20` | 하단 미리보기 스트립 |
| **System Layer** | `10` | 상단 고정 헤더 |
| **Canvas Layer** | `Base` | 건축 문서 렌더링 영역 |

---

# PART B · 문서 템플릿 디자인 시스템

출력용 문서 템플릿(REPORT / PANEL / DRAWING / VIDEO) 내부의 디자인 기준입니다.
위 PART A의 앱 인터페이스 디자인 기준과 별개로 관리됩니다.

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

## 3. 컬러 팔레트 (Color Palette)

### 3.1 인터페이스 및 시스템 컬러
*   **어플리케이션 배경**: `#F5F5F5` (캔버스 외부 작업 영역)
*   **문서 배경**: `#FFFFFF` (순백색 출력용 배경)
*   **가이드라인 (Guides)**: `rgba(0, 255, 255, 0.5)` (비인쇄 정렬 보조선)
*   **포커스/액션**: `#007BFF` (입력 활성화 및 강조 컬러)
*   **이미지 플레이스홀더**: `#F8F8F8` (이미지 미지정 영역)

### 3.2 텍스트 및 보더 컬러
*   **기본 텍스트**: `#000000` (Main black)
*   **보조/캡션**: `#333333`, `#555555`, `#666666` (Gray 계층별 적용)
*   **기본 테두리**: `#CCCCCC` (Dashed, 입력 영역 구분용)
*   **도면 프레임**: `#000000` (1.5pt solid, Drawing 모드 프레임 전용)

---

## B.3 레이아웃 & 그리드 (Layout & Grid — Template)

| 모드 | 규격 (ISO 216) | 치수 (mm) | 내부 패딩 (mm) | 그리드 구조 |
| :--- | :--- | :--- | :--- | :--- |
| **REPORT** | A3 Landscape | 420 x 297 | L/R: 15, T/B: 15 | 1열, 2열, Mixed, 4분할 그리드 지원 |
| **PANEL** | A0 Portrait/Land | 841 x 1189 | L/R: 20~25, T/B: 20~25 | 가로/세로 오리엔테이션별 CSS Grid 배치 |
| **DRAWING** | A3 Landscape | 420 x 297 | Outer: 7 | 도면 영역(Drawing Area) + 우측 도각(80mm) |

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

> 앱 UI 헤더 타이틀("CAI CANVAS | PRINT VER.2")은 §A.1 기준(Bebas Neue)으로 별도 관리합니다.

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

## 9. 앱 인터페이스 레이아웃 (App UI Layout)

어플리케이션의 작업 환경을 구성하는 주요 UI 요소들의 배치와 간격 체계입니다.

### 9.1 주요 컴포넌트 규격
*   **상단 헤더 (Global Header)**: 
    *   높이: `3.5rem` (56px)
    *   구성: 서비스 로고 및 상태 정보 배치. 배경색 `#FFFFFF`, 하단 보더 `1px #EEEEEE`.
*   **우측 사이드바 (Primary Sidebar)**:
    *   너비: `18rem` (288px)
    *   배치: Floating 스타일 (`right: 1rem`, `top: 8rem`, `bottom: 1rem`)
    *   내부 패딩: `1.25rem` (20px)
*   **하단 미리보기 바 (Preview Strip)**:
    *   높이: `10rem` (160px)
    *   배치: `bottom: 1rem`, `left: 1rem`, `right: 21.25rem` (사이드바와 겹치지 않도록 여백 확보)
*   **플로팅 네비게이션 (Floating Nav)**:
    *   높이: `2.75rem` (44px)
    *   배치: `top: 4.5rem`, `right: 1rem`, 너비 `18rem`

### 9.2 간격 및 곡률 토큰 (UI Tokens)
*   **기본 여백 (Global Spacing)**: `1rem` (16px)을 기본 단위로 사용합니다.
*   **컴포넌트 곡률 (Corner Radius)**:
    *   모듈형 박스: `0.625rem` (10px) - 사이드바, 헤더 버튼, 입력 영역 적용.
    *   캡슐형 요소: `5rem` (80px) - 페이지 카운트 조절기, CTA 버튼 등.
*   **그림자 (Shadow)**: `shadow-lg` (0 10px 15px -3px rgba(0,0,0,0.1))를 통해 캔버스와의 깊이감 형성.

### 9.3 레이어 계층 시스템 (Z-Index)
| 계층 | Z-Index | 대상 컴포넌트 |
| :--- | :--- | :--- |
| **Modal Layer** | `1000+` | 툴바, 팝업 모달, 토스트 알림 |
| **Nav Layer** | `100` | 플로팅 메뉴, 상태 표시줄 |
| **Control Layer** | `90` | 우측 사이드바 |
| **Preview Layer** | `20` | 하단 미리보기 스트립 |
| **System Layer** | `10` | 상단 고정 헤더 |
| **Canvas Layer** | `Base` | 건축 문서 렌더링 영역 |
