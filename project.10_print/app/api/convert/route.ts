import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

/**
 * app/api/convert/route.ts — Convertio API 연동 엔드포인트
 * 
 * 역할:
 *  1. 클라이언트로부터 전송된 도면 캡처 데이터(Base64) 수신
 *  2. Convertio API를 호출하여 DXF 변환 작업 생성
 *  3. 완료될 때까지 상태 폴링 (최대 60초)
 *  4. 변환된 DXF 파일을 클라이언트로 스트림 전달
 * 
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

const API_KEY = process.env.CONVERTIO_API_KEY
const CONVERTIO_URL = 'https://api.convertio.co/convert'
const STATUS_CHECK_INTERVAL_MS = 2000
const MAX_POLLING_ATTEMPTS = 30 // 60초 (30 * 2s)

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Convertio API Key가 설정되지 않았습니다.' }, { status: 500 })
  }

  try {
    const { file, filename } = await req.json()

    if (!file) {
      return NextResponse.json({ error: '전송된 파일 데이터가 없습니다.' }, { status: 400 })
    }

    // 1. 클라이언트 데이터 파싱 및 Sharp 전처리
    const base64Parts = file.split(',')
    const base64Data = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0]
    const buffer = Buffer.from(base64Data, 'base64')

    const processedBuffer = await sharp(buffer)
      .grayscale()
      .median(3)          // 선의 자잘한 떨림(노이즈) 제거
      .threshold(180)     // 뚜렷한 흑백 분리
      .png()
      .toBuffer()

    const finalBase64 = processedBuffer.toString('base64')

    // 2. 변환 작업 생성 요청
    const createRes = await fetch(CONVERTIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: API_KEY,
        input: 'base64',
        file: finalBase64,
        filename: filename || 'drawing.png',
        outputformat: 'dxf',
        from_format: 'png'
      })
    })

    const createData = await createRes.json()

    if (createData.status !== 'ok') {
      return NextResponse.json({ error: `Convertio 작업 생성 실패: ${createData.error || '알 수 없는 오류'}` }, { status: 500 })
    }

    const taskId = createData.data.id

    // 3. 상태 폴링 (비동기 처리)
    let outputUrl = null
    for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, STATUS_CHECK_INTERVAL_MS))

      const statusRes = await fetch(`${CONVERTIO_URL}/${taskId}/status`)
      const statusData = await statusRes.json()

      if (statusData.status !== 'ok') {
        return NextResponse.json({ error: `변환 상태 확인 중 오류: ${statusData.error}` }, { status: 500 })
      }

      if (statusData.data.step === 'finish') {
        outputUrl = statusData.data.output.url
        break
      } else if (statusData.data.step === 'failed') {
        return NextResponse.json({ error: `변환 작업 실패: ${statusData.data.message || '알 수 없는 오류'}` }, { status: 500 })
      }
    }

    if (!outputUrl) {
      return NextResponse.json({ error: '변환 작업 타임아웃' }, { status: 504 })
    }

    // 4. 변환된 파일 다운로드 및 반환
    const fileRes = await fetch(outputUrl)
    if (!fileRes.ok) {
      return NextResponse.json({ error: `변환 파일 다운로드 실패: ${fileRes.status}` }, { status: 502 })
    }
    const fileBlob = await fileRes.blob()

    const safeName = (filename ?? 'drawing').replace(/\.[^/.]+$/, '')

    return new NextResponse(fileBlob, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeName}.dxf"`
      }
    })

  } catch (err) {
    console.error('DXF 변환 오류:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : '알 수 없는 서버 오류' }, { status: 500 })
  }
}
