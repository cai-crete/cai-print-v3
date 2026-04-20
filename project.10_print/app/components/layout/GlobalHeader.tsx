'use client'

/**
 * GlobalHeader.tsx — 상단 고정 헤더 (System Layer: z-10)
 * design-style-guide.md §9.1 기준: 높이 3.5rem, bg #FFFFFF, border-b #EEEEEE
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'

interface GlobalHeaderProps {
  /** 현재 생성 상태 표시 (선택) */
  status?: 'idle' | 'generating' | 'error'
}

export default function GlobalHeader({ status = 'idle' }: GlobalHeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 flex items-center px-6"
      style={{
        height: 'var(--header-h)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-100)',
        zIndex: 'var(--z-system)',
      }}
    >
      {/* 서비스 로고 */}
      <h1 className="text-ui-title select-none flex items-baseline">
        CAI CANVAS&nbsp;
        <span className="text-ui-title">
          |&nbsp;PRINT
        </span>
        <span className="ml-1 text-[10px] font-pretendard font-normal text-[--color-gray-400]">
          VER.3
        </span>
      </h1>

      {/* 우측 상태 표시 영역 (status가 있을 때만 렌더링) */}
      {status !== 'idle' && (
        <div className="ml-auto flex items-center gap-2">
          {status === 'generating' && (
            <span
              className="text-xs"
              style={{ color: 'var(--color-focus)' }}
            >
              생성 중...
            </span>
          )}
          {status === 'error' && (
            <span className="text-xs text-red-500">오류 발생</span>
          )}
        </div>
      )}
    </header>
  )
}
