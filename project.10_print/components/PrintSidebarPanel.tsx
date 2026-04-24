'use client'

/**
 * PrintSidebarPanel.tsx — Canvas 앱의 RightSidebar에 상시 표시될 Print 컨트롤 패널
 * 
 * 역할: Print 노드가 선택되었을 때 현재 저장된 Print 문서의 썸네일을 보여주고,
 * 사용자가 '생성하기', '라이브러리', '영상 만들기'를 클릭하면
 * Canvas가 Print_ExpandedView를 해당 initialAction으로 열 수 있게 onAction 콜백을 호출합니다.
 * 
 * 스타일: 하드코딩된 색상 및 폰트는 --print-color-* 와 --print-font-* CSS 변수로 치환되었습니다.
 */

import React from 'react'
import type { PrintSidebarPanelProps } from '@/types/print-canvas'

export function PrintSidebarPanel(props: PrintSidebarPanelProps) {
  const { savedState, thumbnail, onAction, className } = props

  return (
    <div 
      data-print-canvas 
      className={`print-sidebar-panel ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--print-space-2)',
        padding: 'var(--print-space-2)',
        fontFamily: 'var(--print-font-body)'
      }}
    >
      {/* 1. Print 썸네일 미리보기 및 모드 배지 */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        backgroundColor: 'var(--print-color-bg-subtle)',
        borderRadius: 'var(--print-radius-box)',
        overflow: 'hidden',
        border: '1px solid var(--print-color-border)'
      }}>
        {thumbnail ? (
          <img src={thumbnail} alt="Print Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%', 
            height: '100%', 
            color: 'var(--print-color-text-muted)', 
            fontSize: '0.875rem' 
          }}>
            저장된 문서 없음
          </div>
        )}
        {savedState?.mode && (
          <div style={{
            position: 'absolute',
            top: 'var(--print-space-1)',
            left: 'var(--print-space-1)',
            backgroundColor: 'var(--print-color-primary)',
            color: 'var(--print-color-on-primary)',
            fontSize: '0.75rem',
            padding: '4px 8px',
            borderRadius: 'var(--print-radius-box)',
            fontWeight: 'bold',
            fontFamily: 'var(--print-font-display)',
            letterSpacing: '0.05em'
          }}>
            {savedState.mode}
          </div>
        )}
      </div>

      <hr style={{ 
        borderColor: 'var(--print-color-divider)', 
        borderWidth: '1px', 
        borderStyle: 'solid', 
        margin: 'var(--print-space-1) 0' 
      }} />

      {/* 2. 액션 버튼 영역 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--print-space-1)' }}>
        <button
          onClick={() => onAction('generate')}
          style={{
            width: '100%',
            height: 'var(--print-btn-height-lg)',
            backgroundColor: 'var(--print-color-primary)',
            color: 'var(--print-color-on-primary)',
            borderRadius: 'var(--print-radius-pill)',
            fontWeight: 'bold',
            fontFamily: 'var(--print-font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 150ms ease'
          }}
        >
          {savedState ? '편집하기' : '생성하기'}
        </button>
        
        <button
          onClick={() => onAction('library')}
          style={{
            width: '100%',
            height: 'var(--print-btn-height-md)',
            backgroundColor: 'var(--print-color-bg)',
            color: 'var(--print-color-text)',
            border: '1px solid var(--print-color-border)',
            borderRadius: 'var(--print-radius-box)',
            fontWeight: '500',
            fontFamily: 'var(--print-font-body)',
            cursor: 'pointer',
            transition: 'background-color 150ms ease'
          }}
        >
          라이브러리
        </button>
        
        <button
          onClick={() => onAction('video')}
          style={{
            width: '100%',
            height: 'var(--print-btn-height-md)',
            backgroundColor: 'var(--print-color-bg)',
            color: 'var(--print-color-text)',
            border: '1px solid var(--print-color-border)',
            borderRadius: 'var(--print-radius-box)',
            fontWeight: '500',
            fontFamily: 'var(--print-font-body)',
            cursor: 'pointer',
            transition: 'background-color 150ms ease'
          }}
        >
          영상 만들기
        </button>
      </div>
    </div>
  )
}
