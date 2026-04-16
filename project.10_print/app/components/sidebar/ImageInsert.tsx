'use client'

/**
 * ImageInsert.tsx — INSERT IMAGE 영역
 * references-contents.txt §우측 사이드바 INSERT IMAGE:
 *   - 일반 모드(REPORT/PANEL/DRAWING): 이미지 썸네일 그리드 + REMOVE ALL + + 추가 버튼
 *   - VIDEO 모드: Start 슬롯 / ↔ 전환 버튼 / End 슬롯 (각각 1장)
 * design-style-guide.md §3.1: 플레이스홀더 #F8F8F8
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useRef } from 'react'
import type { PrintMode } from '@/lib/types'

interface ImageInsertProps {
  mode: PrintMode

  /* 일반 모드용 */
  images: File[]
  onImagesChange: (files: File[]) => void

  /* VIDEO 모드 전용 */
  videoStartImage: File | null
  videoEndImage: File | null
  onVideoStartChange: (file: File | null) => void
  onVideoEndChange: (file: File | null) => void
}

const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp'

/** 이미지 업로드 트리거 버튼 (+) */
function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center transition-colors"
      style={{
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: 'var(--radius-box)',
        border: '1px dashed var(--color-gray-200)',
        backgroundColor: 'var(--color-placeholder)',
        color: 'var(--color-gray-400)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
          'var(--color-black)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
          'var(--color-gray-200)'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  )
}

/** 이미지 썸네일 + 제거 버튼 */
function ImageThumbnail({
  file,
  onRemove,
}: {
  file: File
  onRemove: () => void
}) {
  const url = React.useMemo(() => URL.createObjectURL(file), [file])

  React.useEffect(() => {
    return () => URL.revokeObjectURL(url)
  }, [url])

  return (
    <div
      className="relative group"
      style={{
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: 'var(--radius-box)',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid var(--color-gray-200)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={file.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* 제거 버튼 (hover 시 표시) */}
      <button
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          width: '1.125rem',
          height: '1.125rem',
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

/** VIDEO 모드 단일 이미지 슬롯 (Start / End) */
function VideoSlot({
  label,
  file,
  onFileChange,
}: {
  label: string
  file: File | null
  onFileChange: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const url = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  )

  React.useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  return (
    <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
      <button
        onClick={() => inputRef.current?.click()}
        className="relative flex items-center justify-center transition-colors overflow-hidden"
        style={{
          width: '100%',
          height: '4.5rem',
          borderRadius: 'var(--radius-box)',
          border: file
            ? '1px solid var(--color-gray-200)'
            : '1px dashed var(--color-gray-200)',
          backgroundColor: 'var(--color-placeholder)',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--color-gray-300)' }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </button>

      <span className="text-ui-caption text-[--color-gray-400]">
        {label}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_TYPES}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null
          onFileChange(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

/* ============================================================
   Main Component
   ============================================================ */

export default function ImageInsert({
  mode,
  images,
  onImagesChange,
  videoStartImage,
  videoEndImage,
  onVideoStartChange,
  onVideoEndChange,
}: ImageInsertProps) {
  const multiInputRef = useRef<HTMLInputElement>(null)

  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const handleRemoveAll = () => {
    onImagesChange([])
  }

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? [])
    onImagesChange([...images, ...newFiles])
    e.target.value = ''
  }

  /** Start ↔ End 슬롯 전환 */
  const handleSwap = () => {
    const tmp = videoStartImage
    onVideoStartChange(videoEndImage)
    onVideoEndChange(tmp)
  }

  return (
    <div>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-ui-subtitle tracking-widest text-[--color-gray-400]">
          INSERT IMAGE
        </span>
        {/* REMOVE ALL — 일반 모드에서 이미지가 있을 때만 표시 */}
        {mode !== 'VIDEO' && images.length > 0 && (
          <button
            onClick={handleRemoveAll}
            className="text-ui-caption transition-colors"
            style={{
              color: 'var(--color-gray-400)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color =
                'var(--color-black)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color =
                'var(--color-gray-400)'
            }}
          >
            REMOVE ALL
          </button>
        )}
      </div>

      {/* -------------------------------------------------------- */}
      {/* VIDEO 모드: Start / End 슬롯                              */}
      {/* -------------------------------------------------------- */}
      {mode === 'VIDEO' ? (
        <div className="flex items-end gap-2">
          <VideoSlot
            label="Start"
            file={videoStartImage}
            onFileChange={onVideoStartChange}
          />

          {/* 전환 버튼 */}
          <button
            onClick={handleSwap}
            className="flex items-center justify-center mb-5 shrink-0 transition-colors"
            style={{
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: 'var(--radius-box)',
              border: '1px solid var(--color-gray-200)',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-gray-400)',
              cursor: 'pointer',
            }}
            title="Start / End 전환"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>

          <VideoSlot
            label="End"
            file={videoEndImage}
            onFileChange={onVideoEndChange}
          />
        </div>
      ) : (
        /* -------------------------------------------------------- */
        /* 일반 모드: 썸네일 그리드 + 추가 버튼                       */
        /* -------------------------------------------------------- */
        <div className="flex flex-wrap gap-2">
          {images.map((file, index) => (
            <ImageThumbnail
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => handleRemove(index)}
            />
          ))}

          {/* 추가(+) 버튼 */}
          <AddButton onClick={() => multiInputRef.current?.click()} />

          <input
            ref={multiInputRef}
            type="file"
            accept={ACCEPT_TYPES}
            multiple
            className="hidden"
            onChange={handleAdd}
          />
        </div>
      )}
    </div>
  )
}
