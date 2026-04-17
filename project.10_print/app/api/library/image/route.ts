/**
 * GET /api/library/image?folder=<name>&file=<filename>
 * sources/library/<folder>/<file> 이미지 파일을 스트리밍 반환.
 * Path traversal 방지: 해석된 절대 경로가 LIBRARY_DIR 하위인지 검증.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const LIBRARY_DIR = path.resolve(process.cwd(), 'sources', 'library')

const MIME: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const folder = searchParams.get('folder') ?? ''
  const file   = searchParams.get('file')

  if (!file) {
    return new NextResponse('Bad Request: Missing file parameter', { status: 400 })
  }

  const resolved = folder ? path.resolve(LIBRARY_DIR, folder, file) : path.resolve(LIBRARY_DIR, file)

  // Path traversal 방지
  if (!resolved.startsWith(LIBRARY_DIR + path.sep) && resolved !== LIBRARY_DIR) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (!fs.existsSync(resolved)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const ext      = path.extname(file).toLowerCase()
  const mimeType = MIME[ext] ?? 'application/octet-stream'
  const buffer   = fs.readFileSync(resolved)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':  mimeType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
