'use client'

/**
 * Toolbar.tsx — 좌측 플로팅 수직 툴바 (Modal Layer: z-1000)
 * references-contents.txt §좌측 중앙 기준:
 *   Undo / Redo / LIBRARY / SAVES / NEW PROJECT
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'

interface ToolbarProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onOpenLibrary: () => void
  onOpenSaves: () => void
  onNewProject: () => void
}

/** 툴바 개별 버튼 */
function ToolbarButton({
  onClick,
  disabled = false,
  title,
  children,
  variant = 'default',
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  children: React.ReactNode
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center transition-all"
      style={{
        width: '2.25rem',
        height: '2.25rem',
        borderRadius: variant === 'primary' ? '50%' : 'var(--radius-box)',
        backgroundColor:
          variant === 'primary'
            ? 'var(--color-text-primary)'
            : 'transparent',
        color:
          variant === 'primary'
            ? 'var(--color-doc-bg)'
            : 'var(--color-text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        border: 'none',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant !== 'primary') {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'var(--color-placeholder)'
        }
      }}
      onMouseLeave={(e) => {
        if (variant !== 'primary') {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'transparent'
        }
      }}
    >
      {children}
    </button>
  )
}

/** 툴바 구분선 */
function ToolbarDivider() {
  return (
    <div
      style={{
        width: '1.5rem',
        height: '1px',
        backgroundColor: 'var(--color-gray-100)',
        margin: '0.25rem auto',
      }}
    />
  )
}

export default function Toolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenLibrary,
  onOpenSaves,
  onNewProject,
}: ToolbarProps) {
  return (
    <div
      data-toolbar
      className="fixed flex flex-col items-center gap-1 p-2"
      style={{
        top: '50%',
        left: 'var(--gap-global)',
        transform: 'translateY(-50%)',
        backgroundColor: 'var(--color-doc-bg)',
        borderRadius: 'var(--radius-box)',
        boxShadow: 'var(--shadow-float)',
        zIndex: 'var(--z-modal)',
      }}
    >
      {/* Undo / Redo */}
      <ToolbarButton
        onClick={onUndo}
        disabled={!canUndo}
        title="실행 취소 (Undo)"
      >
        {/* Undo 아이콘 */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 14L4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={onRedo}
        disabled={!canRedo}
        title="다시 실행 (Redo)"
      >
        {/* Redo 아이콘 */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 14l5-5-5-5" />
          <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Library */}
      <ToolbarButton
        onClick={onOpenLibrary}
        title="LIBRARY — 업로드 이미지 모음"
      >
        {/* 이미지/갤러리 아이콘 */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </ToolbarButton>

      {/* Saves */}
      <ToolbarButton
        onClick={onOpenSaves}
        title="SAVES — 임시저장 문서"
      >
        {/* 저장/문서 아이콘 */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* New Project */}
      <ToolbarButton
        onClick={onNewProject}
        title="NEW PROJECT — 새 문서 시작"
        variant="primary"
      >
        {/* Plus 아이콘 */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </ToolbarButton>
    </div>
  )
}
