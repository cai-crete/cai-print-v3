# Session Change Report — 하네스 초기 구성 전체 변동 보고서

> 작성일: 2026-04-15
> 대상 세션: N10 print 노드 개발 착수 전 하네스 환경 구성 전체 (2026-04-14 ~ 2026-04-15)
> 목적: 초기 상태 대비 변동 사항 전수 기록. 인간 수정과 AI 수정 명확히 구분.

---

## 범례

| 기호 | 의미 |
|------|------|
| 🤖 | AI(Claude Code)가 수행 |
| 👤 | 사용자(인간)가 수행 |
| ✅ | 변경됨 |
| ➖ | 변경 없음 |

---

## 1. 신규 생성 파일

| 파일 | 수행자 | 생성 이유 |
|------|--------|----------|
| `docs/product-specs/N10-print.md` | 🤖 | N10 노드의 Input/Output Contract, Protocol 구성, 컴플라이언스 체크리스트, 알려진 실패 패턴을 AGENT A/B가 참조할 수 있도록 선작성. product-spec 없이 개발 착수하면 NodeContract 미완성 상태가 됨. |
| `project.10_print/_context/protocol/protocol-print-v1.txt` | 🤖 | N10의 AI 행동을 정의하는 Principle Protocol. Loop A 자가 검증(CHECK 1~4 PASS, 추정 토큰 3,553) 완료. 기존 `ai_generation_protocol-v3.2.md`는 행동 정의가 아닌 알고리즘 데이터(Knowledge Doc)였으므로, 역할에 맞는 신규 Principle Protocol 작성. |
| `docs/design-docs/review-guide.md` | 🤖 | 오류 검토 보고서 작성 표준 정의. 3단계 프로세스(검토→승인→체크), 심각도 기준(CRITICAL/HIGH/MEDIUM/LOW/ADVISORY), 아카이브 규칙 포함. 이 규칙이 없으면 향후 세션마다 보고서 형식이 달라져 일관성이 깨짐. |
| `project.10_print/_context/brand-guidelines.md` | 👤 | AGENT C(디자인 에이전트)가 필수로 로드하는 브랜드 정체성 파일. Error Review v.2에서 HIGH-2 결함으로 식별된 후 사용자가 직접 작성·업로드. 브랜드 비전, 핵심 가치, 로고, 컬러, 보이스앤톤, 물리적 무결성 규칙 포함. |
| `project.10_print/_context/business-context.md` | 👤 | AGENT C가 필수로 로드하는 비즈니스 컨텍스트 파일. Error Review v.2 HIGH-2 결함 식별 후 사용자 작성·업로드. 라스트 마일 문제, 서비스 비전, 타겟 3그룹, 비즈니스 가치 포함. |
| `docs/reviews/Error_Review_Report-v.1-260414.md` | 🤖 | 1차 정합성 검토 보고서. 검토 대상: settings.json, protocol-print-v1.txt, N10-print.md, exec-plan-loop-system.md. 결함 7건(HIGH 1, MEDIUM 2, LOW 4) 발견 및 동일 세션 내 전수 수정 완료. |
| `docs/reviews/Error_Review_Report-v.2-260414.md` | 🤖 | 2차 정합성 검토 보고서. 검토 대상 확장(ARCHITECTURE.md, loop-a/b/c agent 파일, QUALITY_SCORE.md, RELIABILITY.md 추가). 결함 5건(HIGH 2, MEDIUM 2, LOW 1) 발견. 전수 수정 완료. |

---

## 2. 수정된 파일

### 2.1 `.claude/settings.json` ✅ 🤖

**초기 상태:**
```json
"matcher": "Write|Edit",
패턴: protocol-.*\.(txt|md)$
```

**변경 내용 (총 2회):**

1차 수정 (Error Review v.1 전):
- `.md` 파일 미감지 문제 → `.txt`와 `.md` 모두 감지하도록 확장
- `docs/design-docs/protocol-design-guide.md` 오탐 가능성 → 패턴을 `_context/` 경로로 제한
- 셸 이스케이핑 3중 레이어 버그 → `[\/\\]` → `[\/]` 단순화 (JSON→셸→JS 변환 시 정규식 파괴 방지)

2차 수정 (Error Review v.1 HIGH-1 결함):
- 패턴 `_context[\/]protocol.*\.(txt|md)$` → `_context[\/]protocol[\/]protocol-[^\/]+\.(txt|md)$`
- 이유: 기존 패턴이 Knowledge Doc 파일(`ai_generation_protocol-v3.2.md`, `video_generation_protocol.md`, `writer/*.txt` 등)을 모두 감지. Loop A는 Principle Protocol 전용 검증이므로 Knowledge Doc 수정 시 Loop A 경고는 오탐. Principle Protocol 명명 규칙(`protocol-[node]-v[N]`)을 패턴에 직접 반영.

**최종 패턴:** `_context[\/]protocol[\/]protocol-[^\/]+\.(txt|md)$`

---

### 2.2 `docs/product-specs/index.md` ✅ 🤖

**변경 내용:**
- 노드 스펙 목록 테이블에 N10 행 추가 (상태: 작성 완료 2026-04-14)
- `_template` 추적 테이블: `N01~N10 미작성` 단일 행 → `N10 별도 행 + N01~N09 행` 분리

**이유:** N10-print.md 신규 작성에 따른 인덱스 갱신. 인덱스가 현실을 반영하지 않으면 AGENT가 파일 존재를 인식하지 못함.

---

### 2.3 `docs/exec-plans/active/exec-plan-loop-system.md` ✅ 🤖

**변경 내용:**
- Phase 3에 훅 패턴 버그 수정 항목 3건 추가 (`.md` 미감지, 오탐 제거, 셸 이스케이핑)
- Phase 1 N10 Protocol 항목: `[x]` 자가검증 완료 + `[ ]` 독립 에이전트 검증 미완료 항목 분리
  - 이유: 체크박스 하나로 "자가검증 완료"와 "Loop A 에이전트 검증 완료"를 동시에 표현하면 AGENT B가 검증이 완전히 끝났다고 오판할 수 있음
- Surprises & Discoveries: 2건 추가 (Protocol 구조 불일치 발견, 셸 이스케이핑 3중 레이어)
- Decision Log: 6건 추가

---

### 2.4 `AGENTS.md` ✅ 🤖

**변경 내용 (총 3회):**

1차: 세션 유형 테이블에 "정합성 검토" 행 추가
- 우선 로드: `docs/design-docs/review-guide.md` → 검토 대상 파일 전체
- 이유: 정합성 검토 세션 시작 시 에이전트가 보고서 형식과 심각도 기준을 먼저 확립하도록 명시

2차: 디렉터리 구조에 `review-guide.md`, `reviews/` 폴더 추가

3차: `product-specs/` 트리에 `N10-print.md` 추가 (Error Review v.2 LOW-1 결함 수정)
- 이유: 디렉터리 트리가 실제와 불일치하면 에이전트가 파일이 없다고 판단할 수 있음

---

### 2.5 `docs/design-docs/index.md` ✅ 🤖

**변경 내용:**
- 파일 목록, Agent 사용 지침, 읽는 순서에 `review-guide.md` 항목 추가
- 이유: 새 파일이 인덱스에 등록되지 않으면 에이전트가 존재를 인식하지 못해 보고서 작성 시 이 가이드를 로드하지 않음

---

### 2.6 `project.10_print/_context/design-style-guide.md` ✅ 👤 + 🤖

**인간 수행:**
- 파일을 대폭 보완하여 Section 1(서비스 개요), Section 3(컬러 팔레트), Section 4(레이아웃), Section 5(간격), Section 7(브랜드 요소), Section 8(인터랙션), Section 9(앱 UI 레이아웃) 작성
- 파일명 변경: `design_style_guide.md`(언더스코어) → `design-style-guide.md`(하이픈) — Error Review v.2 HIGH-1 결함 수정

**AI 수행 (보완):**
- Section 1: VIDEO 모드 스펙 상세(16:9, 8초, Veo 3.1 lite, 2장 필수) 추가
- Section 2.2 신규: PANEL 전용 텍스트 클래스 속성 테이블 (`t-heavy`/`t-medium`/`t-light` 행간·자간·정렬)
- Section 6 전면 재작성: REPORT(헤더 슬롯 + 캡션 슬롯 + 레이아웃 4종), DRAWING(도각 10개 섹션 실측), PANEL(그리드 구조) 상세 명세

---

### 2.7 `project.10_print/_context/protocol/protocol-print-v1.txt` ✅ 🤖

**변경 내용 (수정 1회):**
- COMPLIANCE CHECK Post-generation의 Step 1, Step 2 항목에 `(VIDEO 모드는 이 항목 적용 제외)` 주석 추가
- 이유: AGENT B가 VIDEO 모드 실행 결과를 검증할 때, Step 1·2 미실행을 결함으로 오판하는 것을 방지 (VIDEO는 OCR/masterData 단계 불필요)

---

### 2.8 `ARCHITECTURE.md` ✅ 🤖

**변경 내용:**
- 레이어 표 API Route, AI Core 행 수정: "Claude API" → "AI API(N10 예외 → 아래 참조)"
- N10 전용 API 테이블 추가: REPORT/PANEL/DRAWING → Gemini(`gemini-2.5-pro`), VIDEO → Veo(`models/veo-3.1-lite-generate-preview`)
- 데이터 흐름 3종 분리: 표준 노드(Claude), N10 문서 생성(Gemini), N10 VIDEO(Veo)
- TypeScript 예시 코드 3종 추가 (Claude / Gemini / Veo 각각)

**이유:** N10은 Claude API를 사용하지 않는다는 아키텍처 결정을 AGENT A가 인지하지 못한 채 개발하면 잘못된 API 경로로 구현됨. buildSystemPrompt()의 역할은 동일하나 전달 대상 API가 다름을 명시.

---

### 2.9 `docs/product-specs/N10-print.md` ✅ 🤖

**변경 내용 (총 4회):**

1차: `pageCount` 필드 — DRAWING 모드 처리 명시 (단일 페이지 고정, 비활성화)

2차: Protocol 구성 테이블 — `ai_generation_protocol-v3.2.md` 항목의 "잠정" → "Principle Protocol 재작성 전 참조용"

3차: buildSystemPrompt() 규칙 테이블 하단에 VIDEO Veo API 아키텍처 특이사항 주석 추가

4차: VIDEO/REPORT/PANEL/DRAWING 모두 Google API 사용으로 확정 후 API 아키텍처 주석 통합 업데이트

---

### 2.10 `docs/references/loop-b-verification-agent.txt` ✅ 🤖

**변경 내용:**
Phase V3 Implementation Check 재구성:
- `buildSystemPrompt()` 체크: "Claude API system 파라미터" → "적절한 AI API로 전달" (범용화)
- `API Route` 체크: "system 파라미터" → "Prompt 파라미터" (범용화)
- N10 전용 블록 신규 추가: REPORT/PANEL/DRAWING(Gemini 체크 3항목) + VIDEO(Veo 체크 5항목)
- Security: `ANTHROPIC_API_KEY` → `GOOGLE_API_KEY`(N10) / `ANTHROPIC_API_KEY`(기타) 분리

**이유:** 기존 체크리스트는 Claude API 전용. N10은 Gemini/Veo 사용이므로, 검증 에이전트가 Claude API 미사용을 "결함"으로 오판하거나 Veo API 연결을 검증하지 않는 문제 발생 가능.

---

## 3. 변경 없는 파일

| 파일 | 변경 없는 이유 |
|------|--------------|
| `docs/QUALITY_SCORE.md` | 검토 결과 구조·내용 모두 정합. PCS 기준, Loop A 연동 섹션, 공통 체크리스트 템플릿 이상 없음. |
| `docs/RELIABILITY.md` | §7, §8 참조 링크 실존 확인. API 안정성·Protocol 무결성 기준 이상 없음. |
| `docs/SECURITY.md` | 검토 범위 포함됐으나 결함 없음. |
| `docs/design-docs/core-beliefs.md` | 철학적 기반 문서. 이번 세션(환경 구성)과 관련 없음. |
| `docs/design-docs/protocol-design-guide.md` | §7(검증 파이프라인), §8(오염 감지 대응) 실존 확인. RELIABILITY.md 참조 링크 유효. 내용 이상 없음. |
| `docs/references/loop-a-verification-agent.txt` | Loop A 검증 기준 정상. 실제 적용은 Loop B 진입 전 별도 세션에서 수행 예정. |
| `docs/references/loop-b-execution-agent.txt` | 구조 및 내용 정합. AGENT A 세션 시작 절차, 핸드오프 형식 이상 없음. |
| `docs/references/loop-c-design-agent.txt` | 파일 경로 참조 수정은 불필요 (이미 `design-style-guide.md` 하이픈 사용). `brand-guidelines.md`, `business-context.md` 미존재는 사용자 파일 업로드로 해결됨. 파일 자체 수정 불필요. |
| `project.10_print/_context/protocol/ai_generation_protocol-v3.2.md` | Knowledge Doc으로 재분류(역할 변경). 내용 자체는 고품질이므로 수정 불필요. 파일 위치 유지. |
| `project.10_print/_context/protocol/video_generation_protocol.md` | Knowledge Doc(VIDEO 모드 전용)으로 재분류. 내용 유지. |
| `project.10_print/_context/protocol/writer/*` (7개 파일) | Knowledge Doc(작가 스타일 지침). 내용 이상 없음. |
| `project.10_print/sources/*` | 참조 원본 디렉터리. 직접 수정 금지 원칙에 따라 변경 없음. 개발 시 변환 대상. |
| `docs/exec-plans/active/exec-plan-template.md` | 템플릿 파일. 이번 세션 대상 아님. |
| `docs/exec-plans/tech-debt-tracker.md` | 기술 부채 없음. |
| `docs/PLANS.md`, `docs/PRODUCT_SENSE.md`, `docs/FRONTEND.md`, `docs/DESIGN.md` | 이번 세션 범위(하네스 구성) 외. 개발 착수 시 AGENT A/C가 참조. |
| `README.md`, `ARCHITECTURE.md`(구조 외 섹션) | 코드맵, 노드 목록, 불변식, 횡단 관심사 — 변경 없음. N10 예외 사항만 추가됨. |

---

## 4. 전체 변동 요약

| 구분 | 건수 | 수행자 |
|------|------|--------|
| 신규 파일 생성 | 7개 | 🤖 5개 / 👤 2개 |
| 기존 파일 수정 | 10개 | 🤖 9개 / 👤+🤖 1개 (design-style-guide) |
| 변경 없음 | 20개+ | — |

---

## 5. 아키텍처 결정 사항 (이번 세션에서 확정된 핵심 결정)

| 결정 | 결정 주체 | 근거 |
|------|----------|------|
| N10은 Claude API를 사용하지 않음 | 👤 사용자 | REPORT/PANEL/DRAWING → Gemini, VIDEO → Veo |
| Gemini 모델: `gemini-2.5-pro` | 🤖 AI 제안 → 👤 묵시적 승인 | 문서 생성 복잡도에 최적화된 Google 최신 모델 |
| Principle Protocol vs Knowledge Doc 분리 | 🤖 제안 → 👤 승인 | `ai_generation_protocol-v3.2.md`는 알고리즘 데이터로 Knowledge Doc 역할에 해당 |
| Product-spec 선작성 후 Protocol 작성 순서 확립 | 🤖 제안 → 👤 승인 | Contract 없이 Protocol 작성 시 Immutable Constants 오정의 위험 |
| 훅 감지 범위를 `_context/protocol/protocol-*` 로 제한 | 🤖 제안 → 👤 승인 | Knowledge Doc 수정 시 Loop A 경고 불필요 |

---

## 6. 개발 착수 전 잔존 항목

| 항목 | 수행 시점 | 담당 |
|------|----------|------|
| Loop A 독립 에이전트 검증 (`loop-a-verification-agent.txt` 적용) | Loop B 진입 전 | AGENT B |
| `app/`, `lib/`, `components/` 디렉터리 생성 및 코드 구현 | 개발 세션 시작 시 | AGENT A + AGENT C |
| `.env.local` 파일 생성 및 `GOOGLE_API_KEY` 등록 | 개발 환경 구성 시 | 👤 사용자 |

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`