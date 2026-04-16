'use client'

/**
 * ActionButtons.tsx — GENERATE / EXPORT CTA 버튼
 * references-contents.txt §우측 사이드바 CTA:
 *   - GENERATE: AI가 문서/비디오 생성. 설정 조건 미충족 시 비활성.
 *   - EXPORT: 생성된 문서 추출 (.jpg, .png, .pdf, .mp4)
 * 첨부 이미지 기준:
 *   - GENERATE: 검정 배경, 캡슐형 캡슐, 흰 텍스트
 *   - EXPORT: 흰 배경, 검정 테두리, 검정 텍스트
 *   - 조건 미충족 시: GENERATE 회색/비활성
 * design-style-guide.md §9.2: --radius-pill 캡슐형 요소
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { ExportFormat } from '@/lib/types'

interface ActionButtonsProps {
  /** GENERATE 버튼 활성 조건 (이미지 선택 여부 등) */
  canGenerate: boolean
  /** 현재 생성 진행 중 여부 */
  isGenerating: boolean
  /** EXPORT 버튼 활성 조건 (result 존재 여부) */
  canExport: boolean
  onGenerate: () => void
  onExport: (format: ExportFormat) => void
}

export default function ActionButtons({
  canGenerate,
  isGenerating,
  canExport,
  onGenerate,
  onExport: _onExport,
}: ActionButtonsProps) {
  const generateDisabled = !canGenerate || isGenerating

  return (
    <div className="flex flex-col gap-2">
      {/* GENERATE */}
      <button
        onClick={onGenerate}
        disabled={generateDisabled}
        className="w-full text-ui-title transition-all flex items-center justify-center pt-1"
        style={{
          height: 'var(--h-cta-lg)',
          borderRadius: 'var(--radius-pill)',
          border: 'none',
          backgroundColor: generateDisabled
            ? 'var(--color-gray-200)'
            : 'var(--color-black)',
          color: generateDisabled
            ? 'var(--color-gray-300)'
            : 'var(--color-white)',
          cursor: generateDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {isGenerating ? 'GENERATING...' : 'GENERATE'}
      </button>

      {/* EXPORT */}
      <button
        disabled={!canExport}
        className="w-full text-ui-title transition-all flex items-center justify-center pt-1"
        style={{
          height: 'var(--h-cta-lg)',
          borderRadius: 'var(--radius-pill)',
          border: canExport
            ? '1.5px solid var(--color-black)'
            : '1.5px solid var(--color-gray-300)',
          backgroundColor: 'var(--color-white)',
          color: canExport
            ? 'var(--color-black)'
            : 'var(--color-gray-300)',
          cursor: canExport ? 'pointer' : 'not-allowed',
        }}
      >
        EXPORT
      </button>
    </div>
  )
}
