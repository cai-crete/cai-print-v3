/**
 * lib/agentErrors.ts — 멀티 에이전트 파이프라인 오류 격리 유틸리티
 *
 * AgentError: 어느 에이전트에서 어떤 유형의 오류가 발생했는지 추적한다.
 * validateSchema: JSON.parse 성공 후 required 필드 누락을 조기 탐지한다.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

// ---------------------------------------------------------------------------
// 오류 유형 분류
// ---------------------------------------------------------------------------

export type AgentErrorType =
  | 'TIMEOUT'         // withTimeout 초과
  | 'API_ERROR'       // Gemini API 호출 자체 실패 (rate limit, quota 등)
  | 'EMPTY_RESPONSE'  // res.text가 null/undefined/빈 문자열
  | 'JSON_PARSE_ERROR'// JSON.parse 실패
  | 'SCHEMA_MISMATCH' // required 필드 누락

// ---------------------------------------------------------------------------
// 에이전트 식별자 레이블
// ---------------------------------------------------------------------------

export type AgentLabel =
  | 'AGENT-1'
  | 'AGENT-2-P1'
  | 'AGENT-3'
  | 'AGENT-2-P2'

// ---------------------------------------------------------------------------
// AgentError 클래스
// ---------------------------------------------------------------------------

export class AgentError extends Error {
  constructor(
    public readonly agentLabel: AgentLabel,
    public readonly errorType: AgentErrorType,
    public readonly originalError: unknown
  ) {
    const cause =
      originalError instanceof Error ? originalError.message : String(originalError)
    super(`[${agentLabel}] ${errorType}: ${cause}`)
    this.name = 'AgentError'
  }
}

// ---------------------------------------------------------------------------
// 스키마 검증 유틸리티
// ---------------------------------------------------------------------------

/**
 * JSON.parse 결과에서 required 필드가 모두 존재하는지 확인한다.
 * 누락 시 AgentError(SCHEMA_MISMATCH)를 throw한다.
 */
export function validateSchema(
  data: unknown,
  required: string[],
  agentLabel: AgentLabel
): void {
  if (typeof data !== 'object' || data === null) {
    throw new AgentError(agentLabel, 'SCHEMA_MISMATCH', 'Response is not an object')
  }
  const obj = data as Record<string, unknown>
  for (const field of required) {
    if (!(field in obj)) {
      throw new AgentError(
        agentLabel,
        'SCHEMA_MISMATCH',
        `Missing required field: "${field}"`
      )
    }
  }
}

// ---------------------------------------------------------------------------
// 오류 유형별 사용자 안내 메시지
// ---------------------------------------------------------------------------

export const ERROR_TYPE_MSG: Record<AgentErrorType, string> = {
  TIMEOUT:
    'API 응답 시간 초과 (90초). 이미지 수를 줄이거나 잠시 후 재시도하세요.',
  API_ERROR:
    'Gemini API 오류. API 키 또는 할당량(Quota)을 확인하세요.',
  EMPTY_RESPONSE:
    'AI가 빈 응답을 반환했습니다. 재시도하거나 이미지를 교체해 보세요.',
  JSON_PARSE_ERROR:
    'AI 응답 파싱에 실패했습니다. 재시도하면 해결될 수 있습니다.',
  SCHEMA_MISMATCH:
    'AI 응답 구조가 예상과 다릅니다. 재시도하거나 프로토콜 버전을 확인하세요.',
}

// ---------------------------------------------------------------------------
// 에이전트 레이블 한국어 표시명
// ---------------------------------------------------------------------------

export const AGENT_LABEL_KO: Record<AgentLabel, string> = {
  'AGENT-1':    'AGENT-1 (이미지 분석)',
  'AGENT-2-P1': 'AGENT-2 Phase 1 (레이아웃 계획)',
  'AGENT-3':    'AGENT-3 (글 작성)',
  'AGENT-2-P2': 'AGENT-2 Phase 2 (최종 조립)',
}
