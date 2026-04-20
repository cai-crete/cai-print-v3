# 프로젝트 폴더 체계 (DIRECTORY_STRUCTURE.md) — 고도화 버전

이 문서는 CAI/Project-10 프로젝트의 전체적인 폴더 구조와 각 폴더 내 핵심 문서들의 구체적인 역할, 그리고 문서 간의 계층 구조를 정의합니다.

---

## 1. 디자인 시스템 계층 구조 (Design Hierarchy)

프로젝트의 디자인 사양은 **글로벌 원칙 → 공통 표준 → 노드 상세 설계**의 3단계 계층을 따릅니다.

1.  **[Global Vision] `docs/DESIGN.md`**
    - 서비스 전체의 브랜드 원칙, 네이밍 컨벤션, 고수준의 UI/UX 철학을 선언합니다.
    - 모든 노드 앱이 공통적으로 지향해야 할 시각적 방향성을 제시합니다.
2.  **[Common Standard] `project.xx/_context/design-style-guide.md` (PART A)**
    - 노드 간 일관성을 위해 정의된 앱 인터페이스 공통 디자인 시스템입니다.
    - 폰트 시스템(Bebas Neue, Pretendard), 8px 그리드 기반 Spacing, 컬러 팔레트(Gray-scale 7색) 등을 규정합니다.
3.  **[Node Detail] `project.xx/_context/design-style-guide.md` (PART B)**
    - 해당 노드(예: N10 PRINT)에만 특화된 컴포넌트(문서 템플릿, 전용 툴바 등)를 상세 설계합니다.
    - 슬롯 명세, 물리적 출력 치수(mm), 전용 레이아웃 엔진 등을 정의합니다.

---

## 2. 전체 디렉토리 트리 및 주요 파일

```text
/ (Root)
├── .agents/                # 에이전트 페르소나 및 도구 사용 규칙 (Persona Config)
├── .claude/                # 에이전트별 히스토리 및 작업 컨텍스트
├── docs/                   # 프로젝트 전반의 기술/설계 문서 저장소 (Global Center)
│   ├── design-docs/        # 설계 철학 및 프로토콜 설계 가이드 (Core Beliefs)
│   ├── exec-plans/         # 작업 단계별 실행 계획서 (active/completed)
│   ├── product-specs/      # 노드별 기술 명세 (Node Contracts)
│   ├── DESIGN.md           # 고수준 디자인 원칙 (Brand & UI Vision)
│   ├── FRONTEND.md         # 프론트엔드 아키텍처 및 표준 구현 패턴
│   ├── RELIABILITY.md      # 에러 처리 정책 및 시스템 안정성 기준
│   ├── SECURITY.md         # API 키 관리 및 데이터 보안 지침
│   └── (기타...)            # PLANS.md, PRODUCT_SENSE.md 등
├── project.10_print/       # N10 "Print" 노드 메인 애플리케이션 (Next.js App)
│   ├── _context/           # AI 에이전트 주입용 하네스 (The Brain)
│   │   ├── protocol/       # 핵심 동작 제어 프로토콜 (Principle Protocols)
│   │   ├── design-style-guide.md  # [핵심] PART A(공통) & PART B(전용) 디자인 시스템
│   │   ├── brand-guidelines.md    # 브랜드 아이덴티티 및 에셋 활용 가이드
│   │   └── business-context.md    # 사업적 배경 및 사용자 페르소나 정의
│   ├── app/                # Next.js App Router (UI & API)
│   │   ├── page.tsx        # 메인 UI 레이아웃 및 클라이언트 로직
│   │   └── api/            # Gemini/Veo API 호출 엔드포인트
│   ├── lib/                # 비즈니스 로직 및 유틸리티 (Engines)
│   │   ├── prompt.ts       # [핵심] 시스템 프롬프트 조합 로직 (buildSystemPrompt)
│   │   ├── export.ts       # 생성물(PDF/이미지) 내보내기 엔진
│   │   ├── htmlUtils.ts    # HTML 템플릿 처리 및 슬롯 바인딩
│   │   └── types.ts        # 전역 타입 및 인터페이스 정의
│   └── sources/            # 프로젝트 샘플 이미지 및 소스 리소스
├── AGENTS.md               # 에이전트가 반드시 준수해야 할 전역 운영 규칙
├── ARCHITECTURE.md         # 서비스 전체의 기술 아키텍처 및 모듈 맵 (System Map)
└── README.md               # 개발 환경 설정 및 프로젝트 퀵 스타트 가이드
```

---

## 3. 핵심 폴더별 문서 상세 역할

### 📂 docs/ — Global Documentation
- **`FRONTEND.md`**: Next.js, Tailwind CSS 등 기술 스택 선정 이유와 API Route 구현 표준 패턴을 설명합니다.
- **`RELIABILITY.md`**: API 타임아웃, 재시도 정책, Protocol 충돌 시 대응 절차 등 시스템 신뢰성을 보장하는 기준입니다.
- **`SECURITY.md`**: 환경 변수 관리, 사용자 입력 데이터 보호 정책 등 보안 필수 체크리스트를 포함합니다.
- **`QUALITY_SCORE.md`**: 결과물의 품질을 측정하는 정량적 지표와 체크리스트를 정의합니다.

### 📂 project.10_print/_context/ — Node Harness
- **`protocol/`**: 노드의 존재 이유이자 동작의 법전인 'Principle Protocol'이 버전별로 보관됩니다.
- **`design-style-guide.md`**: 에이전트가 코드를 작성할 때 참조해야 할 모든 시각적 수치(Padding, Hex, FontSize)가 담겨 있습니다.
- **`brand-guidelines.md`**: `CRE-TE`의 브랜드 무드와 출력물에서 유지해야 할 전문가적 인상을 정의합니다.

### 📂 project.10_print/lib/ — Shared Logic
- **`prompt.ts`**: Protocol과 Knowledge Docs를 조합하여 AI가 이해할 수 있는 최적의 지시문으로 변환하는 역할을 합니다.
- **`export.ts`**: 브라우저 렌더링 결과를 실제 종이 규격에 맞는 고해상도 품질로 전환하는 전문 로직을 담당합니다.
- **`types.ts`**: `NodeContract`, `DocumentMode` 등 시스템 전반의 정적 타입을 정의하여 코드의 안전성을 보장합니다.

---

## 4. 아키텍처 불변성 유지 (Invariants)

1.  **문서 주도 개발 (Doc-Driven)**: 모든 코드는 `docs/` 및 `_context/` 내의 설계서에 명시된 기준을 먼저 만족해야 합니다.
2.  **프로토콜 우선**: AI의 출력 형식이나 동작에 문제가 있을 경우, 코드를 수정하기 전에 `_context/protocol/`의 지침을 먼저 개선합니다.
3.  **지식의 구조성**: 각 문서는 상호 참조 관계를 가지며, 중복된 정의를 지양하고 계층에 맞는 위치에 정보를 기록합니다.

---
`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
