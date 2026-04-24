import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 허용된 Origin 목록 (Canvas 운영 및 로컬 개발 환경)
const ALLOWED_ORIGINS = [
  'https://cai-canvas-v2.vercel.app',
  'http://localhost:3900',
]

export function middleware(request: NextRequest) {
  // API 경로에만 미들웨어 적용
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ── 요청 수신 로깅 ──
  const origin = request.headers.get('origin') ?? ''
  const contentLength = request.headers.get('content-length') ?? 'unknown'
  const hasSecret = request.headers.has('x-canvas-api-secret')
  console.log(`\n[print-server] ▶ ${request.method} ${request.nextUrl.pathname}`)
  console.log(`[print-server]   Origin: ${origin || '(same-origin)'}`)
  console.log(`[print-server]   Content-Length: ${contentLength}, Secret: ${hasSecret ? 'YES' : 'NO'}`)
  
  // 1. CORS Preflight (OPTIONS) 요청 처리
  if (request.method === 'OPTIONS') {
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin)
    
    // 허용되지 않은 Origin에서의 브라우저 Preflight 요청 차단
    if (origin && !isAllowedOrigin) {
      return new NextResponse(null, { status: 403 })
    }
    
    const preflightHeaders = new Headers()
    preflightHeaders.set('Access-Control-Allow-Origin', origin || '*')
    preflightHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    preflightHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-canvas-api-secret')
    preflightHeaders.set('Access-Control-Max-Age', '86400')
    
    return new NextResponse(null, { headers: preflightHeaders })
  }

  // 2. 본 요청에 대한 CORS 헤더 설정
  const response = NextResponse.next()
  if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-canvas-api-secret')
  }

  // 3. API 시크릿 보안 검증 (cross-origin 요청에만 적용)
  // same-origin 요청(standalone 모드)에서는 브라우저가 Origin 헤더를 보내지 않으므로 검증 생략
  const secretKey = process.env.CANVAS_API_SECRET
  if (secretKey && origin) {
    const providedSecret = request.headers.get('x-canvas-api-secret')
    if (!providedSecret || providedSecret !== secretKey) {
      return NextResponse.json(
        { error: 'Unauthorized: 유효하지 않은 API 시크릿입니다.' },
        { status: 401 }
      )
    }
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
