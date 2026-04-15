# Error Review Report — v.3

> 작성일: 2026-04-15
> 검토 범위: 개발 착수 전 전체 하네스 환경 정합성 검사
> 검토자 역할: 시니어 개발 전문가 (독립 정합성 검토)

---

## 개요

N10 print 노드 앱 개발 착수 전, 하네스 전체의 구성 정합성을 점검한다.
검토 대상은 하네스 루트 문서, 설계 문서, 실행 계획, 프로토콜 파일, 소스 자산, 개발 디렉토리 전체다.

**검토 대상 파일 목록:**

| 영역 | 파일 |
|------|------|
| 루트 | `AGENTS.md`, `ARCHITECTURE.md`, `README.md` |
| 설계 문서 | `docs/design-docs/core-beliefs.md`, `protocol-design-guide.md`, `review-guide.md` |
| 품질·안정성 | `docs/QUALITY_SCORE.md`, `docs/RELIABILITY.md` |
| 제품 스펙 | `docs/product-specs/N10-print.md`, `product-specs/index.md` |
| 실행 계획 | `docs/exec-plans/active/exec-plan-loop-system.md` |
| 에이전트 지침 | `docs/references/loop-a-verification-agent.txt`, `loop-b-execution-agent.txt`, `loop-b-verification-agent.txt` |
| 프로토콜 | `project.10_print/_context/protocol/protocol-print-v1.txt` |
| Knowledge Docs | `ai_generation_protocol-v3.2.md`, `video_generation_protocol.md`, `writer/PROMPT_건축작가.txt` |
| 소스 자산 | `project.10_print/sources/document_template/`, `fonts/`, `library/` |
| 개발 디렉토리 | `project.10_print/app/`, `project.10_print/lib/` |
| 설정 | `.claude/settings.json` |

---

## 결함 목록

### [CRITICAL-1] Loop A 독립 검증 미완료 — 개발 착수 차단 조건

**파일**: `docs/exec-plans/active/exec-plan-loop-system.md` Phase 1
**위치**: `### Phase 1` 마지막 항목

**현상**:
```
- [ ] N10 Protocol — loop-a-verification-agent.txt 기반 독립 에이전트 검증 (Loop B 진입 전 필수)
```
이 항목이 체크되지 않은 상태다. 현재 완료된 검증은 Execution Agent의 **자가 검증**뿐이다.
`loop-a-verification-agent.txt`를 기반으로 한 **독립 에이전트의 외부 검증**이 수행되지 않았다.

**영향**:
AGENTS.md 작업 전 체크리스트 항목 — "신규 Protocol이라면 Loop A 검증이 통과된 상태인가?" — 가 미충족 상태다.
exec-plan에도 "(Loop B 진입 전 필수)"라고 명시되어 있다.
이 상태에서 노드 앱 개발(= Loop B 시작)에 착수하면 하네스 프로세스를 위반한다.

**처방**:
개발 착수 전, 별도 에이전트 세션에서 `docs/references/loop-a-verification-agent.txt`를 로드하고
`_context/protocol/protocol-print-v1.txt`를 대상으로 CHECK 1~4 전체를 독립 실행한다.
PASS 판정 확인 후 exec-plan 항목에 체크하고 Loop B(개발)에 진입한다.

---

### [HIGH-1] `project.10_print/app/`, `lib/` 디렉토리 완전히 비어있음

**파일**: `project.10_print/app/`, `project.10_print/lib/`
**위치**: 해당 디렉토리 내 파일 0개

**현상**:
ARCHITECTURE.md가 명시한 모든 노드 공통 내부 모듈 구조가 미존재한다.

```
# ARCHITECTURE.md 명시 구조     # 실제 상태
project.10_print/
├── app/
│   ├── page.tsx               ← 없음
│   └── api/[node]/            ← 없음
└── lib/
    └── prompt.ts              ← 없음
```

Next.js 프로젝트 자체가 초기화되지 않았으며 `package.json`도 존재하지 않는다.

**영향**:
개발 착수 즉시 프로젝트 초기화 작업이 선행되어야 한다.
프레임워크 설치 없이는 어떤 노드 앱 코드도 작성할 수 없다.

**처방**:
Loop A 독립 검증 완료 후 개발 착수 시 첫 번째 작업으로 수행한다.
```bash
cd project.10_print
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```
설치 후 ARCHITECTURE.md 구조에 맞게 디렉토리를 정리하고 불필요한 보일러플레이트를 제거한다.

---

### [MEDIUM-1] `VideoTemplate.tsx` 미존재 — product-spec Output Contract 불일치

**파일**: `docs/product-specs/N10-print.md` → 출력 계약 / `project.10_print/sources/document_template/`
**위치**: N10-print.md `## 출력 계약` 템플릿 테이블

**현상**:
product-spec Output Contract에 VIDEO 모드 템플릿이 다음과 같이 명시되어 있다.

```markdown
| VIDEO | `VideoTemplate.tsx` | MP4, 8초, Veo 3.1 lite |
```

그러나 `sources/document_template/`에는 3종 HTML 파일만 존재한다.

```
DrawingSpecification_template.html  ← 존재
Panel_template.html                 ← 존재
Report_template.html                ← 존재
VideoTemplate.tsx                   ← 없음
```

VIDEO 모드는 Veo API가 영상을 생성하고 URI를 반환하는 구조로, HTML 템플릿이 필요 없다.
즉 `VideoTemplate.tsx`는 출력 결과를 렌더링하는 React 컴포넌트를 의미하는 것으로 추정되나,
sources/ 디렉토리에는 개발 참조용 원본만 보관하는 것이 원칙이어서 위치 정의 자체가 모호하다.

**영향**:
개발 단계에서 VIDEO 모드 출력 UI 구현 시 참조 원본이 없다.
혼선을 유발할 수 있으나 VIDEO 모드 구현은 REPORT/PANEL/DRAWING 이후로 예상되므로 즉시 차단 요인은 아니다.

**처방**:
product-spec의 템플릿 테이블을 실제 상황에 맞게 수정하거나,
VIDEO 모드 UI 컴포넌트 설계를 명확히 한 뒤 `sources/`에 참조 원본을 추가한다.

---

### [MEDIUM-2] exec-plan Loop B 첫 실행 항목이 대기 상태

**파일**: `docs/exec-plans/active/exec-plan-loop-system.md` Phase 2
**위치**: `### Phase 2` 마지막 항목

**현상**:
```
- [ ] 첫 번째 노드 Protocol 업로드 시 Loop B 수동 실행 → 보고서 형식 검증 (대기 중)
```
이 항목은 개발 착수(= Loop B 시작)와 동시에 수행되어야 하는 항목이다.
현재 exec-plan의 전체 완료 상태와 개발 착수 시점이 명확히 연결되어 있지 않다.

**영향**:
직접적인 오류는 아니나 개발 착수 시 이 exec-plan을 "진행 중"으로 갱신하지 않으면
exec-plan이 현실을 반영하지 못하는 상태가 된다.

**처방**:
개발 착수 시점에 exec-plan의 `## Outcomes & Retrospective` 섹션과
Phase 2 항목을 현재 상태로 업데이트한다.

---

### [LOW-1] AGENTS.md 디렉토리 구조도의 루트 경로 표기

**파일**: `AGENTS.md`
**위치**: `## 디렉토리 구조` 섹션

**현상**:
```
CAI/
├── AGENTS.md
├── ARCHITECTURE.md
...
```
AGENTS.md 구조도는 `CAI/`를 루트로 표기하나 실제 파일시스템 루트는 `cai-harness-print/`다.
AGENTS.md 본문에서도 "하네스 경로: `CAI/`"로 명시하고 있다.

**영향**:
논리적 경로명(`CAI/`)과 실제 폴더명(`cai-harness-print/`)의 불일치다.
에이전트가 경로를 참조할 때 혼선을 줄 가능성이 있으나,
실제 파일 작업은 IDE·터미널이 절대경로를 제공하므로 런타임 영향은 없다.

**처방**:
명시적 혼선 방지를 위해 AGENTS.md 구조도 상단에 "논리 경로명 기준 표기 (실제: `cai-harness-print/`)" 주석을 추가하는 것을 권고한다. 강제 수정은 아님.

---

### [LOW-2] `docs/product-specs/index.md` — N10 `_template` 파일 미작성 명시

**파일**: `docs/product-specs/index.md`
**위치**: `## 결과물 _template 파일 추적` 테이블

**현상**:
```markdown
| N10 | html, slotMapping, masterData, videoUri | — (추후 작성) | 미작성 |
```
N10의 출력 결과물 `_template` 파일이 아직 작성되지 않은 상태가 공식 기록되어 있다.

**영향**:
현재 개발 단계에서 즉각적인 차단 요인은 아니다.
그러나 개발이 진행되면서 출력 계약의 상세 포맷이 확정되어야 하는 시점이 온다.

**처방**:
N10 출력 포맷(html 구조, slotMapping JSON schema, masterData 필드 목록)이 개발 과정에서
확정될 때 `_template` 파일을 작성하고 index.md를 업데이트한다.

---

## 결함 요약

| 심각도 | 건수 | 항목 |
|--------|------|------|
| CRITICAL | 1 | Loop A 독립 검증 미완료 |
| HIGH | 1 | app/, lib/ 미초기화 (개발 착수 시 첫 번째 작업) |
| MEDIUM | 2 | VideoTemplate.tsx 미존재, exec-plan 미갱신 |
| LOW | 2 | 경로 표기 불일치, _template 미작성 |
| **합계** | **6** | |

---

## 긍정 항목 (잘 된 것)

**1. NodeContract 전 필드 완성**
`N10-print.md`의 Input Contract·Output Contract·컴플라이언스 체크리스트·알려진 실패 패턴이 모두 작성되어 있다. ARCHITECTURE.md의 배포 승인 조건인 "NodeContract 전 필드 정의"를 충족한다.

**2. Protocol v1 + 자가 검증 완료**
`protocol-print-v1.txt`가 작성되었고, Loop A CHECK 1~4 자가 검증 PASS 기록이 product-spec 버전 History에 명시되어 있다. 추정 토큰 3,553 / 50,000 한도 (7.1%)로 컨텍스트 제한 내에 있다.

**3. Knowledge Doc 4종 모두 존재**
Protocol이 참조하는 Knowledge Doc(`ai_generation_protocol-v3.2.md`, `video_generation_protocol.md`, `PROMPT_건축작가.txt`)이 `_context/`에 모두 존재한다.

**4. `.claude/settings.json` 훅 정상 작동**
Protocol 파일(`_context/protocol/`의 `.txt`·`.md`) 수정 시 Loop A 필수 실행 경고를 자동 주입하는 PostToolUse 훅이 설정되어 있다. exec-plan에 파이프 테스트 8개 전 케이스 통과 기록이 있다.

**5. 소스 자산 완비**
`sources/fonts/` 36종, `sources/document_template/` HTML 3종, `sources/library/` 더미 이미지가 모두 존재하며 product-spec의 소스 파일 구조 정의와 일치한다.

**6. 에이전트 경계 명확**
AGENTS.md에 AGENT A·B·C의 역할과 금지 사항이 명확히 분리되어 있다. 실행 에이전트와 검증 에이전트의 책임 경계가 설계 수준에서 확립되어 있다.

**7. N10 API 아키텍처 예외 이중 명시**
N10이 Claude API 대신 Google Gemini/Veo API를 사용한다는 사실이 ARCHITECTURE.md와 N10-print.md 두 곳 모두에 명시되어 있어 구현 시 혼선 위험이 낮다.

---

## 권고 사항

### 즉시 수행 (개발 착수 전 차단 조건)

- **[CRITICAL-1]** 별도 에이전트 세션으로 Loop A 독립 검증 실행 → PASS 확인 후 착수

### 개발 착수 시 첫 번째 작업

- **[HIGH-1]** `project.10_print/` Next.js 프로젝트 초기화 → ARCHITECTURE.md 구조에 맞게 디렉토리 정리

### 개발 중 수행

- **[MEDIUM-1]** VIDEO 모드 UI 설계 확정 후 `VideoTemplate.tsx` 소스 추가 또는 product-spec 수정
- **[MEDIUM-2]** 개발 착수 시 exec-plan 갱신 (착수 날짜, Phase 2 항목 업데이트)

### 선택적 개선

- **[LOW-1]** AGENTS.md 구조도 경로 표기에 주석 추가
- **[LOW-2]** N10 출력 포맷 확정 시 `_template` 파일 작성

---

## 전체 판정

| 구분 | 내용 |
|------|------|
| CRITICAL | 1건 — Loop A 독립 검증 미완료 |
| HIGH | 1건 — 개발 환경 미초기화 (착수 즉시 해결 가능) |
| 하네스 구성 완결성 | **조건부 완결** |
| 개발 착수 가능 여부 | **HOLD** — CRITICAL-1 해소 후 착수 허가 |

> CRITICAL-1(Loop A 독립 검증)은 이 하네스의 프로세스 원칙(AGENTS.md)이 명시한 배포 전 필수 조건이다.
> HIGH-1(Next.js 초기화)은 착수 첫날 30분 내 해결 가능한 작업이다.
> 나머지 MEDIUM/LOW 결함은 개발 진행을 차단하지 않는다.
>
> **Loop A 독립 검증 PASS 확인 즉시 개발 착수 가능.**

---

## 수정 체크리스트

- [x] [CRITICAL-1] Loop A 독립 검증 완료 (PASS) — `docs/references/loop-a-verification-agent.txt` 기반
      CHECK 1~4 전체 PASS. 차단 결함 0건. Advisory 2건(비차단).
      보고서: `docs/exec-plans/active/loop-a-report-print-v1.md`
- [x] [HIGH-1] `project.10_print/` Next.js 프로젝트 초기화 완료 (2026-04-15)
      Next.js 15 + React 19 + Tailwind v4 + @google/genai | next build ✓
- [ ] [MEDIUM-1] `VideoTemplate.tsx` 처리 방향 결정 (소스 추가 또는 product-spec 수정)
- [ ] [MEDIUM-2] 착수 시 exec-plan Loop B 항목 갱신
- [ ] [LOW-1] AGENTS.md 구조도 경로 주석 추가 (선택)
- [ ] [LOW-2] N10 `_template` 파일 작성 (개발 중 수행)

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`