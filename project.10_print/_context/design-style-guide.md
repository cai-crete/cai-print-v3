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

## 2. 타이포그래피 (Typography)

### 2.1 폰트 시스템 및 에셋
사용자가 환경에 따라 교체 가능한 6종의 폰트 에셋을 제공하며, 각 계층별 기본 실측값(pt)은 다음과 같습니다.

| 계층 (Level) | 용도 | Report (pt) | Panel (pt) | Drawing (pt) | 특이사항 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 1** | 메인 타이틀 | 24 (Cover 72) | 140 | 16 | Black/Bold 적용 |
| **Level 2** | 서브 타이틀 | 16 (Cover 28) | 90 | 10 | Medium/Bold 적용 |
| **Level 3** | 라벨/인덱스 | 12 | 35 | 10 (Semi) | Semi-bold 권장 |
| **Level 4** | 본문/설명 | 11 | 19 ~ 30 | 8 ~ 10 | Regular/Light 적용 |

*   **지원 폰트**: `Pretendard`, `Gmarket Sans`, `Noto Sans KR`, `KoPub Batang`, `KoPub Dotum`, `S-Core Dream`

### 2.2 PANEL 텍스트 클래스 속성

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

## 4. 레이아웃 & 그리드 (Layout & Grid)

| 모드 | 규격 (ISO 216) | 치수 (mm) | 내부 패딩 (mm) | 그리드 구조 |
| :--- | :--- | :--- | :--- | :--- |
| **REPORT** | A3 Landscape | 420 x 297 | L/R: 15, T/B: 15 | 1열, 2열, Mixed, 4분할 그리드 지원 |
| **PANEL** | A0 Portrait/Land | 841 x 1189 | L/R: 20~25, T/B: 20~25 | 가로/세로 오리엔테이션별 CSS Grid 배치 |
| **DRAWING** | A3 Landscape | 420 x 297 | Outer: 7 | 도면 영역(Drawing Area) + 우측 도각(80mm) |

---

## 5. 간격 & 측정 체계 (Spacing & Measurement)

모든 물리적 치수는 출력을 위해 `mm` 단위를 기준으로 정의됩니다.

*   **`--pad`**: 기본 문서 여백 (`15mm`)
*   **`--gap`**: 콘텐츠 간격 (**Report**: `5mm`, **Panel**: `10mm`)
*   **`--title-gap`**: 타이틀과 본문 사이 간격 (`5mm`)
*   **기준 스케일**: `1920px` 해상도에서 `1rem = 16px` 기준, `--ui-scale`을 통한 반응형 뷰포트 대응.

---

## 6. 템플릿별 슬롯 명세 (Slot Specifications)

각 템플릿의 슬롯(블록)은 정의된 물리적 높이를 초과할 수 없으며, 자동 스케일링을 통해 폰트 크기를 조정합니다.

### 6.1 REPORT 슬롯 명세

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

### 6.2 DRAWING 도각(Title Block) 슬롯 명세

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

### 6.3 PANEL 슬롯 명세

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

## 7. 브랜드 요소 (Brand Elements)

*   **브랜드 로고**: `company name` 텍스트 기반 로고 (Pretendard 800, 16pt).
*   **도각(Title Block) 표준**: 국내외 건축 도면 표준을 따르는 필드 구성.
    *   필수 필드: Project Title, Company, Note, Designed by, Approved by, Scale, Drawing No, Sheet No.
*   **타이포그래픽 브랜딩**: 서브라인 문자 사이 간격(`letter-spacing: -1.5px`)을 통한 세련된 전문가 인상 강조.

---

## 8. 인터랙션 & 렌더링 규칙 (Interaction & Rendering)

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
