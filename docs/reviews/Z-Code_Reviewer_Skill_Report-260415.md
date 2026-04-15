# code-reviewer 스킬 검토 보고서

**작성일:** 2026-04-15
**대상:** `.claude/skills/code-reviewer/`
**목적:** 스킬 구조 파악, 문제 진단, 수정 내역 기록

---

## 1. 스킬 개요

`code-reviewer`는 Claude Code 하네스에 등록된 커스텀 스킬로, TypeScript · JavaScript · Python · Go · Swift · Kotlin 코드를 자동으로 분석하고 리뷰 기준을 제공하는 도구 모음입니다.

```
.claude/skills/code-reviewer/
├── SKILL.md                              ← 스킬 진입점 및 사용법 문서
├── scripts/                              ← 실행 가능한 Python 프로그램
│   ├── pr_analyzer.py                    ← PR 변경 사항 분석
│   ├── code_quality_checker.py           ← 정적 코드 품질 검사
│   └── review_report_generator.py        ← 통합 Markdown 리포트 생성
└── references/                           ← Claude의 판단 기준 문서
    ├── code_review_checklist.md          ← 리뷰 체크리스트
    ├── coding_standards.md               ← 언어별 코딩 표준
    └── common_antipatterns.md            ← 안티패턴 사례집
```

---

## 2. 구성 요소별 역할

### 2.1 Scripts — 자동 실행 도구

Scripts는 터미널에서 직접 실행하여 코드를 기계적으로 스캔하는 프로그램입니다. 사람이 일일이 읽지 않아도 되는 반복적인 검사를 자동화합니다.

#### pr_analyzer.py

`git diff`를 실행하여 PR에서 변경된 내용을 분석합니다.

```bash
python scripts/pr_analyzer.py . --base main
```

| 출력 항목 | 설명 |
|----------|------|
| 변경 파일 수·줄 수 | PR 규모 파악 |
| 언어 분포 | 어떤 언어가 얼마나 변경됐는지 |
| 자동 감지 이슈 | TODO/FIXME, 디버그 구문, 하드코딩 시크릿, 긴 줄 |

#### code_quality_checker.py

파일을 직접 읽어 정적 분석합니다. PR 변경 여부와 무관하게 전체 코드베이스를 검사합니다.

```bash
python scripts/code_quality_checker.py ./src
```

| 언어 | 검사 항목 |
|------|---------|
| Python | AST 기반 — 50줄 초과 함수, 가변 기본 인수, bare except, `== None` |
| TypeScript / JS | `var` 사용, explicit `any`, `eval()`, 빈 catch 블록 |
| Go | `_ = err` 에러 무시, `panic()` 남용 |
| 전체 공통 | 120자 초과 줄, TODO 주석, 디버그 구문, 하드코딩 시크릿 |

결과는 심각도 순(security → bug → error_handling → complexity → style)으로 정렬되어 출력됩니다.

#### review_report_generator.py

위 두 스크립트를 내부에서 실행하고 결과를 하나의 Markdown 파일로 통합합니다.

```bash
python scripts/review_report_generator.py . --output report.md
```

생성되는 `report.md` 구조:

```
# Code Review Report
## Summary           ← 변경 파일 수, 줄 수, 스캔된 파일 수
## Language Breakdown
## Changed Files     ← 추가/수정/삭제 파일 목록 (표)
### PR Diff Issues   ← pr_analyzer 결과
### Quality Issues   ← code_quality_checker 결과
## Recommendations   ← 발견 이슈 유형에 따른 자동 조언
```

### 2.2 References — Claude의 판단 기준

References는 실행되는 프로그램이 아니라, Claude가 코드를 **직접 판단할 때 읽는 지식 문서**입니다. Scripts가 "자동 탐지"라면 References는 "사람이 판단하기 어려운 설계·가독성·보안 관점의 기준"을 제공합니다.

| 파일 | 역할 | 주요 내용 |
|------|------|---------|
| `code_review_checklist.md` | PR 리뷰 시 확인해야 할 모든 항목 | 정확성·보안·에러처리·테스트·성능·가독성 등 9개 카테고리, 언어별 세부 항목 |
| `coding_standards.md` | 언어별 코딩 기준 | TS/JS/Python/Go/Swift/Kotlin 포매팅 도구, 네이밍 규칙, 올바른 패턴 코드 예시 |
| `common_antipatterns.md` | 자주 발생하는 나쁜 패턴 15개 | 각 패턴마다 Bad 코드 → 왜 문제인지 → Fix 코드 쌍 제공 |

### 2.3 전체 사용 흐름

```
git push → PR 생성
    │
    ├─ python pr_analyzer.py . --base main
    │     → 변경 파일에서 명백한 문제 자동 탐지
    │
    ├─ python code_quality_checker.py ./src
    │     → 전체 코드베이스 품질 검사
    │
    ├─ python review_report_generator.py . --output report.md
    │     → 두 결과를 하나의 Markdown 리포트로 통합
    │
    └─ Claude에게 "/code-reviewer" 요청
          → References 문서 기준으로 설계·보안 관점 추가 리뷰
```

---

## 3. 진단: 수정 전 문제점

### 3.1 Scripts — 세 파일 모두 동일한 빈 스텁

수정 전 `pr_analyzer.py`, `code_quality_checker.py`, `review_report_generator.py`는 클래스 이름만 다를 뿐 코드가 **완전히 동일**했습니다.

```python
# 세 파일 모두 동일한 analyze() 구현
def analyze(self):
    self.results['status'] = 'success'
    self.results['target'] = str(self.target_path)
    self.results['findings'] = []   # 항상 빈 배열 — 실제 분석 없음

def generate_report(self):
    print(f"Findings: {len(self.results.get('findings', []))}")
    # 어떤 코드를 넣어도 항상 "Findings: 0" 출력
```

어떤 경로를 입력해도 결과는 항상 `Findings: 0`이었습니다.

### 3.2 References — 세 파일 모두 동일한 플레이스홀더

```markdown
### Pattern 1: Best Practice Implementation
**When to Use:**
- Scenario 1
- Scenario 2

### Anti-Pattern 1
What not to do and why.
```

`code_review_checklist.md`, `coding_standards.md`, `common_antipatterns.md` 세 파일이 **완전히 동일한 내용**이었습니다. Claude가 이 문서를 읽어도 판단 기준으로 활용할 수 있는 실질적인 정보가 없었습니다.

### 3.3 SKILL.md 문서 오류

```bash
# SKILL.md에는 이렇게 안내하지만
python scripts/review_report_generator.py --analyze

# 실제 스크립트에는 --analyze 플래그가 존재하지 않았음
```

문서와 실제 코드가 불일치했습니다.

### 3.4 pr_analyzer.py 설계 문제

PR 분석 도구임에도 `target_path`(파일시스템 경로)만 받았고, `git`과 연동하는 코드가 전혀 없었습니다. PR의 변경 사항을 실제로 읽을 수 없는 구조였습니다.

---

## 4. 수정 내역

### 4.1 pr_analyzer.py

| 항목 | 수정 전 | 수정 후 | 이유 |
|------|--------|--------|------|
| 분석 대상 | 경로 존재 여부만 확인 | `git diff`로 실제 변경 내용 분석 | PR 분석의 핵심은 git 변경 사항 |
| 결과 | 항상 `findings: []` | 변경 파일 목록, 줄 수 통계, 언어 분포 출력 | 숫자 없이는 리뷰 근거가 없음 |
| 이슈 탐지 | 없음 | TODO/FIXME · 디버그 구문 · 하드코딩 시크릿 · 긴 줄 | 사람이 놓치기 쉬운 패턴 자동화 |
| base branch | 없음 | `--base main` 옵션, 실패 시 `HEAD~1` fallback | 다양한 브랜치 이름 환경 대응 |

### 4.2 code_quality_checker.py

| 항목 | 수정 전 | 수정 후 | 이유 |
|------|--------|--------|------|
| 분석 방식 | 없음 | Python은 `ast.parse()` AST 분석, JS/TS/Go는 정규식 패턴 검사 | 텍스트 검색만으로는 구조적 문제 탐지 불가 |
| 언어 구분 | 없음 | 확장자별(`.py` `.ts` `.js` `.go` `.swift` `.kt`) 검사 규칙 분리 | 언어마다 안티패턴이 다름 |
| Python 전용 | 없음 | 가변 기본 인수, bare except, `== None`, 50줄 초과 함수 | Python에서 가장 빈번한 버그 원인 |
| JS/TS 전용 | 없음 | `var` 사용, explicit `any`, `eval()`, 빈 catch | JavaScript 특유의 함정 |
| 디렉토리 제외 | 없음 | `node_modules`, `.git`, `__pycache__` 자동 제외 | 불필요한 경로 스캔 시 수만 개 이슈로 결과 무의미 |
| 심각도 정렬 | 없음 | security → bug → error_handling → complexity → style 순 | 중요한 문제가 먼저 표시되어야 우선순위 파악 가능 |

### 4.3 review_report_generator.py

| 항목 | 수정 전 | 수정 후 | 이유 |
|------|--------|--------|------|
| 출력 형식 | 콘솔 텍스트 3줄 | Markdown 파일 (표·섹션·이모지) | PR 설명·위키에 바로 붙여넣을 수 있는 형식 필요 |
| 다른 스크립트 연동 | 없음 | `pr_analyzer`·`code_quality_checker` import해서 내부 실행 | 세 도구가 통합 실행되는 것이 설계 의도 |
| `--analyze` 플래그 | 존재하지 않음 | 실제 구현 | SKILL.md 문서와 코드 불일치 해소 |
| JSON 입력 지원 | 없음 | `--pr-json`, `--quality-json`으로 사전 분석 결과 재사용 | 대용량 프로젝트 캐시 활용 |
| Recommendations | 없음 | 발견 이슈 유형별 맞춤 조언 자동 생성 | 이슈 목록만으로는 수정 방법을 별도로 찾아야 해서 비효율 |

### 4.4 References 3개 — 내용 전체 교체

| 파일 | 수정 전 | 수정 후 |
|------|--------|--------|
| `code_review_checklist.md` | 3개 파일 동일한 플레이스홀더 | 정확성·보안·에러처리·품질·테스트·성능·가독성·언어별·DevOps 9개 카테고리 |
| `coding_standards.md` | 동일한 플레이스홀더 | TS/JS/Python/Go/Swift/Kotlin 언어별 포매팅 도구, 네이밍 규칙, 실제 코드 예시 |
| `common_antipatterns.md` | 동일한 플레이스홀더 | N+1 쿼리, 가변 기본 인수, SQL 인젝션, 플로팅 프로미스 등 15개, Bad/Fix 코드 쌍 포함 |

---

## 5. 수정 전후 비교 요약

| 구분 | 수정 전 | 수정 후 |
|------|--------|--------|
| 스크립트 실행 결과 | 항상 `Findings: 0` | 실제 이슈 목록 및 통계 출력 |
| 언어별 분석 | 없음 | Python AST, JS/TS 정규식, Go 패턴 |
| 참조 문서 내용 | 3개 파일 모두 동일한 플레이스홀더 | 각 파일이 고유한 실제 내용 보유 |
| SKILL.md 정확성 | `--analyze` 플래그 불일치 | 문서와 코드 일치 |
| 스크립트 간 연동 | 없음 (각각 독립적 스텁) | `review_report_generator`가 두 스크립트 통합 실행 |
| 실용성 | 실행해도 유의미한 결과 없음 | 실제 코드베이스에 바로 사용 가능 |

---

*이 보고서는 `code-reviewer` 스킬의 초기 상태 진단 및 개선 작업을 기록한 문서입니다.*
