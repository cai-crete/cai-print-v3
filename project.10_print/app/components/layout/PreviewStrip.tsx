'use client'

/**
 * PreviewStrip.tsx — 하단 페이지 미리보기 바 (Preview Layer: z-20)
 * design-style-guide.md §9.1 기준:
 *   높이 10rem, bottom: 1rem, left: 1rem, right: 21.25rem
 * references-contents.txt §중앙 하단 기준:
 *   - 생성된 문서를 페이지별로 작게 미리보기
 *   - 수평 나열, 범위 넘을 시 <,> 버튼으로 이동
 *   - 현재 페이지/총 페이지 표시 (텍스트 입력으로 전환 가능)
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useState, useRef } from 'react'
import type { PrintMode, PanelOrientation } from '@/lib/types'
import { DOC_SIZE, docSizeKey } from '@/app/components/templates/DocumentFrame'

const THUMB_W = 80  // 5rem
const THUMB_H = 64  // 4rem

interface PreviewStripProps {
  /** 각 페이지의 HTML 문자열 목록 (빈 배열이면 empty 상태) */
  pages: string[]
  /** 현재 선택된 페이지 (0-base) */
  currentPage: number
  /** 페이지 변경 핸들러 */
  onPageChange: (page: number) => void
  /** 현재 문서 모드 — 썸네일 스케일 계산에 사용 */
  mode: PrintMode
  /** PANEL 모드 용지 방향 */
  orientation?: PanelOrientation
}

/** 페이지 썸네일 카드 */
function PageThumbnail({
  index,
  isActive,
  html,
  docW,
  docH,
  onClick,
}: {
  index: number
  isActive: boolean
  html: string
  docW: number
  docH: number
  onClick: () => void
}) {
  const thumbScale = Math.min(THUMB_W / docW, THUMB_H / docH)

  return (
    <button
      onClick={onClick}
      className="shrink-0 flex flex-col items-center gap-1 group"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.25rem' }}
    >
      {/* 썸네일 프레임 */}
      <div
        className="overflow-hidden transition-all"
        style={{
          width: THUMB_W,
          height: THUMB_H,
          borderRadius: '4px',
          backgroundColor: 'var(--color-doc-bg)',
          border: isActive
            ? '2px solid var(--color-text-primary)'
            : '1px solid var(--color-border)',
          boxShadow: isActive ? 'var(--shadow-float)' : 'none',
        }}
      >
        {html ? (
          /* iframe srcdoc: CSS 격리로 앱 스타일 오염 차단 */
          <iframe
            srcDoc={html}
            sandbox="allow-scripts"
            loading="lazy"
            title={`page-thumb-${index}`}
            style={{
              width:           docW,
              height:          docH,
              border:          'none',
              display:         'block',
              transform:       `scale(${thumbScale})`,
              transformOrigin: 'top left',
              pointerEvents:   'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--color-placeholder)',
            }}
          />
        )}
      </div>

      {/* 페이지 번호 */}
      <span
        className="text-[10px]"
        style={{
          color: isActive
            ? 'var(--color-text-primary)'
            : 'var(--color-text-caption)',
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {index + 1}
      </span>
    </button>
  )
}

/** 빈 페이지 추가 슬롯 */
function AddPageSlot() {
  return (
    <div
      className="shrink-0 flex flex-col items-center gap-1"
      style={{ padding: '0 0.25rem' }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: '5rem',
          height: '4rem',
          borderRadius: '4px',
          border: '1.5px dashed var(--color-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-border)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <span className="text-[10px]" style={{ color: 'var(--color-border)' }}>
        &nbsp;
      </span>
    </div>
  )
}

export default function PreviewStrip({
  pages,
  currentPage,
  onPageChange,
  mode,
  orientation = 'LANDSCAPE',
}: PreviewStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isEditingPage, setIsEditingPage] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const totalPages = pages.length

  // 모드별 문서 물리 치수 — PageThumbnail 스케일 계산에 전달
  const { w: docW, h: docH } = DOC_SIZE[docSizeKey(mode, orientation)] ?? DOC_SIZE.REPORT

  /** 리스트 좌측 끝으로 이동 */
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  /** 리스트 우측 끝으로 이동 */
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  /** 현재 페이지 텍스트 입력 확정 */
  const commitPageInput = () => {
    const num = parseInt(inputValue, 10)
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      onPageChange(num - 1)
    }
    setIsEditingPage(false)
  }

  if (totalPages === 0) return null

  return (
    <div
      data-preview-strip
      className="fixed flex items-center gap-2"
      style={{
        bottom: 'var(--gap-global)',
        left: 'var(--gap-global)',
        right: 'var(--sidebar-spacing)',
        height: 'var(--preview-h)',
        backgroundColor: 'var(--color-doc-bg)',
        borderRadius: 'var(--radius-box)',
        boxShadow: 'var(--shadow-float)',
        zIndex: 'var(--z-preview)',
        padding: '0 0.75rem',
        overflow: 'hidden',
      }}
    >
      {/* 이전 페이지 그룹 버튼 (페이지가 있을 때만 표시) */}
      {totalPages > 0 && (
        <button
          onClick={scrollLeft}
          className="shrink-0 flex items-center justify-center transition-colors"
          style={{
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: 'var(--radius-box)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-caption)',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* 스크롤 가능한 썸네일 목록 */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-1 overflow-x-auto h-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {totalPages > 0 && pages.map((html, idx) => (
          <PageThumbnail
            key={idx}
            index={idx}
            isActive={idx === currentPage}
            html={html}
            docW={docW}
            docH={docH}
            onClick={() => onPageChange(idx)}
          />
        ))}
        {totalPages > 0 && <AddPageSlot />}
      </div>

      {/* 다음 페이지 그룹 버튼 (페이지가 있을 때만 표시) */}
      {totalPages > 0 && (
        <button
          onClick={scrollRight}
          className="shrink-0 flex items-center justify-center transition-colors"
          style={{
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: 'var(--radius-box)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-caption)',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* 현재 페이지 / 총 페이지 표시 */}
      {totalPages > 0 && (
        <div
          className="shrink-0 flex items-center gap-1 text-xs select-none"
          style={{
            borderLeft: '1px solid var(--color-border)',
            paddingLeft: '0.75rem',
            color: 'var(--color-text-caption)',
            minWidth: '4rem',
          }}
        >
          {isEditingPage ? (
            /* 텍스트 입력 전환 상태 */
            <input
              type="number"
              value={inputValue}
              min={1}
              max={totalPages}
              autoFocus
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitPageInput()
                if (e.key === 'Escape') setIsEditingPage(false)
              }}
              style={{
                width: '2.5rem',
                border: 'none',
                borderBottom: '1px solid var(--color-focus)',
                outline: 'none',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--color-text-primary)',
              }}
            />
          ) : (
            <span
              className="cursor-pointer hover:underline"
              onClick={() => {
                setInputValue(String(currentPage + 1))
                setIsEditingPage(true)
              }}
              title="클릭하여 페이지 번호 입력"
            >
              {currentPage + 1}
            </span>
          )}
          <span>/ {totalPages}</span>
        </div>
      )}
    </div>
  )
}
