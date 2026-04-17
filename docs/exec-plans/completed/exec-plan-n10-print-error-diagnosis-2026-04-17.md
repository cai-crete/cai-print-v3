# Exec Plan — N10 Print: AI GENERATE 오류 진단 체계 구축

> 이 문서는 살아있는 문서(living document)입니다.
> 작업을 진행하면서 발견, 결정, 진행 상황을 이 문서에 지속적으로 업데이트합니다.
> 이전 맥락이나 기억 없이, 이 문서만으로 작업을 완수할 수 있을 만큼 자급자족해야 합니다.
>
> 작업 완료 시 `completed/` 폴더로 이동합니다.

---

## 개요

- **작업 유형**: 오류 진단 체계 설계 및 구현
- **대상 노드**: N10 Print — `app/api/print/route.ts` + 프론트엔드 오류 표시
- **시작일**: 2026-04-17
- **완료일**: 2026-04-17
- **선행 문서**: `exec-plan-n10-print-improvement-2026-04-17.md`

---

## 현황 분석 (문제 정의)

### 현재 파이프라인 구조

```
[AGENT-1] Input 분석       → Schema A 출력
    ↓
[AGENT-2 Phase 1] 레이아웃 계획  → Schema B 출력
    ↓
[AGENT-3] 글 작성          → Schema C 출력
    ↓
[AGENT-2 Phase 2] 최종 조립   → 완성 HTML 출력
```

모든 호출은 `callAgent()` 헬퍼를 통해 `withRetry → withTimeout → ai.models.generateContent()` 순서로 실행된다.

### 현재 오류 처리의 문제점

| 문제 | 원인 | 영향 |
|------|------|------|
| 어느 에이전트에서 실패했는지 모름 | 모든 에이전트 호출이 단일 `try-catch`로 감싸져 있음 | 에러 메시지만으로 원인 에이전트 특정 불가 |
| 오류 시 로그가 전혀 전달 안 됨 | `executionLog`는 마지막 성공 응답에만 포함됨 | 몇 단계까지 진행됐는지 알 수 없음 |
| 오류 유형 구분 없음 | 입력 검증 오류·네트워크 타임아웃·API 오류·JSON 파싱 오류가 동일하게 처리됨 | 원인별 대응 불가 |
| 프론트엔드 오류 표시 부재 | `alert()` 또는 단순 메시지 출력 | 사용자가 어떤 조치를 해야 할지 모름 |

---

## 진단 아키텍처 설계

오류 진단은 **4개 레이어**로 나눠 처리한다.

```
Layer 1: 에이전트 격리 추적  — 각 callAgent() 호출에 에이전트 식별자 주입
    ↓
Layer 2: 오류 유형 분류     — 타임아웃 / API 오류 / JSON 파싱 오류 / 스키마 검증 실패 분류
    ↓
Layer 3: 부분 실행 로그 반환 — 실패 시점까지 완료된 단계의 로그를 응답에 포함
    ↓
Layer 4: 프론트엔드 오류 UI  — 단계명·오류 유형·메시지를 사용자에게 구조화하여 표시
```

---

## 개발 단계 상세 계획

---

### 1단계: 서버 — 에이전트별 오류 격리 추적

**목적**: 어느 에이전트에서 오류가 발생했는지 서버에서 즉시 식별하고, 오류 정보에 단계 식별자를 포함시킨다.

**오류 응답 구조**:
```typescript
// 실패 시 응답 (status 500)
{
  error: string,          // 사용자 표시용 메시지
  failedAgent: string,    // 'AGENT-1' | 'AGENT-2-P1' | 'AGENT-3' | 'AGENT-2-P2'
  errorType: string,      // 'TIMEOUT' | 'API_ERROR' | 'JSON_PARSE_ERROR' 등
  partialLog: {           // 실패 직전까지 완료된 단계의 로그
    preStep?: string,
    step1?: string,
    step2?: string,
    step3?: string,
    step4?: string,
  }
}
```

**구현 위치**: `project.10_print/lib/agentErrors.ts` (신규) + `project.10_print/app/api/print/route.ts`

**체크리스트**:
- [x] `AgentError` 클래스 정의 (`lib/agentErrors.ts` — AgentError, AgentErrorType, AgentLabel, validateSchema, ERROR_TYPE_MSG, AGENT_LABEL_KO)
- [x] `callAgent()` 함수 시그니처에 `agentLabel` 추가
- [x] `callAgent()` 내부에서 오류 유형별 분기하여 `AgentError` throw
  - `withTimeout` 실패 → `TIMEOUT`
  - API 호출 자체 실패 → `API_ERROR`
  - `res.text` 없음 → `EMPTY_RESPONSE`
  - `JSON.parse` 실패 → `JSON_PARSE_ERROR`
  - required 필드 누락 → `SCHEMA_MISMATCH`
- [x] AGENT-1 호출부를 개별 try-catch로 감싸고 실패 시 `partialLog: {}` 포함 응답 반환
- [x] AGENT-2 Phase 1 호출부를 개별 try-catch로 감싸고 실패 시 `partialLog: { preStep, step1, step2 }` 포함
- [x] AGENT-3 호출부를 개별 try-catch로 감싸고 실패 시 `partialLog: { ..., step3 }` 포함
- [x] AGENT-2 Phase 2 호출부를 개별 try-catch로 감싸고 실패 시 `partialLog: { ..., step4 }` 포함
- [x] `console.error('[에이전트 오류]', agentLabel, errorType, originalError)` 서버 로그 출력
- [x] `npx tsc --noEmit` 신규 도입 오류 0건 확인

---

### 2단계: 프론트엔드 — 오류 단계 UI 표시

**목적**: 서버가 반환한 `failedAgent`·`errorType`·`partialLog`를 사용자에게 의미 있는 형태로 표시한다.

**구현 위치**: `page.tsx`

**체크리스트**:
- [x] `page.tsx` — `AgentApiError` 클래스 추가 (AgentErrorInfo 포함)
- [x] `callPrintApi()` — fetch 응답에서 `failedAgent` 감지 → `AgentApiError` throw
- [x] `page.tsx` — `agentError: AgentErrorInfo | null` 상태 추가
- [x] `handleGenerate` catch — `AgentApiError` 분기하여 `setAgentError()` 호출
- [x] 사이드바 에러 패널 — 에이전트명·오류 유형·안내 메시지·partialLog 토글 표시
- [x] 닫기 버튼으로 `agentError` 수동 해제
- [x] `npx tsc --noEmit` 신규 도입 오류 0건 확인

---

### 3단계: 스키마 검증 유틸리티 추가

**목적**: JSON.parse 성공 후 required 필드 누락을 즉시 탐지한다.

**구현 위치**: `lib/agentErrors.ts` (1단계와 통합)

**체크리스트**:
- [x] `validateSchema()` — `lib/agentErrors.ts`에 구현 (AgentError와 동일 파일 통합)
- [x] AGENT-1 결과 검증: `['images', 'masterData']` 필드 확인
- [x] AGENT-2 Phase 1 결과 검증: `['templateType', 'totalPages', 'slots']` 필드 확인
- [x] AGENT-3 결과 검증: `['texts']` 필드 확인
- [x] AGENT-2 Phase 2 결과 검증: `['html', 'slotMapping']` 필드 확인
- [x] `npx tsc --noEmit` 신규 도입 오류 0건 확인

---

### 4단계: 브라우저 DevTools 진단 가이드

**목적**: 개발 중 오류 발생 시 브라우저 개발자 도구만으로 원인을 추적하는 표준 절차.

#### Step 1 — 네트워크 탭에서 API 응답 확인

1. `F12` → Network 탭 → `Fetch/XHR` 필터
2. GENERATE 버튼 클릭 후 `/api/print` 요청 클릭
3. Response 탭에서 JSON 확인:
   - **성공**: `html`, `executionLog` 필드 존재
   - **실패**: `failedAgent`, `errorType`, `partialLog` 필드 존재

#### Step 2 — 서버 콘솔(터미널)에서 에이전트 로그 확인

```
[에이전트 오류] AGENT-3 JSON_PARSE_ERROR: Unexpected token...
```

#### Step 3 — executionLog 단계별 내용 분석 (성공 시)

```json
{
  "executionLog": {
    "preStep": "AGENT-1 분류 결과",
    "step1":   "AGENT-1 OCR 결과",
    "step2":   "AGENT-1 masterData 확정",
    "step3":   "AGENT-2 P1 슬롯 배치",
    "step4":   "AGENT-3 글 작성",
    "step5":   "AGENT-2 P2 역방향 검증"
  }
}
```

#### Step 4 — 오류 유형별 체크리스트

| 오류 유형 | 확인 항목 | 조치 |
|-----------|-----------|------|
| `TIMEOUT` | 이미지 수, 이미지 크기 | 이미지 수 감소 / 압축 |
| `API_ERROR` | `.env.local` `GOOGLE_AI_API_KEY` 유효성 | API 키 재발급 또는 할당량 확인 |
| `EMPTY_RESPONSE` | 네트워크 상태, 프롬프트 길이 | 프롬프트 단순화 후 재시도 |
| `JSON_PARSE_ERROR` | 모델 응답이 JSON이 아닌 자연어 | `responseMimeType: 'application/json'` 설정 확인 |
| `SCHEMA_MISMATCH` | required 필드 목록과 실제 응답 비교 | 프로토콜 스키마와 `responseSchema` 동기화 확인 |

**체크리스트**:
- [x] 이 문서의 Step 1~4 내용 계획서에 완성 (팀 내 공유용)

---

## Progress

- [x] 2026-04-17 — 계획서 작성 완료
- [x] 2026-04-17 — 1단계: 에이전트별 오류 격리 추적 구현
- [x] 2026-04-17 — 2단계: 프론트엔드 오류 단계 UI 표시 구현
- [x] 2026-04-17 — 3단계: 스키마 검증 유틸리티 구현 (1단계와 통합)
- [x] 2026-04-17 — 4단계: 브라우저 DevTools 진단 가이드 문서화 (계획서 내 완성)

---

## Surprises & Discoveries

- `validateSchema()`를 별도 파일(`lib/agentUtils.ts`)로 분리할 계획이었으나, `AgentError`와 동일 파일(`lib/agentErrors.ts`)에 통합하는 것이 더 응집도가 높다고 판단하여 통합.
- `page.tsx`의 `error` 상태 타입을 `AgentErrorInfo | null`로 변경하면 기존 `setError('...')` 호출 전체를 수정해야 하므로, 별도 `agentError` 상태로 분리하는 것이 영향 범위를 최소화하는 선택이었음.
- `tsc --noEmit` 결과 5건의 기존 오류(`VideoTemplate.isLoading`, `PurposeSelector/PageCountControl/PromptInput label`, `SavesModal.onDelete`) 발견 — 이번 작업과 무관한 사전 존재 오류임을 확인.

---

## Decision Log

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-17 | 각 callAgent() 호출을 개별 try-catch로 감쌈 | 단일 catch로는 실패 단계 특정 불가 |
| 2026-04-17 | `partialLog`를 오류 응답에 포함 | 성공한 단계의 로그는 진단에 유효한 정보 |
| 2026-04-17 | validateSchema를 agentErrors.ts에 통합 | AgentError와 결합도가 높아 별도 파일 불필요 |
| 2026-04-17 | agentError 상태를 error와 별도 분리 | 기존 string 타입 error 호출부 최소 변경 |

---

## Outcomes & Retrospective

- **원래 목표 달성 여부**: [x] Yes
- **결과 요약**: 4개 에이전트 호출을 개별 격리하고, 오류 발생 시 `failedAgent + errorType + partialLog` 구조로 반환하도록 서버/클라이언트 모두 개선 완료. 사이드바에 에이전트명·오류 유형·완료 단계 로그가 표시됨.
- **다음 작업에 반영할 것**: 사전 존재 TS 오류 5건(`VideoTemplate`, `PurposeSelector`, `PageCountControl`, `PromptInput`, `SavesModal`) 처리 필요.

---

`COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.`
