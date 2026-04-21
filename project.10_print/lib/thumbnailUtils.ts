'use client'

/**
 * lib/thumbnailUtils.ts — 저장 문서 썸네일 생성 · 제목 추출 유틸
 *
 * - generateThumbnail: 첫 페이지 HTML을 hidden iframe에 렌더링 후 html2canvas로 캡처,
 *   4:3(320×240) letterbox 캔버스에 합성하여 JPEG base64 URL 반환.
 *   세로 비율 문서(PANEL Portrait 등)는 양옆을 회색으로 채운다.
 * - extractTitle: masterData.projectName → HTML <title> → 모드명 순으로 폴백.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import html2canvas from 'html2canvas'
import type { PrintResult, PrintMode, PanelOrientation } from './types'
import { DOC_SIZE, docSizeKey } from './types'

const THUMB_W = 320
const THUMB_H = 240 // 4:3 고정
const LETTERBOX_COLOR = '#e5e7eb'

/** 첫 페이지 HTML에서 썸네일 base64 JPEG URL을 생성한다. 실패 시 null 반환. */
export async function generateThumbnail(
  html: string,
  mode: PrintMode,
  orientation?: PanelOrientation
): Promise<string | null> {
  if (typeof window === 'undefined' || !html) return null

  const key = docSizeKey(mode, orientation)
  const { w: docW, h: docH } = DOC_SIZE[key] ?? DOC_SIZE.REPORT

  const iframe = document.createElement('iframe')
  iframe.style.cssText = [
    `position:fixed`,
    `left:${-(docW + 200)}px`,
    `top:0`,
    `width:${docW}px`,
    `height:${docH}px`,
    `pointer-events:none`,
    `border:none`,
    `z-index:-1`,
  ].join(';')

  document.body.appendChild(iframe)

  try {
    // HTML 주입 후 로드 + 렌더링 대기
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), 8000) // 최대 8초 대기
      iframe.onload = () => {
        clearTimeout(timer)
        setTimeout(() => resolve(), 400) // 폰트/이미지 렌더링 여유
      }
      iframe.srcdoc = html
    })

    const iframeDoc = iframe.contentDocument
    if (!iframeDoc) return null

    const captured = await html2canvas(iframeDoc.documentElement, {
      width:    docW,
      height:   docH,
      scale:    THUMB_W / docW,
      useCORS:  true,
      logging:  false,
      backgroundColor: '#ffffff',
    })

    // 4:3 letterbox 합성
    const thumbCanvas = document.createElement('canvas')
    thumbCanvas.width  = THUMB_W
    thumbCanvas.height = THUMB_H
    const ctx = thumbCanvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = LETTERBOX_COLOR
    ctx.fillRect(0, 0, THUMB_W, THUMB_H)

    const docRatio   = docW / docH
    const thumbRatio = THUMB_W / THUMB_H
    let drawW: number, drawH: number, drawX: number, drawY: number

    if (docRatio >= thumbRatio) {
      // 가로형(혹은 동일) — 위아래 여백
      drawW = THUMB_W
      drawH = THUMB_W / docRatio
      drawX = 0
      drawY = (THUMB_H - drawH) / 2
    } else {
      // 세로형 — 양옆 회색 여백
      drawH = THUMB_H
      drawW = THUMB_H * docRatio
      drawX = (THUMB_W - drawW) / 2
      drawY = 0
    }

    ctx.drawImage(captured, drawX, drawY, drawW, drawH)

    return thumbCanvas.toDataURL('image/jpeg', 0.65)
  } catch {
    return null
  } finally {
    document.body.removeChild(iframe)
  }
}

/** 문서 제목을 masterData.projectName → HTML <title> → 모드명 순으로 추출한다. */
export function extractTitle(result: PrintResult, mode: PrintMode): string {
  const pname = result.masterData?.projectName
  if (typeof pname === 'string' && pname.trim()) return pname.trim()

  if (result.html) {
    const m = result.html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (m?.[1]?.trim()) return m[1].trim()
  }

  return `${mode} 문서`
}
