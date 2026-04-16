# Exec Plan — 이중 루프 시스템 구축

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 하네스 인프라 신규 구축
- **대상 노드**: 공통 (모든 노드에 적용)
- **시작일**: 2026-04-14

---

## 목표

Protocol 업로드 시 정합성·간결성을 자동 검증하는 **Loop A**,
그리고 실행 에이전트와 검증 에이전트가 상호 견제하며 하네스를 자가 보완하는 **Loop B**를 구축한다.
두 루프가 완성되면 하네스는 외부 수동 검수 없이 스스로 품질을 끌어올릴 수 있는 자율 개선 구조를 갖춘다.

---

## 현재 상태 분석

| 항목 | 현재 | 목표 |
|------|------|------|
| Stage A1 → A2 → B 파이프라인 | 존재 (수동, 선형) | 자동 루프로 전환 |
| 실행-검증 피드백 | 없음 | Loop B로 구축 |
| Protocol 정합성 자동 검증 | 없음 | Loop A로 구축 |
| 자가 보완 메커니즘 | 없음 | Loop A + B 연동 |

---

## Loop A — Protocol 정합성 테스트 루프

### 목적
Protocol 파일 업로드 시 구조적 완결성·간결성·내부 일관성을 자동 검증한다.
추후 업로드할 프로토콜이 정합하고 간결한 상태로만 배포 단계에 진입하도록 보장한다.

### 트리거
- 새 Protocol 파일(`protocol-[node-name]-v[N].txt`)이 `_context/`에 업로드될 때
- Protocol 버전 업 시 (`v[N]` → `v[N+1]`)

### 루프 흐름

```
[Protocol 파일 업로드]
        ↓
┌─── 정합성 검증 에이전트 ─────────────────────────────┐
│                                                     │
│  CHECK 1: 구조 완결성                               │
│    → 5개 필수 섹션 존재 여부                         │
│       (SYSTEM, GOAL, CONTEXT, ROLE,                 │
│        ACTION PROTOCOL, COMPLIANCE CHECK)           │
│                                                     │
│  CHECK 2: 간결성                                    │
│    → 토큰 수 ≤ 모델 컨텍스트의 25%                  │
│    → 중복 지시 없음 (동일 내용 반복 탐지)            │
│                                                     │
│  CHECK 3: 내부 일관성                               │
│    → ACTION PROTOCOL ↔ COMPLIANCE CHECK 정합성      │
│    → Failure Mode가 모든 경계 조건을 커버하는가      │
│    → Knowledge Doc과의 충돌 없음                    │
│                                                     │
│  CHECK 4: 오염 저항성 (Stage A2)                    │
│    → 별도 AI 세션에서 결함 탐지                     │
│    → 점수 ≥ 90 → 통과 / 점수 < 90 → 결함 보고      │
│                                                     │
└──────────────────────────────────────────────────────┘
        ↓ 결함 발견
[수정 권고 보고서 생성]
        ↓
[Protocol 수정] → 루프 재진입
        ↓ 전체 통과
[배포 승인 → Stage B 진입 허가]
```

### 검증 에이전트 프롬프트 구조 (Loop A)

```
역할: 당신은 Protocol 정합성 검증 에이전트입니다.
대상: {protocol_file_path}
기준: docs/design-docs/protocol-design-guide.md §4 (필수 구조), §6 (오염 패턴)
      docs/QUALITY_SCORE.md (PCS 기준)

수행할 것:
1. 5개 필수 섹션 존재 여부를 체크하고 누락 항목을 명시하라
2. 토큰 수를 추정하고 25% 한계 초과 여부를 판단하라
3. ACTION PROTOCOL의 각 Step에 대응하는 COMPLIANCE CHECK 항목이 있는지 확인하라
4. 모든 경계 조건(Failure Mode)이 명시되어 있는지 확인하라
5. 결함이 있으면 구체적 수정 방향을 제시하라 — 모호한 권고 금지

출력 형식:
- PASS / FAIL 판정
- 결함 목록 (위치, 유형, 수정 방향)
- 수정 후 재검증 필요 여부
```

### 루프 종료 조건
- CHECK 1~4 전체 PASS
- PCS 점수 ≥ 90 (Stage A2 기준)

---

## Loop B — 실행-검증 이중 견제 루프

### 목적
실행 에이전트(Protocol 작성 + 앱 구현)와 검증 에이전트(품질 기준 검증)가
상호 견제하며 하네스 스스로 보완·업그레이드하는 자율 개선 구조를 만든다.

### 에이전트 역할 분리

| 에이전트 | 역할 | 금지 사항 |
|----------|------|-----------|
| **실행 에이전트** | Protocol 작성, Next.js 앱 구현, Protocol 수정 | 자체 검증 없이 배포 승인 불가 |
| **검증 에이전트** | QUALITY_SCORE 기준 검증, Stage A/B 실행, 실패 보고서 생성 | 직접 수정 불가 — 보고만 한다 |

### 루프 흐름

```
[세션 시작: 노드 개발 또는 Protocol 수정]
        ↓
┌─── 실행 에이전트 ────────────────────┐
│  1. product-spec 확인                │
│  2. Protocol 작성 / 수정             │
│  3. buildSystemPrompt() 구현         │
│  4. Node App 완성                    │
└──────────────────────────────────────┘
        ↓ 구현 완료 선언
┌─── 검증 에이전트 ────────────────────┐
│  1. Loop A 실행 (Protocol 정합성)    │
│  2. QUALITY_SCORE.md 체크리스트 실행 │
│  3. Stage B 동적 테스트 실행         │
│  4. 실패 케이스 목록 + 원인 분석     │
│  5. 수정 우선순위 보고서 생성        │
└──────────────────────────────────────┘
        ↓ 실패 항목 존재
[실행 에이전트에 보고서 전달]
        ↓
[실행 에이전트: 실패 원인 진단 → Protocol 또는 코드 수정]
        ↓
[검증 에이전트: 실패 케이스만 재검증]
        ↓ 루프 반복
        ↓ 전체 Pass
[배포 승인 → 버전 태그 → exec-plan Progress 업데이트]
```

### 검증 에이전트 보고서 형식

```markdown
## 검증 보고서 — {노드명} {날짜}

### PCS 점수: {점수} / 100

### 실패 항목
| 체크 항목 | 실패 유형 | 원인 레이어 | 수정 우선순위 |
|-----------|-----------|------------|--------------|
| [항목]    | [유형]    | A/B/C      | HIGH/MID/LOW |

### 원인 레이어 분류
- A: API 호출 레이어 (system 파라미터 주입 문제)
- B: Protocol 구조 문제 (Step 누락, Failure Mode 부재)
- C: Protocol 언어 문제 (지시 모호성)

### 다음 실행 에이전트 수정 범위
- [ ] [구체적 수정 항목 1]
- [ ] [구체적 수정 항목 2]
```

### 루프 종료 조건
- PCS = 100
- Stage B 전체 Pass
- 실패 케이스 0건

---

## 두 루프의 연동 관계

```
신규 Protocol 업로드
        ↓
    Loop A 실행
        ↓ Pass
    Loop B 실행 (실행 에이전트가 Loop A 통과 Protocol을 기반으로 앱 구현)
        ↓
    검증 에이전트가 Loop A를 내부적으로 재실행 (Protocol 수정이 있었을 경우)
        ↓ 전체 Pass
    배포 승인
```

Loop A는 Loop B의 전제 조건입니다.
Loop B 중 Protocol 수정이 발생하면 Loop A가 자동으로 재실행됩니다.

---

## 구현 단계

### Phase 1: Loop A 프롬프트 파일 작성 (수동 실행 단계)

- [x] 2026-04-14 — 검증 에이전트 프롬프트를 `docs/references/loop-a-verification-agent.txt`로 작성
- [x] 2026-04-14 — 검증 체크리스트를 `QUALITY_SCORE.md`의 공통 체크리스트와 연동 (Loop A 연동 섹션 추가)
- [x] 2026-04-14 — `AGENTS.md` 작업 전/후 체크리스트에 Loop A 진입 조건 명시
- [x] 2026-04-14 — N10 print 노드 최초 Protocol(`protocol-print-v1.txt`) 작성 및 자가 검증 완료
      CHECK 1~4 자가 PASS. Failure Mode 5개. 추정 토큰 3,553 / 50,000 한도.
- [x] 2026-04-15 — N10 Protocol — `loop-a-verification-agent.txt` 기반 독립 에이전트 검증 완료
      CHECK 1~4 독립 PASS. 차단 결함 0건. Advisory 2건(비차단).
      보고서: `docs/exec-plans/active/loop-a-report-print-v1.md`

### Phase 2: Loop B 워크플로우 문서화 및 수동 실행

- [x] 2026-04-14 — AGENTS.md의 `작업 후 체크리스트`에 Loop B 보고서 0건 확인 항목 명시
- [x] 2026-04-14 — `docs/references/loop-b-execution-agent.txt` 작성 (실행 에이전트 프롬프트)
- [x] 2026-04-14 — `docs/references/loop-b-verification-agent.txt` 작성 (검증 에이전트 프롬프트)
- [x] 2026-04-14 — AGENTS.md 세션 유형 테이블에 Loop B 실행·검증 에이전트 항목 추가
- [x] 2026-04-15 — N10 print 노드 앱 초기화 완료 (Loop B 진입)
      Next.js 15 + React 19 + Tailwind v4 + @google/genai 설치
      빌드 검증 완료 (next build ✓)
      구현 파일: app/layout.tsx, app/page.tsx, lib/prompt.ts
- [x] 2026-04-15 — N10 1차 구현 완료 (Google 에이전트 + 정합성 검토 후 수정)
      구현: app/api/print/route.ts (Gemini 2.5 Pro 연동), app/page.tsx (기능 연결),
             app/components/VideoTemplate.tsx, .env.local (GOOGLE_AI_API_KEY)
      수정: CRITICAL-1 API 키 명시적 전달, HIGH-1 Generate 버튼 동작, HIGH-2 VideoTemplate 경로,
             MEDIUM-1 VIDEO 501 응답 교체
      보고서: docs/reviews/Error_Review_Report-v.4-260415.md (9건, 4건 수정)
- [x] N10 Loop B 수동 실행 대기 완료 (개발 착수)
- [x] 2026-04-15 — Stage 0 완료
      RELIABILITY.md 기준 충족: timeout 30s, 재시도 2회 지수 백오프
      SECURITY.md 기준 충족: 이미지 10MB, 텍스트 2000자 검증
      SKILL.md 경로 수정 (docs/references/ → docs/)
      Loop B Iteration 1 핸드오프 파일 작성: loop-b-handoff-n10-print.md
      → AGENT B Iter 1: FAIL (HIGH — 서버사이드 MIME 검증 누락, LOW — gif 허용)
         수정: ALLOWED_MIME_TYPES 추가, page.tsx accept 정정
      → AGENT B Iter 2: PASS — DEPLOYMENT APPROVED
         V1 Loop A PASS / V2 PCS 100 / V3 PASS / V3.5 blocking 0건 / V4 3케이스 PASS
         보고서: docs/exec-plans/active/loop-b-report-n10-print-2026-04-15-iter2.md
      Stage 0 완결. Stage 1 진입.
- [x] 2026-04-16 — Stage 1 완료 — HTML 템플릿 → Gemini 레이아웃 참조 연동
      lib/prompt.ts: `loadTemplate(mode)` 추가 — REPORT/PANEL/DRAWING 모드별 HTML 템플릿 로드
      route.ts: `loadTemplate` import + `[LAYOUT TEMPLATE]` 블록을 userText에 주입
      VIDEO 모드는 templatePart 없이 userText 그대로 전달 (Veo API, 템플릿 없음)
      빌드 검증 완료 (next build ✓) — 타입 오류 0건
      핸드오프 파일 갱신: loop-b-handoff-n10-print.md (Iteration 2 → Stage 1 완료 반영)
- [x] 2026-04-16 — Stage 2 완료 — 문서 렌더링 (모드별 물리 치수 기반 자동 스케일링)
      globals.css: 누락 CSS 토큰 5개 추가 (--sidebar-spacing 치명적 누락 포함)
      DocumentFrame.tsx 신규 생성: ResizeObserver + iframe srcDoc 자동 스케일링 렌더러
        - scale = min(aw/docW, ah/docH) × 0.97
        - DOC_SIZE: REPORT/DRAWING(1587×1122), PANEL_L(4494×3179), PANEL_P(3179×4494), VIDEO(1280×720)
      ReportTemplate/PanelTemplate/DrawingTemplate → DocumentFrame 위임으로 재작성
      Canvas.tsx: artboard h-full 전환, maxWidth 제거
      PreviewStrip.tsx: 모드별 썸네일 스케일 동적 계산 (min(80/docW, 64/docH))
      page.tsx: PreviewStrip에 mode/orientation props 전달
      .env.local: UTF-16 LE → UTF-8 재인코딩 (500 오류 근본 원인 수정)
        GOOGLE_AI_API_KEY 미파싱 → Gemini API 401 → 서버 500
      빌드 검증 완료 (next build ✓) — 타입 오류 0건
      핸드오프 파일 갱신: loop-b-handoff-n10-print.md (Iteration 3, Stage 2 반영)

### Phase 3: 자동화

- [x] 2026-04-14 — `.claude/settings.json` PostToolUse 훅 작성
      Protocol 파일(`protocol-*.txt`) 수정 시 Loop A 필수 실행 경고를 에이전트 컨텍스트에 자동 주입
      파이프 테스트 완료 (매칭 ✓, 비매칭 침묵 ✓), Node.js 구문 검증 완료
- [x] 2026-04-14 — 훅 패턴 버그 수정 및 확장
      기존 패턴(`protocol-.*\.txt`)의 문제 3가지 수정:
      ① `.md` 파일 미감지 → `.txt`·`.md` 모두 감지
      ② `docs/design-docs/protocol-design-guide.md` 오탐 가능성 → `_context/` 경로 제한으로 제거
      ③ 셸 double-quote 내 `\\` 이스케이핑 오류(`[\/\\]` → `[\/\]` 무효 정규식) → `[\/]` 단순화
      최종 패턴: `_context[\/]protocol.*\.(txt|md)$`
      실제 훅 파이프 전달 테스트 전 케이스 8개 전부 통과
- [x] 2026-04-14 — Loop B 검증 에이전트 서브에이전트 분리 설계 완료
      `loop-b-verification-agent.txt` → Execution Agent가 Agent 툴로 스폰
      핸드오프 파일(loop-b-handoff-[node].md) ↔ 보고서(loop-b-report-[node]-iter[N].md) 교환 구조 확립
- [x] 2026-04-14 — 루프 종료 조건 자동 판정 로직 확립
      보고서 내 "DEPLOYMENT APPROVED" 문자열 존재 여부로 판정
      최대 5회 반복 후 미통과 시 인간 검수 에스컬레이션

> ⚠️ 훅 활성화: `/hooks` 메뉴를 한 번 열거나 세션 재시작 시 settings.json이 로드됩니다.

---

## Surprises & Discoveries

- 기존 `ai_generation_protocol-v3.2.md`가 Loop A 필수 구조(SYSTEM/GOAL/CONTEXT/ROLE/ACTION PROTOCOL/COMPLIANCE CHECK)를 전혀 따르지 않고 있었음. 내용 품질은 높으나 하네스 구조와 완전히 불일치. Knowledge Doc으로 재분류하고 신규 Principle Protocol을 별도 작성하는 것으로 해결.
- `settings.json` 훅 패턴의 셸 이스케이핑이 JSON → 셸 double-quote → JS 정규식 3중 레이어를 통과하며 의도치 않게 변형됨. `\\` 4개가 셸을 거치면 `\` 1개가 되어 정규식이 깨지는 구조. 단순화가 정답 (`[\/\\]` → `[\/]`).

---

## Decision Log

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-14 | Loop A를 Loop B의 전제 조건으로 설계 | Protocol 정합성 없이 앱 구현을 시작하면 Loop B에서 동일 결함이 반복 발생하기 때문 |
| 2026-04-14 | 검증 에이전트는 수정 권한 없이 보고만 함 | 실행-검증 역할 혼재 시 책임 소재 불명확, 견제 구조 붕괴 가능성 |
| 2026-04-14 | 훅 감지 패턴을 `_context/` 경로로 제한 | `docs/design-docs/protocol-design-guide.md` 등 하네스 가이드 문서가 오탐될 수 있었음. Protocol 파일은 항상 `_context/` 하위에 위치한다는 불변식을 패턴에 반영 |
| 2026-04-14 | 기존 `ai_generation_protocol-v3.2.md`를 Principle Protocol이 아닌 Knowledge Doc으로 재분류 | 파일 내용이 행동 정의(Principle Protocol)가 아닌 알고리즘 상세(Knowledge Doc)에 해당. 내용 재작성 없이 역할만 재분류하여 기존 작업 보존 |
| 2026-04-14 | N10 product-spec 선작성 후 Principle Protocol 작성 순서 확립 | product-spec의 Input/Output Contract가 확정되어야 Protocol의 Immutable Constants와 Failure Mode를 정확히 정의할 수 있음. 역순 작성 시 Protocol이 계약과 불일치할 위험 |
| 2026-04-14 | Principle Protocol Immutable Constants에 '건물 기하학 보존' 항목 추가 (총 6개) | Loop A CHECK 4 Pattern 2(Geometry Modification) 방어를 위해 필요. 내러티브 텍스트도 이미지에 없는 구조 요소를 추가할 수 있는 오염 경로임 |

---

## Outcomes & Retrospective

- **원래 목표 달성 여부**: [ ] Yes  [ ] Partial  [ ] No
- **결과 요약**: (완료 후 작성)
- **다음 작업에 반영할 것**: (완료 후 작성)

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
