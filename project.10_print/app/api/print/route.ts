import { NextResponse } from 'next/server'
import { buildAgentSystemPrompt, buildVideoInjectionPrompt, loadTemplate, PrintMode } from '@/lib/prompt'
import { GoogleGenAI } from '@google/genai'
import { fal, ApiError as FalApiError } from '@fal-ai/client'
import {
  AgentError,
  AgentLabel,
  AgentErrorType,
  validateSchema,
  ERROR_TYPE_MSG,
  AGENT_LABEL_KO,
} from '@/lib/agentErrors'

// 비디오 생성은 최대 5분 소요 — Vercel 등 서버리스 환경 대응
export const maxDuration = 300

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

// Kling O3 모델 ID (fal.ai)
const KLING_MODEL_ID = 'fal-ai/kling-video/v2.1/pro/image-to-video'

// fal.ai ApiError → 원인 진단용 상세 문자열 추출
function falErrorDetail(err: unknown): string {
  if (err instanceof FalApiError) {
    const bodyMsg =
      typeof err.body === 'object' && err.body !== null && 'detail' in err.body
        ? String((err.body as Record<string, unknown>).detail)
        : JSON.stringify(err.body ?? '')
    return `HTTP ${err.status}${err.requestId ? ` | requestId: ${err.requestId}` : ''} | ${bodyMsg || err.message}`
  }
  return err instanceof Error ? err.message : String(err)
}

// SECURITY.md §입력 검증
const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20MB
const MAX_PROMPT_LENGTH = 2000
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// RELIABILITY.md §API 안정성
const API_TIMEOUT_MS = 90_000
const MAX_RETRIES = 2

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`API 호출 시간 초과 (${ms / 1000}초)`)), ms)
  )
  return Promise.race([promise, timeout])
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt))
      }
    }
  }
  throw lastError
}

// ---------------------------------------------------------------------------
// 부분 실행 로그 타입 (실패 시점까지 완료된 단계 기록)
// ---------------------------------------------------------------------------
interface PartialLog {
  preStep?: string
  step1?: string
  step2?: string
  step3?: string
  step4?: string
}

// ---------------------------------------------------------------------------
// Agent 출력 타입 (callAgent responseSchema 와 1:1 대응)
// ---------------------------------------------------------------------------
interface Agent1ImageItem {
  id: string
  filename: string
  category: string
  level: string
  priorityScore: number
  qualityScore: number
  visionTags: string[]
  isHero: boolean
  fitMode: string
}
interface Agent1MasterData {
  projectName: string
  designer: string
  company: string
  address: string
  engineer: string
  approver: string
  scale: string
  drawingNumber: string
  sheetNumber: string
  originalFilename: string
}
interface Agent1Output {
  images: Agent1ImageItem[]
  masterData: Agent1MasterData
  logPreStep: string
  logStep1: string
  logStep2: string
}
interface Agent2Phase1SlotItem {
  slotId: string
  pageNumber: number
  role: string
  imageId?: string | null
  slotImageCount: number
  maxLines: number
  maxCharsPerLine: number
}
interface Agent2Phase1Output {
  templateType: string
  totalPages: number
  slots: Agent2Phase1SlotItem[]
  logStep3: string
}
interface Agent3TextItem {
  slotId: string
  content: string
  lineCount: number
}
interface Agent3Output {
  texts: Agent3TextItem[]
  logStep4: string
}
interface Agent2Phase2Output {
  html: string
  slotMapping: Record<string, string>
  logStep5: string
}

// ---------------------------------------------------------------------------
// Gemini 에이전트 호출 헬퍼 (에이전트 식별자 포함)
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callAgent(agentLabel: AgentLabel, systemInstruction: string, contents: any[], responseSchema: object): Promise<any> {
  let res: Awaited<ReturnType<typeof ai.models.generateContent>>

  try {
    res = await withRetry(() =>
      withTimeout(
        ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents,
          config: { systemInstruction, temperature: 0.2, responseMimeType: 'application/json', responseSchema },
        }),
        API_TIMEOUT_MS
      )
    )
  } catch (err) {
    // withTimeout이 던진 오류 → TIMEOUT, 그 외 → API_ERROR
    const isTimeout = err instanceof Error && err.message.includes('시간 초과')
    const errorType: AgentErrorType = isTimeout ? 'TIMEOUT' : 'API_ERROR'
    console.error(`[에이전트 오류] ${agentLabel} ${errorType}`, err)
    throw new AgentError(agentLabel, errorType, err)
  }

  if (!res.text) {
    console.error(`[에이전트 오류] ${agentLabel} EMPTY_RESPONSE`)
    throw new AgentError(agentLabel, 'EMPTY_RESPONSE', 'res.text is null or empty')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(res.text)
  } catch (err) {
    console.error(`[에이전트 오류] ${agentLabel} JSON_PARSE_ERROR`, res.text.slice(0, 200))
    throw new AgentError(agentLabel, 'JSON_PARSE_ERROR', err)
  }

  return parsed
}

// ---------------------------------------------------------------------------
// AgentError → 구조화 오류 응답 생성
// ---------------------------------------------------------------------------
function makeAgentErrorResponse(err: AgentError, partialLog: PartialLog) {
  const labelKo = AGENT_LABEL_KO[err.agentLabel]
  const guidance = ERROR_TYPE_MSG[err.errorType]
  return NextResponse.json(
    {
      error: `${labelKo} 단계에서 오류가 발생했습니다. ${guidance}`,
      failedAgent: err.agentLabel,
      errorType: err.errorType,
      partialLog,
    },
    { status: 500 }
  )
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const mode = formData.get('mode') as PrintMode
    const promptText = (formData.get('prompt') as string) || ''
    const pageCountRaw = formData.get('pageCount')
    const pageCountParsed = pageCountRaw ? parseInt(pageCountRaw as string, 10) : undefined
    const pageCount = pageCountParsed !== undefined && !isNaN(pageCountParsed) ? pageCountParsed : undefined

    const files = formData.getAll('images') as File[]

    if (!mode || files.length === 0) {
      return NextResponse.json(
        { error: 'mode와 최소 1장의 이미지가 필요합니다.' },
        { status: 400 }
      )
    }

    // SECURITY.md §입력 검증 — 텍스트 길이
    if (promptText.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `프롬프트는 ${MAX_PROMPT_LENGTH}자 이하로 입력하세요.` },
        { status: 400 }
      )
    }

    // SECURITY.md §입력 검증 — 이미지 타입 및 크기
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `허용되지 않는 파일 형식입니다. JPEG, PNG, WebP만 가능합니다. (${file.name})` },
          { status: 400 }
        )
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: `이미지 크기는 20MB 이하여야 합니다. (${file.name})` },
          { status: 400 }
        )
      }
    }

    if (mode === 'VIDEO' && files.length !== 2) {
      return NextResponse.json(
        { error: 'VIDEO 모드는 정확히 2장의 이미지가 필요합니다.' },
        { status: 400 }
      )
    }

    // VIDEO 모드 — Kling O3 (fal.ai)
    if (mode === 'VIDEO') {
      const falKey = process.env.FAL_KEY
      if (!falKey) {
        return NextResponse.json({ error: 'FAL_KEY 환경변수가 설정되지 않았습니다.' }, { status: 500 })
      }
      fal.config({ credentials: falKey })

      const [startFile, endFile] = files
      const fullPrompt = buildVideoInjectionPrompt(promptText)

      // fal.ai Storage에 이미지 업로드 (시작/종료 프레임)
      const startBuf  = await startFile.arrayBuffer()
      const endBuf    = await endFile.arrayBuffer()
      const startBlob = new Blob([startBuf], { type: startFile.type })
      const endBlob   = new Blob([endBuf],   { type: endFile.type })

      let startImageUrl: string
      let endImageUrl: string
      try {
        ;[startImageUrl, endImageUrl] = await Promise.all([
          fal.storage.upload(startBlob),
          fal.storage.upload(endBlob),
        ])
      } catch (uploadErr) {
        const detail = falErrorDetail(uploadErr)
        return NextResponse.json(
          { error: `[이미지 업로드 실패] fal.ai Storage 업로드 중 오류가 발생했습니다. ${detail}` },
          { status: 500 }
        )
      }

      // Kling O3 비디오 생성 (완료까지 폴링)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (fal as any).subscribe(KLING_MODEL_ID, {
          input: {
            prompt:         fullPrompt,
            image_url:      startImageUrl,
            tail_image_url: endImageUrl,
            duration:       '5',
            aspect_ratio:   '16:9',
          },
          logs: true,
        })
      } catch (modelErr) {
        const detail = falErrorDetail(modelErr)
        return NextResponse.json(
          { error: `[비디오 생성 실패] Kling O3 모델 호출 중 오류가 발생했습니다. ${detail}` },
          { status: 500 }
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result?.data as any
      const videoUri: string | undefined = data?.video?.url ?? data?.video_url

      if (!videoUri) {
        throw new Error('Kling O3 API에서 비디오 URL을 반환하지 않았습니다. (requestId: ' + (result?.requestId ?? 'N/A') + ')')
      }

      return NextResponse.json({
        executionLog: {
          preStep: `시작 이미지: ${startFile.name} / 종료 이미지: ${endFile.name}`,
          step1:   '이미지 fal.ai Storage 업로드 완료',
          step2:   `Kling O3 호출 완료 — 프롬프트 ${fullPrompt.length}자`,
          step3:   `requestId: ${result?.requestId ?? 'N/A'}`,
          step4:   '비디오 생성 완료',
          step5:   'videoUri 수신 완료',
        },
        html:        '',
        slotMapping: {},
        masterData:  {},
        videoUri,
      })
    }

    // 파일 → base64 변환
    const contentsParts: { inlineData: { data: string; mimeType: string } }[] = []
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      contentsParts.push({
        inlineData: {
          data: Buffer.from(buffer).toString('base64'),
          mimeType: file.type,
        },
      })
    }

    const templateHtml = loadTemplate(mode)
    const templatePart = templateHtml
      ? `\n\n[LAYOUT TEMPLATE]\n아래 HTML 템플릿의 시각 구조와 슬롯 배치를 유지하여 완성 HTML을 생성하라. <script> 태그는 브라우저 렌더링용이므로 콘텐츠 생성 시 무시한다. img-box 클래스 div는 이미지 슬롯이며 slotMapping에 기록한다. 이미지 슬롯 요소(img 태그 또는 img-box div 내부 img)의 src 속성에는 Schema A images[].id 값을 그대로 사용하라 (예: src="img_0"). 이미지 데이터는 서버 후처리로 주입된다.\n\n${templateHtml}`
      : ''

    const sysAgent1 = buildAgentSystemPrompt('1')
    const sysAgent2 = buildAgentSystemPrompt('2')
    const sysAgent3 = buildAgentSystemPrompt('3')

    const currentDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    })

    // 부분 실행 로그 — 실패 시점까지 완료된 단계를 축적
    const partialLog: PartialLog = {}

    // ── AGENT-1: Input 분석 ───────────────────────────────────────────────
    let agent1!: Agent1Output
    try {
      agent1 = await callAgent(
        'AGENT-1',
        sysAgent1,
        [...contentsParts, { text: `Mode: ${mode}, PageCount: ${pageCount ?? 'N/A'}, UserPrompt: ${promptText}, CurrentDate: ${currentDate}` }],
        {
          type: 'OBJECT',
          properties: {
            images: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id:            { type: 'STRING' },
                  filename:      { type: 'STRING' },
                  category:      { type: 'STRING' },
                  level:         { type: 'STRING' },
                  priorityScore: { type: 'NUMBER' },
                  qualityScore:  { type: 'NUMBER' },
                  visionTags:    { type: 'ARRAY', items: { type: 'STRING' } },
                  isHero:        { type: 'BOOLEAN' },
                  fitMode:       { type: 'STRING' },
                },
                required: ['id', 'filename', 'category', 'level', 'priorityScore', 'qualityScore', 'visionTags', 'isHero', 'fitMode'],
              },
            },
            masterData: {
              type: 'OBJECT',
              properties: {
                projectName:      { type: 'STRING' },
                designer:         { type: 'STRING' },
                company:          { type: 'STRING' },
                address:          { type: 'STRING' },
                engineer:         { type: 'STRING' },
                approver:         { type: 'STRING' },
                scale:            { type: 'STRING' },
                drawingNumber:    { type: 'STRING' },
                sheetNumber:      { type: 'STRING' },
                originalFilename: { type: 'STRING' },
              },
              required: ['projectName', 'designer', 'company', 'address', 'engineer', 'approver', 'scale', 'drawingNumber', 'sheetNumber', 'originalFilename'],
            },
            logPreStep: { type: 'STRING' },
            logStep1:   { type: 'STRING' },
            logStep2:   { type: 'STRING' },
          },
          required: ['images', 'masterData', 'logPreStep', 'logStep1', 'logStep2'],
        }
      )
      validateSchema(agent1, ['images', 'masterData'], 'AGENT-1')
    } catch (err) {
      if (err instanceof AgentError) return makeAgentErrorResponse(err, partialLog)
      throw err
    }

    partialLog.preStep = agent1.logPreStep ?? ''
    partialLog.step1   = agent1.logStep1   ?? ''
    partialLog.step2   = agent1.logStep2   ?? ''

    // ── AGENT-2 Phase 1: 레이아웃 계획 ───────────────────────────────────
    let agent2Phase1!: Agent2Phase1Output
    try {
      agent2Phase1 = await callAgent(
        'AGENT-2-P1',
        sysAgent2,
        [{ text: `[SCHEMA A — AGENT-1 OUTPUT]\n${JSON.stringify(agent1)}\n\nMode: ${mode}, PageCount: ${pageCount ?? 'N/A'}${templatePart}` }],
        {
          type: 'OBJECT',
          properties: {
            templateType: { type: 'STRING' },
            totalPages:   { type: 'NUMBER' },
            slots: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  slotId:          { type: 'STRING' },
                  pageNumber:      { type: 'NUMBER' },
                  role:            { type: 'STRING' },
                  imageId:         { type: 'STRING', nullable: true },
                  slotImageCount:  { type: 'NUMBER' },
                  maxLines:        { type: 'NUMBER' },
                  maxCharsPerLine: { type: 'NUMBER' },
                },
                required: ['slotId', 'pageNumber', 'role', 'slotImageCount', 'maxLines', 'maxCharsPerLine'],
              },
            },
            logStep3: { type: 'STRING' },
          },
          required: ['templateType', 'totalPages', 'slots', 'logStep3'],
        }
      )
      validateSchema(agent2Phase1, ['templateType', 'totalPages', 'slots'], 'AGENT-2-P1')
    } catch (err) {
      if (err instanceof AgentError) return makeAgentErrorResponse(err, partialLog)
      throw err
    }

    partialLog.step3 = agent2Phase1.logStep3 ?? ''

    // ── AGENT-3: 글 작성 ─────────────────────────────────────────────────
    let agent3!: Agent3Output
    try {
      agent3 = await callAgent(
        'AGENT-3',
        sysAgent3,
        [{ text: `[SCHEMA A — AGENT-1 OUTPUT]\n${JSON.stringify(agent1)}\n\n[SCHEMA B — AGENT-2 PHASE 1 OUTPUT]\n${JSON.stringify(agent2Phase1)}\n\nMode: ${mode}, UserPrompt: ${promptText}` }],
        {
          type: 'OBJECT',
          properties: {
            texts: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  slotId:    { type: 'STRING' },
                  content:   { type: 'STRING' },
                  lineCount: { type: 'NUMBER' },
                },
                required: ['slotId', 'content', 'lineCount'],
              },
            },
            logStep4: { type: 'STRING' },
          },
          required: ['texts', 'logStep4'],
        }
      )
      validateSchema(agent3, ['texts'], 'AGENT-3')
    } catch (err) {
      if (err instanceof AgentError) return makeAgentErrorResponse(err, partialLog)
      throw err
    }

    partialLog.step4 = agent3.logStep4 ?? ''

    // ── AGENT-2 Phase 2: 최종 조립 ────────────────────────────────────────
    let agent2Phase2!: Agent2Phase2Output
    try {
      agent2Phase2 = await callAgent(
        'AGENT-2-P2',
        sysAgent2,
        [{ text: `[SCHEMA A — AGENT-1 OUTPUT]\n${JSON.stringify(agent1)}\n\n[SCHEMA B — AGENT-2 PHASE 1 OUTPUT]\n${JSON.stringify(agent2Phase1)}\n\n[SCHEMA C — AGENT-3 OUTPUT]\n${JSON.stringify(agent3)}${templatePart}` }],
        {
          type: 'OBJECT',
          properties: {
            html:        { type: 'STRING' },
            slotMapping: { type: 'OBJECT' },
            logStep5:    { type: 'STRING' },
          },
          required: ['html', 'slotMapping', 'logStep5'],
        }
      )
      validateSchema(agent2Phase2, ['html', 'slotMapping'], 'AGENT-2-P2')
    } catch (err) {
      if (err instanceof AgentError) return makeAgentErrorResponse(err, partialLog)
      throw err
    }

    // ── 이미지 후처리: src="imageId" → src="data:...;base64,..." 직접 치환 ─
    const imageDataMap: Record<string, string> = {};
    agent1.images.forEach((img, idx) => {
      if (idx < contentsParts.length) {
        const { data, mimeType } = contentsParts[idx].inlineData
        imageDataMap[img.id] = `data:${mimeType};base64,${data}`
      }
    })

    let finalHtml = agent2Phase2.html ?? ''
    for (const [imageId, dataUri] of Object.entries(imageDataMap)) {
      finalHtml = finalHtml.split(`src="${imageId}"`).join(`src="${dataUri}"`)
    }

    return NextResponse.json({
      executionLog: {
        preStep: agent1.logPreStep      ?? '',
        step1:   agent1.logStep1        ?? '',
        step2:   agent1.logStep2        ?? '',
        step3:   agent2Phase1.logStep3  ?? '',
        step4:   agent3.logStep4        ?? '',
        step5:   agent2Phase2.logStep5  ?? '',
      },
      html:        finalHtml,
      slotMapping: agent2Phase2.slotMapping,
      masterData:  agent1.masterData,
      videoUri:    null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '서버 처리 중 오류가 발생했습니다.'
    console.error('[API Error]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
