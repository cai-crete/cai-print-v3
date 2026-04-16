'use client'

/**
 * NodeSelector.tsx — 사이드바 상단 노드 전환 드롭다운
 * references-contents.txt §우측 1번:
 *   CAI의 10개 노드를 전환할 수 있는 탭.
 *   UI는 구현하되 실제 전환 기능은 비활성 (PRINT만 구현).
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'

interface NodeSelectorProps {
  /** 현재 활성 노드 이름. 이 프로젝트에서는 항상 'PRINT'. */
  currentNode?: string
}

export default function NodeSelector({ currentNode = 'PRINT' }: NodeSelectorProps) {
  return (
    <div
      className="flex items-center justify-between w-full"
      style={{ gap: '0.5rem' }}
    >
      {/* 노드 드롭다운 — UI만 구현, 전환 기능 비활성 */}
      <div
        className="flex items-center gap-1 flex-1 min-w-0"
        style={{
          height: 'var(--h-cta-lg)',
          border: 'none',
          borderRadius: 'var(--radius-box)',
          padding: '0 0.625rem',
          backgroundColor: 'transparent',
          cursor: 'default',
        }}
      >
        <span className="flex-1 text-[16pt] font-bebas truncate leading-none pt-0.5">
          {currentNode}
        </span>
        {/* 드롭다운 화살표 (비활성 상태) */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ color: 'var(--color-text-caption)', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  )
}
