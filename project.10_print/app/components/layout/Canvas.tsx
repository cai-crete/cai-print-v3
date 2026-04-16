'use client'

/**
 * Canvas.tsx — 중앙 무한 캔버스 영역 (Canvas Layer: z-0)
 * references-contents.txt §중앙 기준:
 *   - 바닥: 그리드가 그어진 배경 (팬 가능)
 *   - 대지: 생성된 문서가 표시되는 흰 영역
 *   - 결과 없을 시: 안내 문구 표시
 * design-style-guide.md §3.1: app-bg #F5F5F5, guide rgba(0,255,255,0.5)
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { PrintMode } from '@/lib/types'

interface CanvasProps {
  mode: PrintMode
  /** 렌더링할 자식 컴포넌트 (문서 템플릿) */
  children?: React.ReactNode
  /** 결과가 없는 상태 여부 */
  isEmpty: boolean
  /** 생성 중 여부 */
  isLoading: boolean
}

/** 결과 없음 Empty State */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      {/* 문서 아이콘 */}
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

      <p
        className="text-base font-semibold"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        생성된 문서가 없습니다.
      </p>
      <p
        className="text-sm text-center leading-relaxed"
        style={{ color: 'var(--color-text-caption)' }}
      >
        우측 패널에서 설정을 마치고
        <br />
        GENERATE 버튼을 눌러주세요.
      </p>
    </div>
  )
}

/** 생성 중 Loading State */
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
      <p
        className="text-sm"
        style={{ color: 'var(--color-text-caption)' }}
      >
        AI가 문서를 생성하고 있습니다...
      </p>
    </div>
  )
}

export default function Canvas({
  mode: _mode,
  children,
  isEmpty,
  isLoading,
}: CanvasProps) {
  return (
    <main
      className="fixed inset-0 overflow-hidden"
      style={{
        top: 'var(--header-h)',
        /* 우측: 사이드바 공간 확보 */
        right: 'var(--sidebar-spacing)',
        /* 하단: 미리보기 바 공간 확보 */
        bottom: 'calc(var(--preview-h) + var(--gap-global))',
        left: 0,
        zIndex: 'var(--z-canvas)',
        backgroundColor: 'var(--color-app-bg)',
        /* 그리드 배경 */
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
      }}
    >
      {/* 대지(Artboard) 영역 — 문서가 표시되는 중앙 컨테이너 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ padding: 'var(--gap-global)' }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{
            backgroundColor: isEmpty ? 'transparent' : 'var(--color-doc-bg)',
            borderRadius: isEmpty ? 0 : 'var(--radius-box)',
            boxShadow: isEmpty ? 'none' : 'var(--shadow-float)',
            width: '100%',
            maxWidth: isEmpty ? undefined : '860px',
            /* 결과 없을 때는 전체 영역을 차지 */
            height: isEmpty ? '100%' : 'auto',
            minHeight: isEmpty ? undefined : '480px',
          }}
        >
          {/* 비인쇄용 가이드라인 (대지 외곽) */}
          {!isEmpty && (
            <div
              data-canvas-guide
              className="absolute inset-0 pointer-events-none"
              style={{
                border: '1px dashed var(--color-guide)',
                borderRadius: 'var(--radius-box)',
                margin: '4px',
              }}
            />
          )}

          {/* 상태별 렌더링 */}
          {isLoading ? (
            <LoadingState />
          ) : isEmpty ? (
            <EmptyState />
          ) : (
            children
          )}
        </div>
      </div>
    </main>
  )
}
