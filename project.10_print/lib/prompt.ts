// 서버 전용 모듈 — 클라이언트 컴포넌트에서 import 금지 (fs 사용)
import fs from 'fs'
import path from 'path'

const CONTEXT_DIR = path.join(process.cwd(), '_context', 'protocol')
const TEMPLATE_DIR = path.join(process.cwd(), 'sources', 'document_template')

// ---------------------------------------------------------------------------
// v4.0 Multi-Agent Protocol 파서
// ---------------------------------------------------------------------------

/**
 * v4.0 프로토콜 파일에서 특정 에이전트 섹션을 추출한다.
 * 마커: <!-- AGENT:X --> ... <!-- AGENT:END -->
 */
export function parseAgentSection(protocol: string, agentId: string): string {
  const startMarker = `<!-- AGENT:${agentId} -->`
  const endMarker = '<!-- AGENT:END -->'
  const startIdx = protocol.indexOf(startMarker)
  if (startIdx === -1) {
    throw new Error(`[FATAL] 프로토콜에서 AGENT:${agentId} 섹션을 찾을 수 없습니다.`)
  }
  const contentStart = startIdx + startMarker.length
  const endIdx = protocol.indexOf(endMarker, contentStart)
  if (endIdx === -1) {
    throw new Error(`[FATAL] AGENT:${agentId} 섹션의 종료 마커(<!-- AGENT:END -->)를 찾을 수 없습니다.`)
  }
  return protocol.slice(contentStart, endIdx).trim()
}

/**
 * 섹션 내 <!-- INJECT: relative/path --> 태그를 파싱하여
 * 해당 파일 내용을 인라인으로 치환한다.
 * 파일 로드 실패는 치명적 오류로 처리한다.
 */
function resolveInjectTags(sectionContent: string): string {
  const injectRegex = /<!--\s*INJECT:\s*(.+?)\s*-->/g
  return sectionContent.replace(injectRegex, (_match, relativePath: string) => {
    const filePath = path.join(CONTEXT_DIR, relativePath.trim())
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return `\n\n---\n\n[참조 파일: ${relativePath.trim()}]\n${content}\n\n---\n\n`
    } catch {
      throw new Error(`[FATAL] INJECT 파일 로드 실패: ${filePath}`)
    }
  })
}

/**
 * 에이전트 ID별 시스템 프롬프트를 구성한다.
 *
 * 구성:
 *   protocol-print-v1.txt (기본 제약, Immutable Constants)
 *   + ai_generation_protocol-v4.0.md 의 해당 에이전트 섹션
 *
 * AGENT-3는 섹션 내 <!-- INJECT --> 태그를 통해 writer/ 파일들을 자동 포함한다.
 */
export function buildAgentSystemPrompt(agentId: '1' | '2' | '3'): string {
  const baseProtocol = loadProtocol('protocol-print-v1.txt')
  const v4Protocol = loadProtocol('ai_generation_protocol-v4.0.md')
  const agentSection = parseAgentSection(v4Protocol, agentId)
  const resolvedSection = resolveInjectTags(agentSection)
  return buildSystemPrompt(baseProtocol, [resolvedSection])
}

/**
 * video_generation_protocol.md의 <!-- VIDEO:INJECTION --> 블록을 파싱하여
 * Kling O3 API에 전달할 완성 프롬프트 문자열을 구성한다.
 *
 * @param userPrompt 사용자가 입력한 추가 지시 (없으면 빈 문자열)
 */
export function buildVideoInjectionPrompt(userPrompt: string): string {
  const protocol = loadProtocol('video_generation_protocol.md')
  const startMarker = '<!-- VIDEO:INJECTION -->'
  const endMarker = '<!-- VIDEO:END -->'
  const startIdx = protocol.indexOf(startMarker)
  if (startIdx === -1) {
    throw new Error('[FATAL] video_generation_protocol.md에서 VIDEO:INJECTION 섹션을 찾을 수 없습니다.')
  }
  const contentStart = startIdx + startMarker.length
  const endIdx = protocol.indexOf(endMarker, contentStart)
  if (endIdx === -1) {
    throw new Error('[FATAL] VIDEO:INJECTION 섹션의 종료 마커(<!-- VIDEO:END -->)를 찾을 수 없습니다.')
  }
  const injection = protocol.slice(contentStart, endIdx).trim()
  return userPrompt ? `${injection} [USER DIRECTION] ${userPrompt}` : injection
}

/**
 * Protocol 파일을 파일시스템에서 로드한다.
 * 로드 실패는 앱 실행을 중단시키는 치명적 오류로 처리한다. (ARCHITECTURE.md)
 */
function loadProtocol(filename: string): string {
  const filePath = path.join(CONTEXT_DIR, filename)
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    throw new Error(
      `[FATAL] Protocol 파일 로드 실패: ${filePath}\n` +
        `Protocol 없이는 앱을 실행할 수 없습니다.`
    )
  }
}

/**
 * Principle Protocol과 Knowledge Doc을 조합하여 시스템 프롬프트를 구성한다.
 *
 * 계층 규칙 (ARCHITECTURE.md):
 *   Principle Protocol > Knowledge Docs > User Input
 *
 * 출력 형식:
 *   [Protocol 전문]\n\n---\n\n[Knowledge Doc 1]\n\n---\n\n[Knowledge Doc 2]\n\n...
 */
export function buildSystemPrompt(
  principleProtocol: string,
  knowledgeDocs: string[] = []
): string {
  return [principleProtocol, ...knowledgeDocs].join('\n\n---\n\n')
}

/**
 * N10 모드별 buildSystemPrompt() 조합 규칙 (N10-print.md)
 *
 * REPORT / PANEL : Protocol + ai_generation_protocol + PROMPT_건축작가
 * DRAWING        : Protocol + ai_generation_protocol
 * VIDEO          : Protocol + video_generation_protocol (Kling O3)
 */
export type PrintMode = 'REPORT' | 'PANEL' | 'DRAWING' | 'VIDEO'

/** 모드별 참조 HTML 템플릿 파일명 (sources/document_template/) */
const TEMPLATE_FILES: Partial<Record<PrintMode, string>> = {
  REPORT: 'Report_template.html',
  PANEL: 'Panel_template.html',
  DRAWING: 'DrawingSpecification_template.html',
  // VIDEO: Kling O3 (fal.ai) 직접 호출 — HTML 템플릿 없음
}

/**
 * 모드별 HTML 레이아웃 템플릿을 로드한다.
 *
 * 용도: Gemini에게 시각 구조를 제공하여 동일한 레이아웃의 완성 HTML을 생성하게 한다.
 * Protocol Immutable Constant 2 (템플릿 HTML 구조 불변) 적용 기준.
 *
 * VIDEO 모드는 빈 문자열을 반환한다 (Kling O3 사용, 템플릿 없음).
 */
export function loadTemplate(mode: PrintMode): string {
  const filename = TEMPLATE_FILES[mode]
  if (!filename) return ''
  const filePath = path.join(TEMPLATE_DIR, filename)
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    throw new Error(`[FATAL] Template 파일 로드 실패: ${filePath}`)
  }
}

export function buildPrintSystemPrompt(mode: PrintMode): string {
  const protocol = loadProtocol('protocol-print-v1.txt')

  const writerDir = path.join(CONTEXT_DIR, 'writer')

  const loadKnowledge = (filename: string, subdir?: string): string => {
    const dir = subdir ? path.join(CONTEXT_DIR, subdir) : CONTEXT_DIR
    const filePath = path.join(dir, filename)
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      throw new Error(`[FATAL] Knowledge Doc 로드 실패: ${filePath}`)
    }
  }

  switch (mode) {
    case 'REPORT':
    case 'PANEL':
      return buildSystemPrompt(protocol, [
        loadKnowledge('ai_generation_protocol-v3.2.md'),
        fs.readFileSync(path.join(writerDir, 'PROMPT_건축작가.txt'), 'utf-8'),
      ])

    case 'DRAWING':
      return buildSystemPrompt(protocol, [
        loadKnowledge('ai_generation_protocol-v3.2.md'),
      ])

    case 'VIDEO':
      return buildSystemPrompt(protocol, [
        loadKnowledge('video_generation_protocol.md'),
      ])
  }
}
