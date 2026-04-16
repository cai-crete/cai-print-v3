'use client'

/**
 * ActionButtons.tsx — GENERATE / EXPORT CTA 버튼
 *
 * EXPORT 클릭 시 모드별 포맷 드롭다운 표시:
 *   VIDEO 모드:         MP4
 *   REPORT/PANEL/DRAWING: PDF / JPG / PNG
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useState, useRef, useEffect } from 'react'
import type { ExportFormat, PrintMode } from '@/lib/types'

interface ActionButtonsProps {
  canGenerate:  boolean
  isGenerating: boolean
  canExport:    boolean
  isExporting:  boolean
  mode:         PrintMode
  onGenerate:   () => void
  onExport:     (format: ExportFormat) => void
}

/** 모드별 제공 포맷 */
const FORMAT_OPTIONS: Record<PrintMode, { label: string; value: ExportFormat }[]> = {
  REPORT:  [{ label: 'PDF', value: 'pdf' }, { label: 'JPG', value: 'jpg' }, { label: 'PNG', value: 'png' }],
  PANEL:   [{ label: 'PDF', value: 'pdf' }, { label: 'JPG', value: 'jpg' }, { label: 'PNG', value: 'png' }],
  DRAWING: [{ label: 'PDF', value: 'pdf' }, { label: 'JPG', value: 'jpg' }, { label: 'PNG', value: 'png' }],
  VIDEO:   [{ label: 'MP4', value: 'mp4' }],
}

export default function ActionButtons({
  canGenerate,
  isGenerating,
  canExport,
  isExporting,
  mode,
  onGenerate,
  onExport,
}: ActionButtonsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const generateDisabled = !canGenerate || isGenerating
  const exportDisabled   = !canExport || isExporting

  /** 외부 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  const handleFormatSelect = (format: ExportFormat) => {
    setIsDropdownOpen(false)
    onExport(format)
  }

  const formats = FORMAT_OPTIONS[mode]

  return (
    <div className="flex flex-col gap-2">
      {/* GENERATE */}
      <button
        onClick={onGenerate}
        disabled={generateDisabled}
        className="w-full text-ui-title transition-all flex items-center justify-center pt-1"
        style={{
          height:          'var(--h-cta-xl)',
          borderRadius:    'var(--radius-pill)',
          border:          'none',
          backgroundColor: generateDisabled ? 'var(--color-gray-200)' : 'var(--color-black)',
          color:           generateDisabled ? 'var(--color-gray-300)' : 'var(--color-white)',
          cursor:          generateDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {isGenerating ? 'GENERATING...' : 'GENERATE'}
      </button>

      {/* EXPORT + 포맷 드롭다운 */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => { if (!exportDisabled) setIsDropdownOpen((v) => !v) }}
          disabled={exportDisabled}
          className="w-full text-ui-title transition-all flex items-center justify-center pt-1"
          style={{
            height:          'var(--h-cta-xl)',
            borderRadius:    'var(--radius-pill)',
            border:          exportDisabled
              ? '1.5px solid var(--color-gray-300)'
              : '1.5px solid var(--color-black)',
            backgroundColor: 'var(--color-white)',
            color:           exportDisabled ? 'var(--color-gray-300)' : 'var(--color-black)',
            cursor:          exportDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {isExporting ? 'EXPORTING...' : 'EXPORT'}
        </button>

        {/* 포맷 드롭다운 */}
        {isDropdownOpen && (
          <div
            style={{
              position:        'absolute',
              bottom:          'calc(100% + 0.5rem)',
              left:            0,
              right:           0,
              backgroundColor: 'var(--color-white)',
              border:          '1px solid var(--color-border)',
              borderRadius:    'var(--radius-box)',
              boxShadow:       'var(--shadow-float)',
              overflow:        'hidden',
              zIndex:          200,
            }}
          >
            {formats.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleFormatSelect(value)}
                className="w-full text-left transition-colors"
                style={{
                  padding:         '0.6rem 1rem',
                  fontSize:        '0.8125rem',
                  fontWeight:      500,
                  letterSpacing:   '0.04em',
                  color:           'var(--color-text-primary)',
                  backgroundColor: 'transparent',
                  border:          'none',
                  cursor:          'pointer',
                  display:         'block',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-placeholder)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                }}
              >
                .{label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}