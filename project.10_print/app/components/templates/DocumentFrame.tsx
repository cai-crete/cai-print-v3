'use client'

/**
 * DocumentFrame.tsx — 모드별 물리 치수 기반 자동 스케일링 렌더러
 *
 * 모든 문서 모드(REPORT A3 / PANEL A0 / DRAWING A3)는 물리 치수가 크게 다르지만
 * ResizeObserver로 캔버스 가용 영역을 측정하여 동일한 시각적 크기로 표시한다.
 *
 * 스케일 공식:
 *   scale = min(availableW / docW, availableH / docH) × 0.97
 *
 * 문서 물리 치수 (CSS px @ 96 dpi, 1 mm = 3.7795275591 px):
 *   REPORT / DRAWING : A3 Landscape  420 × 297 mm → 1587 × 1122 px
 *   PANEL Landscape  : A0 Landscape 1189 × 841 mm → 4494 × 3179 px
 *   PANEL Portrait   : A0 Portrait   841 × 1189 mm → 3179 × 4494 px
 *   VIDEO            : 16:9           1280 × 720 px  (고정)
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useEffect, useRef, useState } from 'react'
import type { PrintMode, PanelOrientation } from '@/lib/types'

// ---------------------------------------------------------------------------
// 상수
// ---------------------------------------------------------------------------

const MM = 3.7795275591 // 1 mm → CSS px (96 dpi 기준)

/** 모드별 문서 물리 치수 (CSS px) */
export const DOC_SIZE: Record<string, { w: number; h: number }> = {
  REPORT:          { w: Math.round(420 * MM), h: Math.round(297 * MM) },   // 1587 × 1122
  DRAWING:         { w: Math.round(420 * MM), h: Math.round(297 * MM) },   // 1587 × 1122
  PANEL_LANDSCAPE: { w: Math.round(1189 * MM), h: Math.round(841 * MM) },  // 4494 × 3179
  PANEL_PORTRAIT:  { w: Math.round(841 * MM),  h: Math.round(1189 * MM) }, // 3179 × 4494
  VIDEO:           { w: 1280, h: 720 },
}

/** DOC_SIZE 키 결정 헬퍼 */
export function docSizeKey(mode: PrintMode, orientation?: PanelOrientation): string {
  if (mode === 'PANEL') {
    return orientation === 'PORTRAIT' ? 'PANEL_PORTRAIT' : 'PANEL_LANDSCAPE'
  }
  return mode
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DocumentFrameProps {
  html: string
  mode: PrintMode
  orientation?: PanelOrientation
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentFrame({
  html,
  mode,
  orientation = 'LANDSCAPE',
}: DocumentFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const key       = docSizeKey(mode, orientation)
  const { w, h }  = DOC_SIZE[key] ?? DOC_SIZE.REPORT

  // 컨테이너 크기 변화 감지 → 스케일 재계산
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const recalc = () => {
      const aw = el.clientWidth
      const ah = el.clientHeight
      if (aw === 0 || ah === 0) return
      setScale(Math.min(aw / w, ah / h) * 0.97)
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, h])

  // 실제 표시 크기 (스케일 적용 후)
  const displayW = Math.round(w * scale)
  const displayH = Math.round(h * scale)

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 표시 크기에 맞춘 외부 컨테이너 — overflow hidden으로 iframe 경계 클리핑 */}
      <div
        style={{
          width:           displayW,
          height:          displayH,
          flexShrink:      0,
          overflow:        'hidden',
          backgroundColor: 'var(--color-doc-bg)',
          boxShadow:       'var(--shadow-float)',
        }}
      >
        {/*
         * iframe srcdoc: 생성된 HTML을 앱 스타일과 완전히 격리하여 렌더링한다.
         * transform scale로 iframe을 표시 크기에 맞게 축소한다.
         * transformOrigin: top left → 컨테이너 overflow hidden과 조합 시
         *   scale 후 잘려나가는 영역이 오른쪽·아래쪽에만 발생.
         */}
        <iframe
          srcDoc={html}
          title="document-preview"
          style={{
            width:           w,
            height:          h,
            border:          'none',
            display:         'block',
            transformOrigin: 'top left',
            transform:       `scale(${scale})`,
          }}
        />
      </div>
    </div>
  )
}