'use client'

/**
 * PurposeSelector.tsx — PURPOSE 문서 모드 선택 버튼 그룹
 * references-contents.txt §우측 사이드바 PURPOSE:
 *   REPORT / DRAWING&SPECIFICATION / PANEL / VIDEO 버튼 4개
 * 첨부 이미지 기준:
 *   - 선택 버튼: 채워진 어두운 배경 + 흰 텍스트
 *   - PANEL 선택 시: LANDSCAPE / PORTRAIT 서브 토글 표시
 *   - VIDEO 선택 시: "16:9 | 720p | 8s" 스펙 설명 표시
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { PrintMode, PanelOrientation } from '@/lib/types'

interface PurposeSelectorProps {
  label: string
  mode: PrintMode
  orientation: PanelOrientation
  onModeChange: (mode: PrintMode) => void
  onOrientationChange: (orientation: PanelOrientation) => void
}

/** 버튼 라벨 — 표시용 텍스트 */
const MODE_LABELS: Record<PrintMode, string> = {
  REPORT: 'REPORT',
  DRAWING: 'DRAWING & SPECIFICATION',
  PANEL: 'PANEL',
  VIDEO: 'VIDEO',
}

const MODES: PrintMode[] = ['REPORT', 'DRAWING', 'PANEL', 'VIDEO']

export default function PurposeSelector({
  label,
  mode,
  orientation,
  onModeChange,
  onOrientationChange,
}: PurposeSelectorProps) {
  return (
    <div>
      {/* 섹션 헤더 */}
      <span className="block mb-4 text-ui-subtitle tracking-widest text-[--color-gray-400]">
        {label}
      </span>

      {/* 모드 선택 버튼 목록 */}
      <div className="flex flex-col gap-2">
        {MODES.map((m) => {
          const isActive = mode === m
          return (
            <React.Fragment key={m}>
              <button
                onClick={() => onModeChange(m)}
                className="w-full text-ui-title transition-all flex items-center justify-center pt-0.5"
                style={{
                  height: 'var(--h-cta-lg)',
                  borderRadius: 'var(--radius-box)',
                  border: isActive
                    ? '1.5px solid var(--color-black)'
                    : '1.5px solid var(--color-gray-200)',
                  backgroundColor: isActive
                    ? 'var(--color-gray-100)'
                    : 'var(--color-white)',
                  color: 'var(--color-black)',
                  cursor: 'pointer',
                }}
              >
                {MODE_LABELS[m]}
              </button>

              {/* PANEL 선택 시: LANDSCAPE / PORTRAIT 서브 토글 */}
              {m === 'PANEL' && isActive && (
                <div className="flex gap-2 w-full mt-1 mb-1">
                  {(['LANDSCAPE', 'PORTRAIT'] as PanelOrientation[]).map((o) => {
                    const isSubActive = orientation === o
                    return (
                      <button
                        key={o}
                        onClick={() => onOrientationChange(o)}
                        className="flex-1 text-ui-title transition-all flex items-center justify-center pt-0.5"
                        style={{
                          height: 'var(--h-cta-lg)',
                          borderRadius: 'var(--radius-box)',
                          border: isSubActive
                            ? '1.5px solid var(--color-black)'
                            : '1.5px solid var(--color-gray-200)',
                          backgroundColor: isSubActive
                            ? 'var(--color-gray-100)'
                            : 'var(--color-white)',
                          color: 'var(--color-black)',
                          cursor: 'pointer',
                        }}
                      >
                        {o}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* VIDEO 선택 시: 스펙 안내 문구 */}
              {m === 'VIDEO' && isActive && (
                <p className="mt-1 text-center text-ui-caption" style={{ color: 'var(--color-text-caption)' }}>
                  16:9 | 720p | 8s
                </p>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
