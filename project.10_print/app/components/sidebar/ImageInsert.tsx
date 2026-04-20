'use client'

/**
 * ImageInsert.tsx — INSERT IMAGE 영역
 * references-contents.txt §우측 사이드바 INSERT IMAGE:
 *   - 일반 모드(REPORT/PANEL/DRAWING): 이미지 썸네일 그리드 + REMOVE ALL + + 추가 버튼
 *   - VIDEO 모드: Start 슬롯 / ↔ 전환 버튼 / End 슬롯 (각각 1장)
 * design-style-guide.md §3.1: 플레이스홀더 #F8F8F8
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useRef, useState, useEffect, useMemo, Fragment } from 'react'
import type { PrintMode } from '@/lib/types'
import { compressImage } from '@/lib/imageUtils'

interface ImageInsertProps {
  label: string
  mode: PrintMode

  /* 일반 모드용 */
  images: File[]
  onImagesChange: (files: File[]) => void

  /* VIDEO 모드 전용 */
  videoStartImage: File | null
  videoEndImage: File | null
  onVideoStartChange: (file: File | null) => void
  onVideoEndChange: (file: File | null) => void

  /* 라이브러리 연결용 */
  onLibraryRequest?: (target: 'common' | 'videoStart' | 'videoEnd') => void
}

const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp'

/** 이미지 업로드 트리거 버튼 (+) */
function AddButton({ onClickDevice, onClickLibrary }: { onClickDevice: () => void, onClickLibrary: () => void }) {
  const [showMenu, setShowMenu] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  /** 외부 클릭 시 메뉴 닫기 — mousedown 대신 click/mousedown 조합 검토 후 click 사용 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 버튼 자체나 메뉴 영역 내부를 클릭한 게 아니라면 닫기
      if (
        showMenu && 
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleToggle = () => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPos({
        top: rect.top + rect.height / 2,
        left: rect.left - 8
      })
    }
    setShowMenu(!showMenu)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center justify-center transition-colors relative"
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
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-black)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-gray-200)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showMenu && (
        <Fragment>
          <div 
            ref={menuRef}
            className="fixed z-[1002] flex flex-col bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-lg border border-gray-100 overflow-hidden w-44 whitespace-nowrap -translate-y-1/2 -translate-x-full"
            style={{ 
              top: `${menuPos.top}px`, 
              left: `${menuPos.left}px` 
            }}
          >
            <button className="text-left px-4 py-3 text-xs tracking-wider font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors" onClick={() => { setShowMenu(false); onClickDevice() }}>
              디바이스에서 업로드
            </button>
            <div className="h-px bg-gray-100 mx-2" />
            <button className="text-left px-4 py-3 text-xs tracking-wider font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors" onClick={() => { setShowMenu(false); onClickLibrary() }}>
              라이브러리에서 업로드
            </button>
          </div>
        </Fragment>
      )}
    </div>
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
  const url = useMemo(() => URL.createObjectURL(file), [file.name, file.lastModified, file.size])

  useEffect(() => {
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
      <img
        src={url}
        alt={file.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
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
  onLibraryUpload,
}: {
  label: string
  file: File | null
  onFileChange: (file: File | null) => void
  onLibraryUpload: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  /** 외부 클릭 시 메뉴 닫기 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showMenu && 
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const handleToggle = () => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPos({
        top: rect.top + rect.height / 2,
        left: rect.left - 8
      })
    }
    setShowMenu(!showMenu)
  }

  return (
    <div className="flex flex-col items-center gap-1 relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative flex items-center justify-center transition-colors overflow-hidden"
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: 'var(--radius-box)',
          border: file ? '1px solid var(--color-gray-200)' : '1px dashed var(--color-gray-200)',
          backgroundColor: 'var(--color-placeholder)',
          cursor: 'pointer',
        }}
      >
        {url ? (
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

      {showMenu && (
        <Fragment>
          <div 
            ref={menuRef}
            className="fixed z-[1002] flex flex-col bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-lg border border-gray-100 overflow-hidden w-44 whitespace-nowrap -translate-y-1/2 -translate-x-full"
            style={{ 
              top: `${menuPos.top}px`, 
              left: `${menuPos.left}px` 
            }}
          >
            <button className="text-left px-4 py-3 text-xs tracking-wider font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors" onClick={() => { setShowMenu(false); inputRef.current?.click() }}>
              디바이스에서 업로드
            </button>
            <div className="h-px bg-gray-100 mx-2" />
            <button className="text-left px-4 py-3 text-xs tracking-wider font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors" onClick={() => { setShowMenu(false); onLibraryUpload() }}>
              라이브러리에서 업로드
            </button>
          </div>
        </Fragment>
      )}

      <span className="text-ui-caption text-[--color-gray-400]">
        {label}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_TYPES}
        className="hidden"
        onChange={async (e) => {
          const raw = e.target.files?.[0] ?? null
          const f = raw ? await compressImage(raw) : null
          onFileChange(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default function ImageInsert({
  label,
  mode,
  images,
  onImagesChange,
  videoStartImage,
  videoEndImage,
  onVideoStartChange,
  onVideoEndChange,
  onLibraryRequest,
}: ImageInsertProps) {
  const multiInputRef = useRef<HTMLInputElement>(null)

  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const handleRemoveAll = () => {
    onImagesChange([])
  }

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files ?? [])
    const compressed = await Promise.all(rawFiles.map((f) => compressImage(f)))
    onImagesChange([...images, ...compressed])
    e.target.value = ''
  }

  const handleSwap = () => {
    const tmp = videoStartImage
    onVideoStartChange(videoEndImage)
    onVideoEndChange(tmp)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-ui-subtitle tracking-widest text-[--color-gray-400]">
          {label}
        </span>
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
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-black)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-gray-400)'
            }}
          >
            REMOVE ALL
          </button>
        )}
      </div>

      {mode === 'VIDEO' ? (
        <div className="flex items-end gap-2 px-1">
          <VideoSlot
            label="START"
            file={videoStartImage}
            onFileChange={onVideoStartChange}
            onLibraryUpload={() => onLibraryRequest?.('videoStart')}
          />
          <button
            onClick={handleSwap}
            className="flex items-center justify-center mb-5 shrink-0 transition-all hover:bg-gray-50 active:scale-95 shadow-sm"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-black)',
              border: '1px solid var(--color-gray-200)',
              cursor: 'pointer',
            }}
            title="이미지 위치 전환"
          >
            {/* 수평 교차 화살표 아이콘 */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3l4 4-4 4" />
              <path d="M20 7H4" />
              <path d="M8 21l-4-4 4-4" />
              <path d="M4 17h16" />
            </svg>
          </button>
          <VideoSlot
            label="END"
            file={videoEndImage}
            onFileChange={onVideoEndChange}
            onLibraryUpload={() => onLibraryRequest?.('videoEnd')}
          />
        </div>
      ) : (
        <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 -mx-1 px-1 custom-scrollbar">
          {images.map((file, index) => (
            <ImageThumbnail
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => handleRemove(index)}
            />
          ))}
          <AddButton
            onClickDevice={() => multiInputRef.current?.click()}
            onClickLibrary={() => onLibraryRequest?.('common')}
          />
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
