import { NextResponse } from 'next/server'
import { buildAgentSystemPrompt, buildVideoInjectionPrompt, loadTemplate, PrintMode } from '@/lib/prompt'
import { GoogleGenAI } from '@google/genai'

// 비디오 생성은 최대 5분 소요 — Vercel 등 서버리스 환경 대응
export const maxDuration = 300

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

// SECURITY.md §입력 검증
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_PROMPT_LENGTH = 2000
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// RELIABILITY.md §API 안정성
const API_TIMEOUT_MS = 30_000
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const mode = formData.get('mode') as PrintMode
    const promptText = (formData.get('prompt') as string) || ''
    const pageCount = formData.get('pageCount')
      ? parseInt(formData.get('pageCount') as string)
      : undefined

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
          { error: `이미지 크기는 10MB 이하여야 합니다. (${file.name})` },
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

    // VIDEO 모드 — Veo 3.1 Lite API (video_generation_protocol.md)
    if (mode === 'VIDEO') {
      const [startFile, endFile] = files

      // video_generation_protocol.md §II — VIDEO:INJECTION 블록 파싱 후 주입
      const fullPrompt = buildVideoInjectionPrompt(promptText)

      // 이미지 → base64
      const startBuf = await startFile.arrayBuffer()
      const endBuf   = await endFile.arrayBuffer()
      const startB64 = Buffer.from(startBuf).toString('base64')
      const endB64   = Buffer.from(endBuf).toString('base64')

      // Veo 3.1 Lite 비디오 생성 시작 (Long-running Operation)
      let operation = await withRetry(() =>
        withTimeout(
          ai.models.generateVideos({
            model:     'models/veo-3.1-lite-generate-preview',
            prompt:    fullPrompt,
            image: {
              imageBytes: startB64,
              mimeType:   startFile.type,
            },
            config: {
              aspectRatio:     '16:9',
              numberOfVideos:  1,
              durationSeconds: 8,
              lastFrame: {
                imageBytes: endB64,
                mimeType:   endFile.type,
              },
            },
          }),
          API_TIMEOUT_MS
        )
      )

      // 폴링 — 완료까지 대기 (최대 5분 = 30회 × 10초)
      const POLL_INTERVAL_MS = 10_000
      const MAX_POLLS        = 30

      for (let i = 0; i < MAX_POLLS && !operation.done; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
        operation = await ai.operations.getVideosOperation({ operation })
      }

      if (!operation.done) {
        throw new Error('비디오 생성 시간 초과 (5분). 잠시 후 다시 시도해 주세요.')
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri
      if (!videoUri) {
        throw new Error('Veo API에서 비디오 URI를 반환하지 않았습니다.')
      }

      return NextResponse.json({
        executionLog: {
          preStep: `시작 이미지: ${startFile.name} / 종료 이미지: ${endFile.name}`,
          step1:   '이미지 base64 변환 완료',
          step2:   `Veo 3.1 Lite 호출 완료 — 프롬프트 ${fullPrompt.length}자`,
          step3:   `Operation: ${operation.name ?? 'N/A'}`,
          step4:   '비디오 생성 완료 (폴링 종료)',
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
      ? `\n\n[LAYOUT TEMPLATE]\n아래 HTML 템플릿의 시각 구조와 슬롯 배치를 유지하여 완성 HTML을 생성하라. <script> 태그는 브라우저 렌더링용이므로 콘텐츠 생성 시 무시한다. img-box 클래스 div는 이미지 슬롯이며 slotMapping에 기록한다.\n\n${templateHtml}`
      : ''

    // --- Multi-Agent Pipeline ---
    // 에이전트별 섹션 시스템 프롬프트를 빌드한다.
    // 실패 시 [FATAL] 오류를 던져 파이프라인을 즉시 중단한다.
    const sysAgent1 = buildAgentSystemPrompt('1')
    const sysAgent2 = buildAgentSystemPrompt('2')
    const sysAgent3 = buildAgentSystemPrompt('3')

    // Gemini 단일 에이전트 호출 헬퍼
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function callAgent(systemInstruction: string, contents: any[], responseSchema: object) {
      const res = await withRetry(() =>
        withTimeout(
          ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents,
            config: { systemInstruction, temperature: 0.2, responseMimeType: 'application/json', responseSchema },
          }),
          API_TIMEOUT_MS
        )
      )
      if (!res.text) throw new Error('Gemini API에서 빈 응답을 반환했습니다.')
      return JSON.parse(res.text)
    }

    // ── AGENT-1: Input 분석 (이미지 분류 + OCR + 마스터 데이터) ──────────────
    const agent1 = await callAgent(
      sysAgent1,
      [...contentsParts, { text: `Mode: ${mode}, PageCount: ${pageCount ?? 'N/A'}, UserPrompt: ${promptText}` }],
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
                category:      { type: 'STRING' },  // A | B | C
                level:         { type: 'STRING' },  // L1 | L2 | L3 | L4
                priorityScore: { type: 'NUMBER' },
                qualityScore:  { type: 'NUMBER' },
                visionTags:    { type: 'ARRAY', items: { type: 'STRING' } },
                isHero:        { type: 'BOOLEAN' },
                fitMode:       { type: 'STRING' },  // Cover | Contain
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
          logPreStep: { type: 'STRING' }, // 이미지별 Category/Level/Score 분류 결과
          logStep1:   { type: 'STRING' }, // OCR 파싱 결과 (L3 없으면 "SKIPPED")
          logStep2:   { type: 'STRING' }, // masterData 확정 근거 (최빈값 채택 기록)
        },
        required: ['images', 'masterData', 'logPreStep', 'logStep1', 'logStep2'],
      }
    )

    // ── AGENT-2 Phase 1: 레이아웃 계획 (슬롯 배치 + 물리적 제약 계산) ─────────
    const agent2Phase1 = await callAgent(
      sysAgent2,
      [{ text: `[SCHEMA A — AGENT-1 OUTPUT]\n${JSON.stringify(agent1)}\n\nMode: ${mode}, PageCount: ${pageCount ?? 'N/A'}${templatePart}` }],
      {
        type: 'OBJECT',
        properties: {
          templateType: { type: 'STRING' }, // report | panel-landscape | panel-portrait
          totalPages:   { type: 'NUMBER' },
          slots: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                slotId:          { type: 'STRING' },
                pageNumber:      { type: 'NUMBER' },
                role:            { type: 'STRING' }, // hero | intro | body | detail | caption | titleblock
                imageId:         { type: 'STRING', nullable: true },
                slotImageCount:  { type: 'NUMBER' }, // 해당 페이지/구획의 실제 배치 이미지 수
                maxLines:        { type: 'NUMBER' },
                maxCharsPerLine: { type: 'NUMBER' },
              },
              required: ['slotId', 'pageNumber', 'role', 'slotImageCount', 'maxLines', 'maxCharsPerLine'],
            },
          },
          logStep3: { type: 'STRING' }, // 슬롯 배치 결정 (슬롯 ID ↔ 이미지 대응)
        },
        required: ['templateType', 'totalPages', 'slots', 'logStep3'],
      }
    )

    // ── AGENT-3: 글 작성 (M3 분석, LOD 제어, 역방향 검증) ───────────────────
    const agent3 = await callAgent(
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
          logStep4: { type: 'STRING' }, // 텍스트 생성 결과 (LOD 레벨, 수량 동기화 기록)
        },
        required: ['texts', 'logStep4'],
      }
    )

    // ── AGENT-2 Phase 2: 최종 조립 (텍스트 → 슬롯 배치, 역방향 검증 후 HTML 완성) ─
    const agent2Phase2 = await callAgent(
      sysAgent2,
      [{ text: `[SCHEMA A — AGENT-1 OUTPUT]\n${JSON.stringify(agent1)}\n\n[SCHEMA B — AGENT-2 PHASE 1 OUTPUT]\n${JSON.stringify(agent2Phase1)}\n\n[SCHEMA C — AGENT-3 OUTPUT]\n${JSON.stringify(agent3)}${templatePart}` }],
      {
        type: 'OBJECT',
        properties: {
          html:        { type: 'STRING' },
          slotMapping: { type: 'OBJECT' },
          logStep5:    { type: 'STRING' }, // 역방향 검증 결과 (모순 교체 기록)
        },
        required: ['html', 'slotMapping', 'logStep5'],
      }
    )

    return NextResponse.json({
      executionLog: {
        preStep: agent1.logPreStep ?? '',
        step1:   agent1.logStep1   ?? '',
        step2:   agent1.logStep2   ?? '',
        step3:   agent2Phase1.logStep3  ?? '',
        step4:   agent3.logStep4        ?? '',
        step5:   agent2Phase2.logStep5  ?? '',
      },
      html:        agent2Phase2.html,
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
