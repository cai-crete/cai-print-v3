import fs from 'fs'
import path from 'path'

const CONTEXT_DIR = path.join(process.cwd(), '_context', 'protocol')

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
 * VIDEO          : Protocol + video_generation_protocol
 */
export type PrintMode = 'REPORT' | 'PANEL' | 'DRAWING' | 'VIDEO'

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