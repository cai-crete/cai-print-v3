'use client'

/**
 * Toolbar.tsx — 좌측 플로팅 수직 툴바 (Modal Layer: z-1000)
 *
 * 구조:
 *  - Pill 묶음 (흰 배경, radius-box): Undo / Redo / Library / Saves
 *  - 분리된 원형 버튼: SAVE (흰 배경, 검은 아이콘) / New Project (검은 배경, 흰 아이콘)
 *
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
  onSave: () => void
  onNewProject: () => void
}

/** Pill 묶음 내 아이콘 버튼 */
function PillButton({
  onClick,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center transition-all"
      style={{
        width: '2.75rem',
        height: '2.75rem',
        borderRadius: '50%',
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        border: 'none',
        outline: 'none',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
            'var(--color-placeholder)'
        }
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
          'transparent'
      }}
    >
      {children}
    </button>
  )
}

/** 분리된 원형 버튼 */
function CircleButton({
  onClick,
  disabled = false,
  title,
  children,
  variant = 'save',
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  children: React.ReactNode
  variant?: 'save' | 'new'
}) {
  const isSave = variant === 'save'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center transition-all"
      style={{
        width: '2.75rem',
        height: '2.75rem',
        borderRadius: '50%',
        backgroundColor: isSave
          ? 'var(--color-doc-bg)'
          : 'var(--color-text-primary)',
        color: isSave
          ? 'var(--color-text-primary)'
          : 'var(--color-doc-bg)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        border: 'none',
        outline: 'none',
        boxShadow: 'var(--shadow-float)',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          ;(e.currentTarget as HTMLButtonElement).style.opacity = '0.8'
        }
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.opacity = disabled ? '0.3' : '1'
      }}
    >
      {children}
    </button>
  )
}

/** Pill 내 구분선 */
function PillDivider() {
  return (
    <div
      style={{
        width: '1.5rem',
        height: '1px',
        backgroundColor: 'var(--color-gray-100)',
        margin: '0.125rem auto',
        flexShrink: 0,
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
  onSave,
  onNewProject,
}: ToolbarProps) {
  return (
    <div
      data-toolbar
      className="fixed flex flex-col items-center"
      style={{
        top: '50%',
        left: 'var(--gap-global)',
        transform: 'translateY(-50%)',
        gap: 'var(--gap-global)', // 1rem (16px) 또는 1.25rem (20px) 중 사용. gap-global 사용
        zIndex: 'var(--z-modal)',
      }}
    >
      {/* ── Pill 묶음: Undo / Redo / Library / Saves ── */}
      <div
        className="flex flex-col items-center p-2"
        style={{
          gap: '0.25rem',
          backgroundColor: 'var(--color-doc-bg)',
          borderRadius: 'var(--radius-pill)',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {/* Undo */}
        <PillButton onClick={onUndo} disabled={!canUndo} title="실행 취소 (Undo)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
          </svg>
        </PillButton>

        {/* Redo */}
        <PillButton onClick={onRedo} disabled={!canRedo} title="다시 실행 (Redo)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14l5-5-5-5" />
            <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
          </svg>
        </PillButton>

        <PillDivider />

        {/* Library — 이미지 갤러리 아이콘 */}
        <PillButton onClick={onOpenLibrary} title="LIBRARY — 업로드 이미지 모음">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </PillButton>

        {/* Saves — 아카이빙 아이콘 (박스+다운 화살표) */}
        <PillButton onClick={onOpenSaves} title="SAVES — 저장된 문서">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8v13H3V8" />
            <path d="M23 3H1v5h22V3z" />
            <path d="M10 12h4" />
          </svg>
        </PillButton>
      </div>

      {/* ── 분리된 원형 버튼: SAVE ── */}
      <CircleButton onClick={onSave} variant="save" title="현재 문서 저장 (Save)">
        {/* 플로피 저장 아이콘 */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </CircleButton>

      {/* ── 분리된 원형 버튼: New Project ── */}
      <CircleButton onClick={onNewProject} variant="new" title="NEW PROJECT — 새 문서 시작">
        {/* Plus 아이콘 */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </CircleButton>
    </div>
  )
}
