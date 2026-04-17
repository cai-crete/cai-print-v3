'use client'

/**
 * Sidebar.tsx — 우측 사이드바 컨테이너 (Control Layer: z-90)
 * design-style-guide.md §9.1 기준:
 *   너비 18rem, right: 1rem, top: 8rem, bottom: 1rem
 *   내부 패딩 1.25rem, 열기/접기 버튼 포함
 * references-contents.txt §우측 기준:
 *   상단 고정: NodeSelector + 접기 버튼
 *   하단 고정: GENERATE / EXPORT CTA (구분선으로 분리)
 *   가운데 스크롤: 나머지 설정 영역
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  /** 상단 고정 영역: NodeSelector */
  headerSlot: React.ReactNode
  /** 스크롤 영역: INSERT IMAGE, PURPOSE, NUMBER OF PAGES, PROMPT */
  contentSlot: React.ReactNode
  /** 하단 고정 영역: GENERATE / EXPORT */
  footerSlot: React.ReactNode
}

export default function Sidebar({
  isOpen,
  onToggle,
  headerSlot,
  contentSlot,
  footerSlot,
}: SidebarProps) {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* 사이드바 본체                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="fixed flex flex-col"
        style={{
          top: '5rem',           /* header(3.5rem) + gap(1rem) + 여유(0.5rem) */
          right: 'var(--gap-global)',
          bottom: 'var(--gap-global)',
          width: 'var(--sidebar-w)',
          zIndex: 'var(--z-control)',
          /* 태블릿 이하: 접힘/펼침 전환 */
          transition: 'transform 0.25s ease, opacity 0.25s ease',
          transform: isOpen ? 'none' : 'translateX(calc(100% + var(--gap-global)))',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          gap: 'var(--gap-global)', /* 외부 요소와 본체 간 간격 */
        }}
      >
        {/* -- 상단 외부 영역 (NodeSelector + 접기 버튼) -------------------- */}
        <div className="flex items-center justify-between shrink-0">
          <div
            className="flex-1 min-w-0"
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-box)',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            {headerSlot}
          </div>

          {/* 접기 버튼 */}
          <button
            onClick={onToggle}
            title="사이드바 접기"
            className="ml-2 flex items-center justify-center shrink-0 transition-colors"
            style={{
              width: 'var(--h-cta-lg)',
              height: 'var(--h-cta-lg)',
              borderRadius: 'var(--radius-box)',
              border: 'none',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-text-caption)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            {/* 패널 토글 아이콘 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 사이드바 본체                                                         */}
        {/* ------------------------------------------------------------------ */}
        <aside
          className="flex-1 flex flex-col"
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-box)',
            boxShadow: 'var(--shadow-float)',
            /* overflow: hidden 복구: 사이드바 내부 스크롤 활성화를 위해 영역 격리 */
            overflow: 'hidden',
          }}
        >
          {/* -- 스크롤 영역 ------------------------------------------------- */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ padding: '1.25rem' }}
          >
            {contentSlot}
          </div>

          {/* -- 하단 고정 영역 (GENERATE / EXPORT) -------------------------- */}
          <div
            className="shrink-0"
            style={{
              padding: '1.25rem',
              borderTop: '1px solid var(--color-gray-100)',
            }}
          >
            {footerSlot}
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 사이드바 닫힘 상태일 때 다시 열기 버튼 (태블릿/모바일)               */}
      {/* ------------------------------------------------------------------ */}
      {!isOpen && (
        <button
          onClick={onToggle}
          title="사이드바 열기"
          className="fixed flex items-center justify-center transition-all"
          style={{
            top: '5rem',
            right: 'var(--gap-global)',
            width: 'var(--h-cta-lg)',
            height: 'var(--h-cta-lg)',
            borderRadius: 'var(--radius-box)',
            backgroundColor: 'var(--color-doc-bg)',
            boxShadow: 'var(--shadow-float)',
            zIndex: 'var(--z-control)',
            border: 'none',
            color: 'var(--color-text-caption)',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
    </>
  )
}
