# Error Review Report — v.1

> 작성일: 2026-04-14
> 검토 범위: N10 print 노드 하네스 세팅 초기 구성 (2026-04-14 세션 전체)
> 검토자 역할: 시니어 개발 전문가 (독립 정합성 검토)

---

## 개요

본 보고서는 N10 print 노드 개발 착수 전 하네스 환경 구성 세션에서 생성·수정된 파일 전체를 대상으로
**구조 정합성, 계약 일관성, 운영 안전성** 세 축에서 독립 검토를 수행한 결과다.

검토 대상 파일:

| 파일 | 유형 | 세션 내 작업 |
|------|------|------------|
| `.claude/settings.json` | 훅 설정 | 수정 (패턴 버그 3건 수정) |
| `project.10_print/_context/protocol/protocol-print-v1.txt` | Principle Protocol | 신규 작성 |
| `docs/product-specs/N10-print.md` | Product Spec | 신규 작성 |
| `docs/product-specs/index.md` | 인덱스 | 수정 (N10 행 추가) |
| `docs/exec-plans/active/exec-plan-loop-system.md` | Exec Plan | 수정 (Phase 3 버그 수정 기록 + Decision Log 추가) |

---

## 결함 목록

### [HIGH-1] 훅 패턴: Knowledge Doc 파일 오탐 잔존

**파일**: `.claude/settings.json`
**위치**: `hooks.PostToolUse[0].hooks[0].command` 내 정규식

**현상**:
최종 확정 패턴 `_context[\/]protocol.*\.(txt|md)$`은 경로 내 `_context/protocol`로 시작하는 모든 파일에 매칭된다. 실제 디렉터리 구조상 이 경로에는 Principle Protocol 1개 외에 Knowledge Doc 5개 이상이 공존한다.

```
project.10_print/_context/protocol/
├── protocol-print-v1.txt        ← 의도된 감지 대상
├── ai_generation_protocol-v3.2.md  ← 오탐 (Knowledge Doc)
├── video_generation_protocol.md    ← 오탐 (Knowledge Doc)
└── writer/
    ├── PROMPT_건축작가.txt          ← 오탐 (Knowledge Doc)
    ├── 건축이미지분석기술서v1.txt     ← 오탐 (Knowledge Doc)
    └── (... 6개 추가 파일)          ← 오탐 (Knowledge Doc)
```

**영향**: Knowledge Doc 파일 수정 시마다 불필요한 Loop A 경고가 에이전트 컨텍스트에 주입된다. Loop A는 Principle Protocol 전용 검증이므로, Knowledge Doc 수정에 Loop A 경고가 뜨는 것은 오인 행동(false alarm)을 유발하고, 장기적으로 경고 무시 패턴을 형성한다.

**처방**:
Principle Protocol 파일은 명명 규칙 `protocol-[node-name]-v[N].(txt|md)` 을 따른다. 패턴을 이 규칙에 맞게 강화한다.

```
변경 전: _context[\/]protocol.*\.(txt|md)$
변경 후: _context[\/]protocol[\/]protocol-[^\/]+\.(txt|md)$
```

단, `writer/` 하위까지 재귀 감지가 필요 없으므로 디렉터리 구분자를 1단계만 허용하는 패턴이 더 정확하다.

---

### [MEDIUM-1] VIDEO 이중 API 구조 미기술

**파일**: `docs/product-specs/N10-print.md`
**위치**: `## Protocol 구성` > `buildSystemPrompt() 조합 규칙` 테이블

**현상**:
VIDEO 모드의 `buildSystemPrompt()` 조합 규칙이 `Principle Protocol + video_generation_protocol.md`로만 명시되어 있다. 그러나 VIDEO 모드의 실제 생성 로직은 Claude API(Anthropic)가 아닌 Google Veo 3.1 lite API(`models/veo-3.1-lite-generate-preview`)를 호출한다. 이 구분이 product-spec에 기술되어 있지 않다.

**영향**: 차후 AGENT A(실행 에이전트)가 VIDEO 모드 `buildSystemPrompt()`를 구현할 때, Claude API 호출 경로만 구성하고 Veo API 호출 분기를 누락할 위험이 있다. 런타임에서야 아키텍처 오류가 드러나는 전형적 계약 누락 패턴이다.

**처방**:
`buildSystemPrompt() 조합 규칙` 테이블에 아래 주석을 추가하거나, 별도 항목으로 명시한다.

```
VIDEO 모드 특이사항:
- buildSystemPrompt()는 Veo API 호출 프롬프트를 구성한다 (Claude API system 파라미터 아님).
- 실제 영상 생성은 Google Veo 3.1 lite API (models/veo-3.1-lite-generate-preview) 를 통해 수행된다.
- videoUri 반환 후 Claude API에는 결과만 바인딩된다.
```

---

### [MEDIUM-2] DRAWING 모드 `pageCount` 처리 미정의

**파일**: `docs/product-specs/N10-print.md`
**위치**: `## 입력 계약 (Input Contract)` > `pageCount` 항목

**현상**:
`pageCount` 항목의 필수 여부가 `필수 (REPORT/PANEL)`로만 명시되어 있고, VIDEO 모드에서는 "비활성화"로 명시되어 있다. DRAWING 모드에 대한 처리는 기술되어 있지 않다.

DrawingSpecification_template.html은 A3 단일 페이지 도각 양식이므로 단일 페이지가 자명하지만, 계약(Contract)은 "자명한 것"을 근거로 항목을 생략해서는 안 된다.

**영향**: AGENT A가 DRAWING 모드에서 `pageCount`를 어떻게 처리해야 할지 계약 상에 근거가 없다. 구현 시 임의 처리(무시 또는 오류 반환)로 이어질 수 있다.

**처방**:
`pageCount` 필수 여부를 아래와 같이 명확화한다.

```
| `pageCount` | `number` | 필수 (REPORT/PANEL), DRAWING 비활성화 (단일 페이지 고정), VIDEO 비활성화 |
```

---

### [LOW-1] Protocol 구성 테이블의 "잠정" 레이블 오류

**파일**: `docs/product-specs/N10-print.md`
**위치**: `## Protocol 구성` > Protocol 파일 목록 테이블

**현상**:
`ai_generation_protocol-v3.2.md` 항목의 유형이 `Knowledge Doc (잠정)`으로 표기되어 있다. "잠정"은 "임시로 정함"을 의미하며, 이 분류가 확정적이지 않음을 시사한다.

그러나 해당 파일의 Knowledge Doc 분류는 이번 세션의 Decision Log에 명시된 대로 확정된 결정이다(`exec-plan-loop-system.md` Decision Log 2026-04-14 항목 참조). "잠정"은 분류 결정이 아닌 **Principle Protocol 재작성 완료 전까지의 운영 방식**을 가리킨다.

**영향**: 낮음. 그러나 향후 AGENT A가 이 레이블을 근거로 분류를 재검토하거나 변경하는 불필요한 작업을 유발할 수 있다.

**처방**:
레이블을 다음과 같이 수정한다.

```
변경 전: Knowledge Doc (잠정)
변경 후: Knowledge Doc (Principle Protocol 재작성 전 참조용)
```

---

### [LOW-2] exec-plan Phase 1 체크박스 의미 모호

**파일**: `docs/exec-plans/active/exec-plan-loop-system.md`
**위치**: `## 구현 단계` > `Phase 1` > 4번째 항목

**현상**:
N10 Protocol 작성 항목이 `[x]` 완료로 표시되어 있으나, 같은 행 주석에 "실제 Loop A 에이전트 적용은 Loop B 진입 전 별도 세션에서 수행 예정"이라고 명시되어 있다. 즉, **프로토콜 파일 자가 검증(CHECK 1~4)**은 통과했으나 **loop-a-verification-agent.txt를 사용한 독립 에이전트 검증**은 미완료 상태다.

`[x]` 체크박스가 "작성 완료"인지 "Loop A 완전 통과"인지 해석이 불분명하다.

**영향**: 다음 AGENT B(검증 에이전트)가 이 항목을 읽을 때 Loop A가 완전히 완료된 것으로 오인하여 검증 단계를 건너뛸 수 있다.

**처방**:
항목을 두 줄로 분리하거나 상태를 구분한다.

```markdown
- [x] 2026-04-14 — N10 print 노드 최초 Protocol(`protocol-print-v1.txt`) 작성 및 자가 검증 완료
      (CHECK 1~4 자가 PASS. Failure Mode 5개. 추정 토큰 3,553 / 50,000 한도)
- [ ] N10 Protocol — loop-a-verification-agent.txt 기반 독립 에이전트 검증 (Loop B 진입 전 필수)
```

---

### [LOW-3] COMPLIANCE CHECK 내 VIDEO 모드 Skip 표기 누락

**파일**: `project.10_print/_context/protocol/protocol-print-v1.txt`
**위치**: `# COMPLIANCE CHECK` > `## Post-generation` > Step 1, Step 2 항목

**현상**:
Post-generation 체크리스트의 Step 1과 Step 2 항목이 다음과 같이 표기되어 있다.

```
- [ ] Step 1 실행: L3 이미지에 OCR 파싱이 실행됐는가 (L3 없으면 SKIP 후 빈 배열 생성)
- [ ] Step 2 실행: masterData 객체가 최빈값 기반으로 확정됐는가
```

Step 1 항목에는 "L3 없으면 SKIP"이 표기되어 있지만, **VIDEO 모드에서의 Step 1·2 전체 Skip**은 표기되어 있지 않다. Step 2 항목에는 어떤 Skip 조건도 표기되어 있지 않다.

**영향**: AGENT B(검증 에이전트)가 VIDEO 모드 실행 결과에 대해 COMPLIANCE CHECK를 수행할 때, Step 1·2 미실행을 결함으로 오판할 수 있다.

**처방**:
```
변경 전:
- [ ] Step 1 실행: L3 이미지에 OCR 파싱이 실행됐는가 (L3 없으면 SKIP 후 빈 배열 생성)
- [ ] Step 2 실행: masterData 객체가 최빈값 기반으로 확정됐는가

변경 후:
- [ ] Step 1 실행: L3 이미지에 OCR 파싱이 실행됐는가 (L3 없으면 SKIP; VIDEO 모드는 이 항목 적용 제외)
- [ ] Step 2 실행: masterData 객체가 최빈값 기반으로 확정됐는가 (VIDEO 모드는 이 항목 적용 제외)
```

---

### [LOW-4] product-specs/index.md `_template` 추적 테이블 미갱신

**파일**: `docs/product-specs/index.md`
**위치**: `## 결과물 _template 파일 추적` 테이블

**현상**:
`_template` 추적 테이블이 `N01~N10 — 미작성`으로 통합 표기되어 있다. N10 product-spec은 이번 세션에서 작성 완료되었으나, 해당 행은 갱신되지 않았다.

**영향**: 낮음. 추적 테이블의 N10 행이 여전히 "미작성"으로 표시되어 실제 상태와 불일치한다.

**처방**:
```markdown
| N10 | html, slotMapping, masterData, videoUri | — (추후 작성) | 미작성 |
| N01~N09 | — | — | 미작성 |
```

---

## 결함 요약

| ID | 심각도 | 파일 | 내용 요약 | 처방 난이도 |
|----|--------|------|----------|-----------|
| HIGH-1 | HIGH | `.claude/settings.json` | 훅 패턴이 Knowledge Doc 파일도 감지 — Loop A 오탐 | 낮음 (패턴 1줄 수정) |
| MEDIUM-1 | MEDIUM | `N10-print.md` | VIDEO 모드의 Veo API 분리 아키텍처 미기술 | 낮음 (주석 추가) |
| MEDIUM-2 | MEDIUM | `N10-print.md` | DRAWING 모드의 `pageCount` 처리 미정의 | 낮음 (테이블 1행 수정) |
| LOW-1 | LOW | `N10-print.md` | "잠정" 레이블 오기 — 확정 분류에 임시 표식 | 낮음 (단어 수정) |
| LOW-2 | LOW | `exec-plan-loop-system.md` | Phase 1 체크박스 의미 모호 — 자가검증 ≠ 에이전트 검증 | 낮음 (항목 분리) |
| LOW-3 | LOW | `protocol-print-v1.txt` | COMPLIANCE CHECK Step 1·2에 VIDEO 모드 적용 제외 미표기 | 낮음 (주석 추가) |
| LOW-4 | LOW | `product-specs/index.md` | `_template` 추적 테이블 N10 행 미갱신 | 낮음 (행 추가) |

---

## 긍정 항목 (잘 된 것)

본 검토에서 결함으로 분류되지 않았으나 명시적으로 기록할 만한 올바른 설계 결정:

1. **Principle Protocol vs Knowledge Doc 분리 원칙 확립**: `ai_generation_protocol-v3.2.md`를 Principle Protocol로 사용하던 기존 관행을 교정하고 역할 재분류한 것은 하네스 구조 건전성을 크게 향상시켰다.

2. **Product-spec 선작성 원칙**: Input/Output Contract가 확정된 후 Principle Protocol을 작성하는 순서를 Decision Log에 확립한 것은 N11~N19 노드 개발에도 적용 가능한 재사용 가능한 원칙이다.

3. **Immutable Constants 6번 항목 (건물 기하학 보존)**: 초기 작성본에 없던 항목을 Loop A CHECK 4 취약점 분석을 통해 추가한 것은 Protocol 오염 저항성을 실질적으로 강화했다.

4. **Shell escaping 3중 레이어 분석**: JSON → 셸 double-quote → JS 정규식 변환 경로를 추적하여 `[\/\\]`에서 `[\/]`로 단순화한 것은 재현 조건이 불명확한 버그를 근본 원인 수준에서 해결했다.

5. **sources/ 디렉터리 사용 의도 명문화**: `library/`(더미 데이터), `document_template/`(참조 HTML), `fonts/`(직접 적용 가능 에셋)의 구분을 product-spec에 명시한 것은 향후 AGENT C(디자인 에이전트)의 오조작을 예방한다.

---

## 권고 사항

### 즉시 수정 권고 (Stage B 진입 전)

1. **HIGH-1** 처방 적용: `.claude/settings.json` 훅 패턴을 `_context[\/]protocol[\/]protocol-[^\/]+\.(txt|md)$`으로 강화한다.
2. **MEDIUM-1** 처방 적용: N10-print.md에 VIDEO 모드 Veo API 아키텍처 명시.
3. **LOW-2** 처방 적용: exec-plan Phase 1 Loop A 독립 검증 항목 분리 및 미완료 표기.

### 개발 착수 전 수정 권고

4. **MEDIUM-2** 처방 적용: DRAWING 모드 pageCount 명시.
5. **LOW-3** 처방 적용: COMPLIANCE CHECK VIDEO 모드 skip 표기 추가.

### 낮은 우선순위 (다음 버전 반영)

6. **LOW-1** 처방 적용: "잠정" 레이블 수정.
7. **LOW-4** 처방 적용: index.md `_template` 테이블 N10 행 추가.

---

## 전체 판정

| 구분 | 결과 |
|------|------|
| CRITICAL 결함 | 0건 |
| HIGH 결함 | 1건 → **수정 완료** (2026-04-14) |
| MEDIUM 결함 | 2건 → **수정 완료** (2026-04-14) |
| LOW 결함 | 4건 → **수정 완료** (2026-04-14) |
| **하네스 구성 완결성** | **Loop A 독립 에이전트 검증 후 Stage B 진입 가능** |

> 모든 결함은 보고서 작성 당일 수정 완료됨. Loop A 독립 에이전트 검증(exec-plan Phase 1 미완료 항목)만 잔존.

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
