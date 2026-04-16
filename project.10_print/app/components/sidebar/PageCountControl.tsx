'use client'

/**
 * PageCountControl.tsx — NUMBER OF PAGES 조절기
 * references-contents.txt §우측 사이드바 NUMBER OF PAGES:
 *   - VIDEO 모드: 삭제 (비표시)
 *   - DRAWING 모드: 1 고정 (비활성)
 *   - REPORT/PANEL: − / 숫자 / + 자유 조절
 * design-style-guide.md §9.2: 캡슐형 요소 —radius-pill
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { PrintMode } from '@/lib/types'

interface PageCountControlProps {
  mode: PrintMode
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export default function PageCountControl({
  mode,
  value,
  onChange,
  min = 1,
  max = 20,
}: PageCountControlProps) {
  /* VIDEO 모드: 섹션 전체 숨김 */
  if (mode === 'VIDEO') return null

  const isFixed = mode === 'DRAWING'
  const displayValue = isFixed ? 1 : value

  const decrement = () => {
    if (!isFixed && value > min) onChange(value - 1)
  }

  const increment = () => {
    if (!isFixed && value < max) onChange(value + 1)
  }

  return (
    <div>
      {/* 섹션 헤더 */}
      <span className="block mb-4 text-ui-subtitle tracking-widest text-[--color-gray-400]">
        NUMBER OF PAGES
      </span>

      <div
        className="flex items-center justify-between"
        style={{
          height: 'var(--h-cta-lg)',
          border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--radius-pill)',
          padding: '0 0.5rem',
          opacity: isFixed ? 0.5 : 1,
        }}
      >
        {/* 감소 버튼 */}
        <button
          onClick={decrement}
          disabled={isFixed || value <= min}
          className="flex items-center justify-center transition-colors"
          style={{
            width: '1.5rem',
            height: '1.5rem',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: isFixed || value <= min ? 'not-allowed' : 'pointer',
            opacity: isFixed || value <= min ? 0.3 : 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* 숫자 표시 */}
        <span
          className="text-sm font-semibold select-none"
          style={{
            minWidth: '2rem',
            textAlign: 'center',
            color: 'var(--color-text-primary)',
          }}
        >
          {displayValue}
        </span>

        {/* 증가 버튼 */}
        <button
          onClick={increment}
          disabled={isFixed || value >= max}
          className="flex items-center justify-center transition-colors"
          style={{
            width: '1.5rem',
            height: '1.5rem',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: isFixed || value >= max ? 'not-allowed' : 'pointer',
            opacity: isFixed || value >= max ? 0.3 : 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
