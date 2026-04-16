'use client'

/**
 * Canvas.tsx — 중앙 무한 캔버스 영역 (Canvas Layer: z-0)
 *
 * Stage 2 변경: artboard가 가용 공간 전체를 채우도록 수정.
 * DocumentFrame이 artboard 크기를 ResizeObserver로 측정하여
 * 모드별 물리 치수에 맞는 scale을 자체 계산한다.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'

interface CanvasProps {
  mode?: string
  children?: React.ReactNode
  isEmpty: boolean
  isLoading: boolean
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: '4rem',
          height: '4rem',
          backgroundColor: 'var(--color-placeholder)',
          color: 'var(--color-border)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="12" y2="17" />
        </svg>
      </div>
      <p className="text-base font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
        생성된 문서가 없습니다.
      </p>
      <p className="text-sm text-center leading-relaxed" style={{ color: 'var(--color-text-caption)' }}>
        우측 패널에서 설정을 마치고
        <br />
        GENERATE 버튼을 눌러주세요.
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      <div
        className="animate-spin rounded-full"
        style={{
          width: '2.5rem',
          height: '2.5rem',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-focus)',
        }}
      />
      <p className="text-sm" style={{ color: 'var(--color-text-caption)' }}>
        AI가 문서를 생성하고 있습니다...
      </p>
    </div>
  )
}

export default function Canvas({ children, isEmpty, isLoading }: CanvasProps) {
  return (
    <main
      className="fixed overflow-hidden"
      style={{
        top:    'var(--header-h)',
        right:  'var(--sidebar-spacing)',
        bottom: 'calc(var(--preview-h) + var(--gap-global))',
        left:   0,
        zIndex: 'var(--z-canvas)',
        backgroundColor: 'var(--color-app-bg)',
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
      }}
    >
      {/* 내부 여백 — absolute inset-0 으로 캔버스 전체 채움 */}
      <div
        className="absolute inset-0"
        style={{ padding: 'var(--gap-global)' }}
      >
        {isLoading ? (
          /* 로딩 상태: 전체 영역 중앙 정렬 */
          <div className="w-full h-full flex items-center justify-center">
            <LoadingState />
          </div>
        ) : isEmpty ? (
          /* 빈 상태: 전체 영역 중앙 정렬 */
          <div className="w-full h-full flex items-center justify-center">
            <EmptyState />
          </div>
        ) : (
          /* 문서 표시: artboard가 가용 공간 전체를 차지하고 DocumentFrame이 내부에서 스케일 계산 */
          <div
            className="relative w-full h-full"
          >
            {/* 비인쇄용 가이드라인 */}
            <div
              data-canvas-guide
              className="absolute inset-0 pointer-events-none"
              style={{
                border:       '1px dashed var(--color-guide)',
                borderRadius: 'var(--radius-box)',
              }}
            />
            {children}
          </div>
        )}
      </div>
    </main>
  )
}