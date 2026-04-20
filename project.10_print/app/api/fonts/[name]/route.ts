import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

/**
 * app/api/fonts/[name]/route.ts — 폰트 파일을 읽어서 전달하는 API
 * jsPDF 한글 임베딩을 위해 클라이언트에서 폰트 바이너리에 접근할 수 있게 한다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name: fontName } = await params
  const fontPath = path.join(process.cwd(), 'sources', 'fonts', fontName)

  if (!fs.existsSync(fontPath)) {
    return NextResponse.json({ error: 'Font not found' }, { status: 404 })
  }

  const fontBuffer = fs.readFileSync(fontPath)
  return new NextResponse(fontBuffer, {
    headers: {
      'Content-Type': 'font/otf',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
