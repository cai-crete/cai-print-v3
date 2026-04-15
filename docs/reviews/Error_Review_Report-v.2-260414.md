# Error Review Report — v.2

> 작성일: 2026-04-14
> 검토 범위: N10 print 노드 개발 착수 전 하네스 전체 정합성 검토 (v.1 수정 완료 후)
> 검토자 역할: 시니어 개발 전문가 (독립 정합성 검토)

---

## 개요

v.1 보고서 결함 7건 전원 수정 완료 후, **개발 착수 가능 여부**를 기준으로 하네스 전체를 재검토했다.
이번 검토에서는 v.1에서 다루지 않은 파일(ARCHITECTURE.md, loop-b/c agent 파일, QUALITY_SCORE.md, RELIABILITY.md)까지 포함하여 교차 참조 오류를 중점 점검했다.

검토 대상 파일:

| 파일 | 유형 |
|------|------|
| `AGENTS.md` | 에이전트 헌법 |
| `ARCHITECTURE.md` | 기술 구조 지도 |
| `docs/references/loop-b-execution-agent.txt` | 실행 에이전트 지침 |
| `docs/references/loop-b-verification-agent.txt` | 검증 에이전트 지침 |
| `docs/references/loop-c-design-agent.txt` | 디자인 에이전트 지침 |
| `docs/QUALITY_SCORE.md` | 품질 기준 |
| `docs/RELIABILITY.md` | 안정성 기준 |
| `docs/design-docs/protocol-design-guide.md` | Protocol 표준 |
| `project.10_print/_context/design_style_guide.md` | 디자인 스타일 가이드 |

---

## 결함 목록

### [HIGH-1] design_style_guide.md 파일명 불일치 — AGENT C 로드 실패

**파일**: `AGENTS.md`, `docs/references/loop-c-design-agent.txt`
**위치**:
- `AGENTS.md` 세션 유형 테이블 "정합성 검토" 행
- `loop-c-design-agent.txt` Step 2, 4번 항목

**현상**:
두 파일 모두 `design-style-guide.md`(하이픈)를 참조하지만 실제 파일은 `design_style_guide.md`(언더스코어)다.

```
참조 경로: project.XX/_context/design-style-guide.md   ← 존재하지 않음
실제 파일: project.10_print/_context/design_style_guide.md  ← 언더스코어
```

**영향**: AGENT C(디자인 에이전트)가 세션 시작 시 디자인 스타일 가이드를 로드하지 못한다. 이 파일이 없으면 AGENT C는 컬러 토큰·타이포그래피·슬롯 명세 없이 UI를 구현하게 되어 설계 의도와 다른 컴포넌트가 생산된다.

**처방**: 참조 경로를 `design_style_guide.md`(언더스코어)로 통일한다.

---

### [HIGH-2] loop-c-design-agent.txt가 미존재 파일 2개를 필수 로드 항목으로 참조

**파일**: `docs/references/loop-c-design-agent.txt`
**위치**: `SESSION START PROCEDURE` Step 2, 3번·5번 항목

**현상**:
```
3. project.XX/_context/brand-guidelines.md   ← 미존재
5. project.XX/_context/business-context.md   ← 미존재
```
`project.10_print/_context/`에 두 파일이 없다.

**영향**: AGENT C가 세션 시작 시 "파일 없음"을 만나 컨텍스트 로드가 불완전한 상태로 구현을 시작하거나 중단한다. 브랜드 아이덴티티·타겟 세그먼트 정보 없이 UI가 구현되면 브랜드 컴플라이언스 체크리스트를 통과할 수 없다.

**처방**:
두 파일을 AGENT C 개발 세션 전까지 `project.10_print/_context/`에 생성해야 한다. 내용은 최소한 아래를 포함해야 한다.

- `brand-guidelines.md`: 서비스 브랜드명, 색상 정체성, 타이포그래픽 방향, 금지 표현
- `business-context.md`: 대상 사용자, 경쟁 포지션, 핵심 사용 시나리오

> **비고**: 이 두 파일의 작성은 AGENT A/B가 아닌 사용자(기획자)의 입력이 필요하다. 따라서 본 보고서에서 자동 생성하지 않고 작성 필요 사실만 기록한다.

---

### [MEDIUM-1] ARCHITECTURE.md에 VIDEO 모드 이중 API 구조 미기술

**파일**: `ARCHITECTURE.md`
**위치**: `## 데이터 흐름` 섹션

**현상**:
데이터 흐름이 Claude API 단일 경로만 정의한다. N10 VIDEO 모드는 이 흐름과 다른 아키텍처를 가진다.

```
현재 정의된 흐름:
buildSystemPrompt() → Claude API → 응답 수신 → UI 렌더링

VIDEO 모드의 실제 흐름:
buildSystemPrompt() → Veo API 프롬프트 구성
                    → Google Veo 3.1 lite API 호출 (models/veo-3.1-lite-generate-preview)
                    → operation.video.uri 수신
                    → videoUri 바인딩 → UI 렌더링
```

**영향**: AGENT A가 ARCHITECTURE.md를 기준으로 VIDEO 모드를 구현할 때, Claude API 경로로 잘못 구현할 위험이 있다. `buildSystemPrompt()` 함수 시그니처도 VIDEO 모드에서 반환하는 프롬프트의 용도가 달라지므로 아키텍처 주석이 없으면 오구현된다.

**처방**:
`## 데이터 흐름` 섹션에 VIDEO 모드 분기 흐름을 추가한다.

```markdown
**VIDEO 모드 분기 흐름 (N10 전용):**
buildSystemPrompt()는 Veo API용 프롬프트를 반환한다 (Claude API system 파라미터 아님).
실제 영상 생성은 Google Veo 3.1 lite API를 통해 수행된다.
Claude API는 이 모드에서 사용되지 않는다.
```

---

### [MEDIUM-2] loop-b-verification-agent.txt Phase V3에 VIDEO 모드(Veo API) 검증 항목 없음

**파일**: `docs/references/loop-b-verification-agent.txt`
**위치**: `--- PHASE V3: IMPLEMENTATION CHECK ---` 섹션

**현상**:
Phase V3 체크리스트가 Claude API 호출 패턴만 검증한다.

```
[ ] system parameter is set using buildSystemPrompt()
[ ] Protocol is loaded from _context/ directory
[ ] API timeout set to ≤ 30s
...
```

N10 VIDEO 모드의 Veo API 호출(`models/veo-3.1-lite-generate-preview`)은 이 체크 항목에 해당 사항이 없다.

**영향**:
- AGENT B가 N10의 VIDEO 구현을 검증할 때, Veo API 호출 경로가 존재하지 않는 경우에도 V3 PASS를 발급할 수 있다 (검증 누락).
- 반대로, VIDEO 모드에서 Claude API `system` 파라미터를 사용하지 않는 정상 구현을 결함으로 오판할 수 있다.

**처방**:
V3 체크리스트 하단에 `N10 VIDEO 모드 전용` 항목을 조건부로 추가한다.

```
  N10 VIDEO 모드 (해당 노드에만 적용):
  [ ] VIDEO 분기에서 buildSystemPrompt()가 Veo API용 프롬프트를 반환하는가
  [ ] Veo API 호출이 Claude API가 아닌 별도 경로로 분기되는가
  [ ] videoUri가 operation.video.uri에서 바인딩되는가
  [ ] VIDEO 모드에서 Claude API system 파라미터가 사용되지 않는가
```

---

### [LOW-1] AGENTS.md 디렉터리 트리에 N10-print.md 미등재

**파일**: `AGENTS.md`
**위치**: `## 디렉터리 구조` > `product-specs/` 섹션

**현상**:
```markdown
└── product-specs/
    ├── index.md                  ← 노드 스펙 인덱스
    └── node-spec-template.md     ← 노드 스펙 작성 템플릿
```
`N10-print.md`가 트리에 없다.

**영향**: 낮음. 신규 에이전트가 디렉터리 트리만 보고 N10 product-spec이 없다고 판단할 수 있다.

**처방**: 트리에 `N10-print.md` 항목 추가.

---

## 결함 요약

| ID | 심각도 | 파일 | 내용 요약 | 처방 난이도 |
|----|--------|------|----------|-----------|
| HIGH-1 | HIGH | `AGENTS.md`, `loop-c-design-agent.txt` | `design-style-guide.md` 하이픈 → 언더스코어 통일 | 낮음 (경로 수정) |
| HIGH-2 | HIGH | `loop-c-design-agent.txt` | `brand-guidelines.md`, `business-context.md` 미존재 | 높음 (사용자 입력 필요) |
| MEDIUM-1 | MEDIUM | `ARCHITECTURE.md` | VIDEO 모드 Veo API 분기 흐름 미기술 | 낮음 (텍스트 추가) |
| MEDIUM-2 | MEDIUM | `loop-b-verification-agent.txt` | V3 체크리스트에 Veo API 검증 항목 없음 | 낮음 (항목 추가) |
| LOW-1 | LOW | `AGENTS.md` | 디렉터리 트리에 N10-print.md 미등재 | 낮음 (한 줄 추가) |

---

## 긍정 항목 (잘 된 것)

1. **code-reviewer 스크립트 파일 실존 확인**: `loop-b-verification-agent.txt`가 참조하는 Python 스크립트 3개 (`code_quality_checker.py`, `pr_analyzer.py`, `review_report_generator.py`)가 `.claude/skills/code-reviewer/scripts/`에 모두 존재함.

2. **protocol-design-guide.md §7, §8 실존 확인**: `RELIABILITY.md`가 참조하는 §7(Protocol 검증 파이프라인), §8(오염 감지 후 대응 절차)이 실제로 존재하며 내용이 충실함.

3. **Loop A–Loop B 연동 구조 완결**: `loop-a-verification-agent.txt` → `loop-b-verification-agent.txt` V1 단계 참조 체계가 정합하게 구성됨.

4. **설계 스타일 가이드 개발 착수 수준 완성**: Section 1~9 전체, 3개 모드의 슬롯 명세, VIDEO 스펙까지 기술되어 AGENT C가 독립적으로 컴포넌트를 구현할 수 있는 수준.

---

## 권고 사항

### 즉시 수정 가능 (에이전트가 자동 수정)
- HIGH-1: 경로 수정 (파일명 하이픈 → 언더스코어)
- MEDIUM-1: ARCHITECTURE.md에 VIDEO 분기 흐름 텍스트 추가
- MEDIUM-2: loop-b-verification-agent.txt V3에 Veo API 체크 항목 추가
- LOW-1: AGENTS.md 디렉터리 트리 갱신

### 사용자 입력 필요 (개발 착수 전 작성 요청)
- HIGH-2: `brand-guidelines.md`, `business-context.md` 내용 제공 후 파일 생성
  → AGENT C 개발 세션 전까지 미작성 시 디자인 에이전트가 브랜드 기반 없이 구현

---

## 전체 판정

| 구분 | 결과 |
|------|------|
| CRITICAL 결함 | 0건 |
| HIGH 결함 | 2건 |
| MEDIUM 결함 | 2건 |
| LOW 결함 | 1건 |
| **개발 착수 가능 여부** | **전체 5건 수정 완료. AGENT A(실행 에이전트) 및 AGENT C(디자인 에이전트) 모두 착수 가능.** |

---

## 수정 체크리스트

- [x] [HIGH-1] `design_style_guide.md` → `design-style-guide.md` 파일명 통일 — 사용자가 파일명 직접 수정 완료
- [x] [HIGH-2] `brand-guidelines.md`, `business-context.md` 파일 생성 — 사용자가 `project.10_print/_context/`에 업로드 완료
- [x] [MEDIUM-1] VIDEO(Veo) + REPORT/PANEL/DRAWING(Gemini) 분기 흐름 추가 — `ARCHITECTURE.md`, `N10-print.md` 수정 완료
- [x] [MEDIUM-2] V3 체크리스트에 N10 전용 Gemini/Veo API 검증 항목 추가 — `loop-b-verification-agent.txt` 수정 완료
- [x] [LOW-1] 디렉터리 트리에 `N10-print.md` 추가 — `AGENTS.md` 수정 완료

### HIGH-1 해결 방법
사용자가 `project.10_print/_context/design_style_guide.md`(언더스코어)를 `design-style-guide.md`(하이픈)로 직접 변경. `AGENTS.md` 및 `loop-c-design-agent.txt`의 기존 참조 경로(`design-style-guide.md`)와 일치.

### HIGH-2 해결 방법
`brand-guidelines.md`: 브랜드 정체성(Precision·Objectivity·Professionalism), 로고, 핵심 컬러, 타이포그래피, 보이스 앤 톤, 물리적 무결성 규칙 기술.
`business-context.md`: 라스트 마일 문제 정의, M3·하이브리드 자동화·멀티 모드 출력 해결책, 타겟 3그룹, 비즈니스 가치 기술.

### LOW-1 해결 방법
`AGENTS.md` 디렉터리 트리 `product-specs/` 섹션에 `N10-print.md ← N10 print 노드 스펙 (작성 완료)` 항목 추가.

### MEDIUM-1 해결 방법
`ARCHITECTURE.md`에 3가지를 추가했다.
1. **레이어 표 N10 예외 주석**: AI Core 행에 "N10 예외 → 아래 참조" 표기
2. **N10 전용 API 테이블**: REPORT/PANEL/DRAWING → Gemini(`gemini-2.5-pro`), VIDEO → Veo(`models/veo-3.1-lite-generate-preview`)
3. **모드별 데이터 흐름 3종**: 표준 노드(Claude), N10 문서 모드(Gemini), N10 VIDEO(Veo) 각각 독립 흐름 기술 + TypeScript 예시 코드 3종
`N10-print.md` buildSystemPrompt() 섹션에 Gemini/Veo 이중 API 구조를 명시 주석으로 추가.

### MEDIUM-2 해결 방법
`loop-b-verification-agent.txt` Phase V3 체크리스트를 3단계로 재구성했다.
- **공통 항목**: buildSystemPrompt() 함수 존재 및 구조 검증 (Claude 한정 문구 제거)
- **N10 REPORT/PANEL/DRAWING 전용**: Gemini API 연결 여부, 모델 검증, Claude API 미사용 확인
- **N10 VIDEO 전용**: Veo API 연결, 모델, startImage/endImage 바인딩, videoUri 추출 확인
Security 항목의 API 키 환경변수도 `GOOGLE_API_KEY`(N10)와 `ANTHROPIC_API_KEY`(기타)로 분리 표기.

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
