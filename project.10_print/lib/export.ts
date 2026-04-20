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

    // DXF 모드인 경우 캡처 해상도를 4배로 높여 선명도 확보
    const filename = buildFilename(mode, format)

    if (format === 'pdf') {
      const canvas = await captureCanvas(iframeBody, docW, docH, 1)
      await exportPdf(canvas, docW, docH, filename)
    } else if (format === 'dxf') {
      // SVG 방식은 캔버스 캡처가 필요 없으며 iframe 내 요소 데이터를 직접 활용함
      await exportDxf(iframeBody, filename)
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
 * iframe 내부의 정보를 바탕으로 좌표 기반의 Native SVG를 생성하여 서버로 전송, DXF로 변환한다.
 * 픽셀 데이터가 아닌 수치 좌표를 사용하므로 선의 쭈글거림이나 잘림 현상이 전혀 발생하지 않는다.
 */
async function exportDxf(iframeBody: HTMLElement, filename: string): Promise<void> {
  // 1. 도면 데이터 추출
  const margin = 7
  const pageWidth = 420
  const pageHeight = 297
  const titleBlockWidth = 40
  const innerWidth = pageWidth - (margin * 2)
  const innerHeight = pageHeight - (margin * 2)
  const drawingAreaWidth = innerWidth - titleBlockWidth

  // 2. 이미지 영역 추출 및 전처리 (Thresholding)
  const mainImg = iframeBody.querySelector('.drawing-area img') as HTMLImageElement
  let processedImgBase64 = ''
  if (mainImg) {
    const canvas = document.createElement('canvas')
    canvas.width = mainImg.naturalWidth
    canvas.height = mainImg.naturalHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(mainImg, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const threshold = 180
      for (let i = 0; i < data.length; i += 4) {
        const v = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
        const res = v > threshold ? 255 : 0
        data[i] = data[i + 1] = data[i + 2] = res
        data[i + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
      processedImgBase64 = canvas.toDataURL('image/png')
    }
  }

  // 3. SVG 소스 생성
  const svgLines: string[] = []
  svgLines.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  svgLines.push(`<svg width="${pageWidth}mm" height="${pageHeight}mm" viewBox="0 0 ${pageWidth} ${pageHeight}" xmlns="http://www.w3.org/2000/svg">`)
  
  // 배경 흰색
  svgLines.push(`  <rect x="0" y="0" width="${pageWidth}" height="${pageHeight}" fill="#ffffff" />`)
  
  // 외곽 테두리 (굵은 선)
  svgLines.push(`  <rect x="${margin}" y="${margin}" width="${innerWidth}" height="${innerHeight}" fill="none" stroke="#000000" stroke-width="0.5" />`)
  
  // 도면 영역과 도각 구분선
  svgLines.push(`  <line x1="${margin + drawingAreaWidth}" y1="${margin}" x2="${margin + drawingAreaWidth}" y2="${margin + innerHeight}" stroke="#000000" stroke-width="0.5" />`)

  // 이미지 삽입
  if (processedImgBase64) {
    svgLines.push(`  <image x="${margin + 2}" y="${margin + 2}" width="${drawingAreaWidth - 4}" height="${innerHeight - 4}" href="${processedImgBase64}" />`)
  }

  // 도각 텍스트 및 구분선 렌더링
  const sections = Array.from(iframeBody.querySelectorAll('.tb-section, .meta-section'))
  let currentY = margin

  sections.forEach((sec) => {
    const label = sec.querySelector('.tb-label')?.textContent?.trim() || ''
    const value = sec.querySelector('.tb-value')?.textContent?.trim() || ''
    const rect = sec.getBoundingClientRect()
    const hMm = rect.height * (25.4 / 96) // px to mm

    // 라벨 (캡션)
    svgLines.push(`  <text x="${margin + drawingAreaWidth + 2}" y="${currentY + 4}" font-family="Arial, sans-serif" font-size="2" font-weight="bold" fill="#000000">${label}</text>`)
    // 값 (본문)
    svgLines.push(`  <text x="${margin + drawingAreaWidth + 2}" y="${currentY + 9}" font-family="Arial, sans-serif" font-size="3.5" fill="#000000">${value}</text>`)

    currentY += hMm
    // 섹션 구분선
    svgLines.push(`  <line x1="${margin + drawingAreaWidth}" y1="${currentY}" x2="${margin + innerWidth}" y2="${currentY}" stroke="#000000" stroke-width="0.2" />`)
  })

  svgLines.push(`</svg>`)
  const svgSource = svgLines.join('\n')

  // 4. 서버 전송 및 DXF 변환
  const base64Svg = btoa(unescape(encodeURIComponent(svgSource)))
  
  const res = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: `data:image/svg+xml;base64,${base64Svg}`,
      filename: filename.replace('.dxf', '.svg'),
      from_format: 'svg'
    })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'DXF 변환 서버 오류')
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  URL.revokeObjectURL(url)
}

/**
 * 캔버스 피드백 루프를 위한 유틸리티 (필요 시 보존)
 */
function applyThresholdToCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.filter = 'blur(0.4px)'
  ctx.drawImage(canvas, 0, 0)
  ctx.filter = 'none' 
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const threshold = 180
  for (let i = 0; i < data.length; i += 4) {
    const v = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
    const res = v > threshold ? 255 : 0
    data[i] = data[i+1] = data[i+2] = res
    data[i+3] = 255 
  }
  ctx.putImageData(imageData, 0, 0)
}

/** 
 * iframe 내부의 모든 이미지를 흑백 임계값(Threshold) 처리한다.
 */
async function preprocessImagesInIframe(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'))
  
  for (const img of images) {
    try {
      if (!img.complete) {
        await new Promise((resolve) => { img.onload = resolve })
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) continue

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      const threshold = 200 
      for (let i = 0; i < data.length; i += 4) {
        const v = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
        const res = v > threshold ? 255 : 0
        data[i] = data[i + 1] = data[i + 2] = res
      }
      ctx.putImageData(imageData, 0, 0)
      img.src = canvas.toDataURL('image/png')
    } catch (e) {
      console.warn('이미지 전처리 실패:', e)
    }
  }
}

function buildFilename(mode: PrintMode, format: ExportFormat): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const modeTag = mode.toLowerCase()
  return `${modeTag}_${ts}.${format}`
}