'use client'

/**
 * LibraryModal.tsx — LIBRARY 이미지 라이브러리 모달 (Modal Layer: z-1000)
 * references-contents.txt §좌측 툴바 LIBRARY:
 *   - 폴더 목록 표시: 프로젝트명 폴더, 'FROM DEVICE' 폴더
 *   - 폴더 클릭 시 내부 이미지 그리드 표시
 *   - 이미지 선택 시 onSelectImage 콜백 호출
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useState } from 'react'
import type { LibraryFolder, LibraryImage } from '@/lib/types'

interface LibraryModalProps {
  isOpen: boolean
  onClose: () => void
  folders: LibraryFolder[]
  onSelectImage: (image: LibraryImage) => void
}

export default function LibraryModal({
  isOpen,
  onClose,
  folders,
  onSelectImage,
}: LibraryModalProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)

  if (!isOpen) return null

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 'calc(var(--z-modal) - 1)' as React.CSSProperties['zIndex'],
        }}
        onClick={onClose}
      />

      {/* 모달 패널 */}
      <div
        className="fixed flex flex-col"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(560px, 90vw)',
          maxHeight: '70vh',
          backgroundColor: 'var(--color-doc-bg)',
          borderRadius: 'var(--radius-box)',
          boxShadow: 'var(--shadow-float)',
          zIndex: 'var(--z-modal)' as React.CSSProperties['zIndex'],
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '0.875rem 1.25rem',
            borderBottom: '1px solid var(--color-border-header)',
          }}
        >
          <div className="flex items-center gap-2">
            {/* 폴더 내부 보기 시 뒤로 가기 버튼 */}
            {activeFolderId && (
              <button
                onClick={() => setActiveFolderId(null)}
                className="flex items-center justify-center"
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-caption)',
                  padding: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <span
              className="text-sm font-semibold tracking-widest"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {activeFolder ? activeFolder.name.toUpperCase() : 'LIBRARY'}
            </span>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="flex items-center justify-center transition-colors"
            style={{
              width: '1.75rem',
              height: '1.75rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-caption)',
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '1rem 1.25rem' }}>
          {folders.length === 0 ? (
            /* 빈 상태 */
            <div
              className="flex flex-col items-center justify-center gap-2 py-12"
              style={{ color: 'var(--color-border)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--color-text-caption)' }}>
                이미지가 없습니다
              </p>
            </div>
          ) : !activeFolder ? (
            /* 폴더 목록 */
            <div className="flex flex-col gap-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className="flex items-center gap-3 w-full text-left transition-colors"
                  style={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-box)',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      'var(--color-placeholder)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      'transparent'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--color-text-caption)', flexShrink: 0 }}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {folder.name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-caption)' }}>
                      {folder.images.length}장
                    </p>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--color-border)', flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            /* 이미지 그리드 */
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(5rem, 1fr))' }}
            >
              {activeFolder.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => { onSelectImage(img); onClose() }}
                  className="aspect-square overflow-hidden transition-all"
                  style={{
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    padding: 0,
                    backgroundColor: 'var(--color-placeholder)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbnailUrl ?? img.url}
                    alt={img.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
