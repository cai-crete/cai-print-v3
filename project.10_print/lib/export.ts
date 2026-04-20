'use client'

/**
 * lib/export.ts — 문서 EXPORT 유틸리티
 *
 * REPORT / PANEL / DRAWING: html2canvas + jsPDF (PDF/JPG/PNG)
 * VIDEO: videoUri 직접 다운로드 (MP4)
 *
 * 렌더링 방식:
 *   히든 <iframe srcdoc={html}>를 오프스크린에 삽입 → onload 후
 *   html2canvas(iframe.contentDocument.body) 로 캡처.
 *   iframe은 app CSS와 격리된 same-origin 문서이므로 html2canvas 접근 가능.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { PrintMode, PanelOrientation, ExportFormat } from './types'
import { DOC_SIZE, docSizeKey } from './types'

const MM = 3.7795275591 // 1 mm → CSS px (96 dpi)
const IFRAME_LOAD_TIMEOUT_MS = 15_000
const RENDER_SETTLE_MS = 400 // 폰트·이미지 로딩 여유 시간

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

/**
 * 문서를 지정 포맷으로 내보낸다.
 *
 * @param html        Gemini가 생성한 완성 HTML 문자열 (REPORT/PANEL/DRAWING)
 * @param mode        현재 프린트 모드
 * @param orientation PANEL 모드 방향
 * @param format      내보낼 파일 형식
 * @param videoUri    VIDEO 모드일 때 MP4 URI (format === 'mp4' 전용)
 */
export async function exportDocument(
  html: string,
  mode: PrintMode,
  orientation: PanelOrientation,
  format: ExportFormat,
  videoUri?: string | null
): Promise<void> {
  if (format === 'mp4') {
    await exportVideo(videoUri)
    return
  }

  const key = docSizeKey(mode, orientation)
  const { w: docW, h: docH } = DOC_SIZE[key] ?? DOC_SIZE.REPORT

  const iframe = createHiddenIframe(html, docW, docH)
  document.body.appendChild(iframe)

  try {
    await waitForIframeLoad(iframe)
    await new Promise((r) => setTimeout(r, RENDER_SETTLE_MS))

    const iframeBody = iframe.contentDocument?.body
    if (!iframeBody) throw new Error('iframe 문서를 읽을 수 없습니다.')

    const filename = buildFilename(mode, format)

    if (format === 'pdf') {
      const canvas = await captureCanvas(iframeBody, docW, docH, 1)
      await exportPdf(canvas, docW, docH, filename)
    } else if (format === 'dxf') {
      const canvas = await captureCanvas(iframeBody, docW, docH, 1)
      await exportDxf(canvas, filename)
    } else {
      const canvas = await captureCanvas(iframeBody, docW, docH, 1)
      await exportImage(canvas, format, filename)
    }
  } finally {
    document.body.removeChild(iframe)
  }
}

/**
 * html2canvas를 이용한 캔버스 캡처 헬퍼
 */
async function captureCanvas(el: HTMLElement, w: number, h: number, scale: number): Promise<HTMLCanvasElement> {
  return await html2canvas(el, {
    width: w,
    height: h,
    scale: scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    windowWidth: w,
    windowHeight: h,
    logging: false,
  })
}

// ---------------------------------------------------------------------------
// 내부 헬퍼
// ---------------------------------------------------------------------------

function createHiddenIframe(html: string, w: number, h: number): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  // 화면 밖 오프스크린 배치 — visibility: hidden 금지 (렌더링 차단됨)
  iframe.style.cssText = [
    'position:fixed',
    `left:-${w + 500}px`,
    'top:0',
    `width:${w}px`,
    `height:${h}px`,
    'border:none',
    'overflow:hidden',
  ].join(';')
  iframe.srcdoc = html
  return iframe
}

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`문서 로드 타임아웃 (${IFRAME_LOAD_TIMEOUT_MS / 1000}초)`)),
      IFRAME_LOAD_TIMEOUT_MS
    )
    iframe.onload = () => {
      clearTimeout(timer)
      resolve()
    }
    iframe.onerror = () => {
      clearTimeout(timer)
      reject(new Error('문서 로드 실패'))
    }
  })
}

async function exportPdf(
  canvas: HTMLCanvasElement,
  docW: number,
  docH: number,
  filename: string
): Promise<void> {
  const pdfW = Math.round(docW / MM) // px → mm
  const pdfH = Math.round(docH / MM)
  const imgData = canvas.toDataURL('image/jpeg', 0.92)

  const pdf = new jsPDF({
    orientation: docW >= docH ? 'landscape' : 'portrait',
    unit:        'mm',
    format:      [pdfW, pdfH],
    compress:    true,
  })
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH)
  pdf.save(filename)
}

async function exportImage(
  canvas: HTMLCanvasElement,
  format: 'jpg' | 'png',
  filename: string
): Promise<void> {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
  const quality  = format === 'png' ? undefined : 0.92

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('이미지 변환 실패')); return }
        const url = URL.createObjectURL(blob)
        triggerDownload(url, filename)
        URL.revokeObjectURL(url)
        resolve()
      },
      mimeType,
      quality
    )
  })
}

async function exportVideo(videoUri?: string | null): Promise<void> {
  if (!videoUri) {
    throw new Error('VIDEO 파일이 없습니다. (Veo API 연동은 Stage 6에서 구현 예정)')
  }
  triggerDownload(videoUri, `video_${Date.now()}.mp4`)
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * 캡처된 고해상도 이미지를 서버로 전송하여 DXF로 변환 및 다운로드 (전처리는 서버에서 수행)
 */
async function exportDxf(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  // JPEG 사용으로 페이로드 크기를 PNG 대비 ~80% 감소 (Vercel 4.5MB 한도 대응)
  const base64 = canvas.toDataURL('image/jpeg', 0.8)

  const res = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: base64,
      filename: filename,
      from_format: 'png'
    })
  })

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? ''
    const errorMsg = contentType.includes('application/json')
      ? (await res.json()).error
      : `서버 오류 (${res.status})`
    throw new Error(errorMsg || 'DXF 변환 서버 오류')
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  URL.revokeObjectURL(url)
}


function buildFilename(mode: PrintMode, format: ExportFormat): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const modeTag = mode.toLowerCase()
  return `${modeTag}_${ts}.${format}`
}