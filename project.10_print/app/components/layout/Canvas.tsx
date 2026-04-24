'use client'

/**
 * Canvas.tsx — 중앙 무한 캔버스 영역 (Canvas Layer: z-0)
 *
 * 무한 캔버스 기능:
 *   - 마우스 휠      : 커서 위치 기준 줌인/줌아웃 (0.1 ≤ zoom ≤ 8)
 *   - 좌버튼 드래그  : 캔버스 패닝
 *   - 더블클릭       : 뷰 초기화 (zoom=1, pan=0)
 *   - 배경 그리드    : zoom/pan에 동기화
 *
 * 설계:
 *   DocumentFrame의 ResizeObserver는 CSS transform 이전 레이아웃 크기를 측정하므로
 *   항상 캔버스 크기에 맞게 문서를 스케일한다.
 *   Canvas zoom/pan 은 그 위에 순수 시각적 변환으로 적용된다.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// 뷰 상태 (zoom + pan)
// ---------------------------------------------------------------------------

interface ViewState {
  zoom: number
  panX: number
  panY: number
}

const INITIAL_VIEW: ViewState = { zoom: 1, panX: 0, panY: 0 }

type ViewAction =
  | { type: 'PAN_TO'; x: number; y: number }
  | { type: 'ZOOM_TO'; zoom: number; cursorX: number; cursorY: number }
  | { type: 'RESET' }

function viewReducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case 'PAN_TO':
      return { ...state, panX: action.x, panY: action.y }
    case 'ZOOM_TO': {
      const newZoom = Math.max(0.1, Math.min(8, action.zoom))
      const ratio   = newZoom / state.zoom
      return {
        zoom: newZoom,
        panX: action.cursorX - ratio * (action.cursorX - state.panX),
        panY: action.cursorY - ratio * (action.cursorY - state.panY),
      }
    }
    case 'RESET':
      return INITIAL_VIEW
  }
}

// ---------------------------------------------------------------------------
// 로딩 상태 UI
// ---------------------------------------------------------------------------

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
      <p className="text-sm" style={{ color: 'var(--color-text-caption)' }}>
        AI가 문서를 생성하고 있습니다...
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CanvasProps {
  children?: React.ReactNode
  isEmpty: boolean
  isLoading: boolean
  zoom?: number
  panX?: number
  panY?: number
  onViewChange?: (view: { zoom: number, panX: number, panY: number }) => void
  activeTool?: 'cursor' | 'handle'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Canvas({ children, isEmpty, isLoading, zoom, panX, panY, onViewChange, activeTool = 'handle' }: CanvasProps) {
  const viewportRef                = useRef<HTMLDivElement>(null)
  const [internalView, dispatch]   = useReducer(viewReducer, INITIAL_VIEW)
  const [isDragging, setIsDragging] = useState(false)

  const isControlled = zoom !== undefined && panX !== undefined && panY !== undefined
  const view = isControlled ? { zoom, panX, panY } : internalView

  // dispatch wrapper that also calls onViewChange for controlled mode
  const customDispatch = useCallback((action: ViewAction) => {
    const nextView = viewReducer(view, action)
    if (onViewChange) onViewChange(nextView)
    if (!isControlled) dispatch(action)
  }, [view, isControlled, onViewChange])

  const dragRef          = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const viewRef          = useRef(view)
  const customDispatchRef = useRef(customDispatch)
  const activeToolRef     = useRef(activeTool)
  viewRef.current          = view
  customDispatchRef.current = customDispatch
  activeToolRef.current     = activeTool

  // -------------------------------------------------------------------------
  // 휠 줌 — 마운트 시 1회 등록 (viewRef로 최신 zoom 참조)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect    = el.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top
      const factor  = e.deltaY < 0 ? 1.1 : 0.9
      customDispatchRef.current({
        type:    'ZOOM_TO',
        zoom:    viewRef.current.zoom * factor,
        cursorX,
        cursorY,
      })
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  // -------------------------------------------------------------------------
  // 드래그 패닝
  // -------------------------------------------------------------------------
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    if (activeToolRef.current !== 'handle') return
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: view.panX, py: view.panY }
    setIsDragging(true)
  }, [view.panX, view.panY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current
    if (!d) return
    customDispatchRef.current({ type: 'PAN_TO', x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) })
  }, [])

  const endDrag = useCallback(() => {
    dragRef.current = null
    setIsDragging(false)
  }, [])

  useEffect(() => {
    window.addEventListener('mouseup', endDrag)
    return () => window.removeEventListener('mouseup', endDrag)
  }, [endDrag])

  const handleDoubleClick = useCallback(() => customDispatchRef.current({ type: 'RESET' }), [])

  const gridSize = 24

  return (
    <main
      ref={viewportRef}
      className="fixed overflow-hidden"
      style={{
        top:    'var(--header-h)',
        right:  0,
        bottom: 0,
        left:   0,
        zIndex: 'var(--z-canvas)',
        backgroundColor: 'var(--color-app-bg)',
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize:     `${gridSize * view.zoom}px ${gridSize * view.zoom}px`,
        backgroundPosition: `${view.panX}px ${view.panY}px`,
        cursor:     activeTool === 'cursor' ? 'default' : isDragging ? 'grabbing' : 'grab',
        userSelect: activeTool === 'cursor' ? 'text' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onDoubleClick={handleDoubleClick}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
          <LoadingState />
        </div>
      ) : isEmpty ? null : (
        <>
          <div
            className="absolute inset-0"
            style={{ 
              paddingTop: 'var(--gap-global)', 
              paddingBottom: 'var(--gap-global)', 
              paddingLeft: 'var(--gap-global)', 
              paddingRight: 'var(--sidebar-spacing)' 
            }}
          >
            <div
              style={{
                width:           '100%',
                height:          '100%',
                transformOrigin: '0 0',
                transform:       `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`,
              }}
            >
              {children}
            </div>
          </div>

          {isDragging && (
            <div
              className="absolute inset-0"
              style={{ zIndex: 1, cursor: 'grabbing' }}
            />
          )}
        </>
      )}
    </main>
  )
}