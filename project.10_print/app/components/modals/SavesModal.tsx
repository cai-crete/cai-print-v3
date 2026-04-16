'use client'

/**
 * SavesModal.tsx — SAVES 임시저장 문서 목록 모달 (Modal Layer: z-1000)
 * references-contents.txt §좌측 툴바 SAVES:
 *   사용자가 생성한 문서들이 임시저장되어 모아짐.
 *   문서 열기 / (항목별) 제거 기능 포함.
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { SavedDocument } from '@/lib/types'

interface SavesModalProps {
  isOpen: boolean
  onClose: () => void
  documents: SavedDocument[]
  onOpen: (doc: SavedDocument) => void
  onDelete: (docId: string) => void
}

/** 모드별 표시 라벨 */
const MODE_LABELS: Record<SavedDocument['mode'], string> = {
  REPORT: 'REPORT',
  DRAWING: 'DRAWING',
  PANEL: 'PANEL',
  VIDEO: 'VIDEO',
}

export default function SavesModal({
  isOpen,
  onClose,
  documents,
  onOpen,
  onDelete,
}: SavesModalProps) {
  if (!isOpen) return null

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
          width: 'min(480px, 90vw)',
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
          <span
            className="text-sm font-semibold tracking-widest"
            style={{ color: 'var(--color-text-primary)' }}
          >
            SAVES
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
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
        <div className="flex-1 overflow-y-auto" style={{ padding: '0.75rem 1.25rem' }}>
          {documents.length === 0 ? (
            /* 빈 상태 */
            <div
              className="flex flex-col items-center justify-center gap-2 py-12"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--color-border)' }}>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--color-text-caption)' }}>
                저장된 문서가 없습니다
              </p>
            </div>
          ) : (
            /* 문서 목록 */
            <div className="flex flex-col gap-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 group"
                  style={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-box)',
                    border: '1px solid var(--color-border-header)',
                  }}
                >
                  {/* 썸네일 */}
                  <div
                    className="shrink-0 overflow-hidden"
                    style={{
                      width: '3rem',
                      height: '2.25rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-placeholder)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {doc.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doc.thumbnailUrl}
                        alt={doc.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  {/* 문서 정보 */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {doc.title || '제목 없음'}
                    </p>
                    <p
                      className="text-[10px]"
                      style={{ color: 'var(--color-text-caption)' }}
                    >
                      {MODE_LABELS[doc.mode]} · {doc.pageCount}p ·{' '}
                      {new Date(doc.updatedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>

                  {/* 열기 버튼 */}
                  <button
                    onClick={() => { onOpen(doc); onClose() }}
                    className="text-xs font-medium shrink-0 transition-colors"
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: 'var(--radius-box)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    열기
                  </button>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="flex items-center justify-center shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-caption)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    title="삭제"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
