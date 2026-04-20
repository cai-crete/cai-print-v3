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
import { DOC_SIZE, docSizeKey } from '@/lib/types'

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

/**
 * iframe srcdoc에 뷰어 통합 CSS를 주입한다.
 *
 * 세 템플릿(REPORT/PANEL/DRAWING)은 브라우저 단독 뷰어(어두운 body 배경 + 페이지 부유)를
 * 위해 설계되었으나, DocumentFrame은 iframe을 .page 물리 치수와 동일하게 sizing한다.
 * 이 불일치를 해소하기 위해:
 *   1. body 배경을 흰색으로 재정의 (어두운 배경이 상단 여백으로 노출되는 현상 제거)
 *   2. body padding / .page margin을 0으로 제거 (.page가 iframe (0,0)에서 시작하도록)
 *   3. .page box-shadow 제거 (iframe 내부에서 불필요한 장식)
 *   4. overflow:hidden으로 스크롤 차단
 */
function injectNoScroll(raw: string): string {
  const style = [
    '<style>',
    'html,body{overflow:hidden!important;padding:0!important;background:white!important;}',
    '.page{margin:0!important;box-shadow:none!important;}',
    '</style>',
  ].join('')
  if (raw.includes('</head>')) return raw.replace('</head>', `${style}</head>`)
  if (raw.includes('<head>'))  return raw.replace('<head>',  `<head>${style}`)
  return style + raw
}

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
          srcDoc={injectNoScroll(html)}
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