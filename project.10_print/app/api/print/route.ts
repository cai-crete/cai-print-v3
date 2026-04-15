import { NextResponse } from 'next/server'
import { buildPrintSystemPrompt, PrintMode } from '@/lib/prompt'
import { GoogleGenAI } from '@google/genai'

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

    // VIDEO 모드 — Veo API 연동 예정 (Stage 3)
    if (mode === 'VIDEO') {
      return NextResponse.json(
        { error: 'VIDEO 모드는 현재 준비 중입니다 (Veo API 연동 예정).' },
        { status: 501 }
      )
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

    // RELIABILITY.md §Protocol 주입 실패 — null 방어
    const systemInstruction = buildPrintSystemPrompt(mode)
    if (!systemInstruction) {
      throw new Error('[FATAL] 시스템 프롬프트 로드 실패')
    }

    const userText = `Mode: ${mode}, PageCount: ${pageCount ?? 'N/A'}, Prompt: ${promptText}`

    // RELIABILITY.md §API 안정성 — timeout 30s + 재시도 2회 지수 백오프
    const response = await withRetry(() =>
      withTimeout(
        ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: [...contentsParts, { text: userText }],
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                html: { type: 'STRING' },
                slotMapping: { type: 'OBJECT' },
                masterData: { type: 'OBJECT' },
                videoUri: { type: 'STRING', nullable: true },
              },
              required: ['html', 'slotMapping', 'masterData'],
            },
          },
        }),
        API_TIMEOUT_MS
      )
    )

    const textResponse = response.text
    if (!textResponse) {
      throw new Error('Gemini API에서 빈 응답을 반환했습니다.')
    }

    return NextResponse.json(JSON.parse(textResponse))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '서버 처리 중 오류가 발생했습니다.'
    console.error('[API Error]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
