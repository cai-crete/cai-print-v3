'use client'

/**
 * PrintCanvasSidebarPanel.tsx — Canvas 사이드바용 풀 패널
 *
 * 기존 sub-components를 그대로 import하여 조합 (복사 없음).
 * 내부에서 mode/prompt/images/pageCount를 소유하고,
 * GENERATE / LIBRARY 클릭 시 onAction 콜백으로 draft state를 상위에 전달한다.
 *
 * 레이아웃: Fixed Footer 패턴 (§6-B)
 *   - 스크롤 영역: PurposeSelector, ImageInsert, PageCountControl, PromptInput
 *   - 고정 footer: GENERATE, LIBRARY 버튼 (항상 하단 노출)
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useState, useCallback } from 'react'
import type { PrintMode, PanelOrientation } from '../lib/types'
import type { PrintCanvasSidebarPanelProps, PrintDraftState } from '../types/print-canvas'
import ImageInsert from '../app/components/sidebar/ImageInsert'
import PurposeSelector from '../app/components/sidebar/PurposeSelector'
import PageCountControl from '../app/components/sidebar/PageCountControl'
import PromptInput from '../app/components/sidebar/PromptInput'

export function PrintCanvasSidebarPanel({
  savedState,
  onAction,
  className,
}: PrintCanvasSidebarPanelProps) {
  const defaultMode: PrintMode = savedState?.mode ?? 'REPORT'

  const [mode, setMode]                         = useState<PrintMode>(defaultMode)
  const [orientation, setOrientation]           = useState<PanelOrientation>('LANDSCAPE')
  const [prompt, setPrompt]                     = useState(savedState?.prompt ?? '')
  const [pageCount, setPageCount]               = useState(defaultMode === 'REPORT' ? 6 : 1)
  const [images, setImages]                     = useState<File[]>([])
  const [videoStartImage, setVideoStartImage]   = useState<File | null>(null)
  const [videoEndImage, setVideoEndImage]       = useState<File | null>(null)

  const handleModeChange = useCallback((newMode: PrintMode) => {
    setMode(newMode)
    setPageCount(newMode === 'REPORT' ? 6 : 1)
  }, [])

  const buildDraft = useCallback((): PrintDraftState => ({
    mode,
    orientation,
    prompt,
    images,
    videoStartImage,
    videoEndImage,
    pageCount,
  }), [mode, orientation, prompt, images, videoStartImage, videoEndImage, pageCount])

  const canGenerate = mode === 'VIDEO'
    ? (videoStartImage !== null && videoEndImage !== null)
    : images.length > 0

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* 스크롤 영역: 컨트롤들 */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '2rem',
      }}>
        <ImageInsert
          label="INSERT IMAGE"
          mode={mode}
          images={images}
          onImagesChange={setImages}
          videoStartImage={videoStartImage}
          videoEndImage={videoEndImage}
          onVideoStartChange={setVideoStartImage}
          onVideoEndChange={setVideoEndImage}
        />
        <PurposeSelector
          label="PURPOSE"
          mode={mode}
          orientation={orientation}
          onModeChange={handleModeChange}
          onOrientationChange={setOrientation}
        />
        <PageCountControl
          label="NUMBER OF PAGES"
          mode={mode}
          value={pageCount}
          onChange={setPageCount}
        />
        <PromptInput
          label="PROMPT"
          value={prompt}
          onChange={setPrompt}
        />
      </div>

      {/* 고정 footer: GENERATE / LIBRARY — 항상 하단 노출 (§6-B) */}
      <div style={{
        flexShrink: 0,
        padding: '1.25rem',
        borderTop: '1px solid var(--color-gray-100)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        <button
          onClick={() => onAction('generate', buildDraft())}
          disabled={!canGenerate}
          className="w-full text-ui-title transition-all flex items-center justify-center pt-1"
          style={{
            height:          'var(--h-cta-xl)',
            borderRadius:    'var(--radius-pill)',
            border:          'none',
            backgroundColor: canGenerate ? 'var(--color-black)' : 'var(--color-gray-200)',
            color:           canGenerate ? 'var(--color-white)' : 'var(--color-gray-300)',
            cursor:          canGenerate ? 'pointer' : 'not-allowed',
          }}
        >
          GENERATE
        </button>
        <button
          onClick={() => onAction('export', buildDraft())}
          disabled={!savedState}
          className="w-full text-ui-title transition-all flex items-center justify-center pt-1"
          style={{
            height:          'var(--h-cta-xl)',
            borderRadius:    'var(--radius-pill)',
            border:          !savedState ? '1.5px solid var(--color-gray-300)' : '1.5px solid var(--color-black)',
            backgroundColor: 'var(--color-white)',
            color:           !savedState ? 'var(--color-gray-300)' : 'var(--color-black)',
            cursor:          !savedState ? 'not-allowed' : 'pointer',
          }}
        >
          EXPORT
        </button>
      </div>

    </div>
  )
}