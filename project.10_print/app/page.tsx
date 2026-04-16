'use client'

/**
 * page.tsx — N10 print 노드 최상위 페이지 (State Orchestrator)
 *
 * 역할: 전체 앱 상태를 중앙에서 관리하고, 각 컴포넌트에 필요한 props만 주입한다.
 * UI 렌더링·스타일링 로직은 각 컴포넌트에 위임한다.
 * API 호출은 기존 /api/print Route를 그대로 경유한다.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useState, useCallback } from 'react'

// -- Layout
import GlobalHeader    from '@/app/components/layout/GlobalHeader'
import Toolbar         from '@/app/components/layout/Toolbar'
import Sidebar         from '@/app/components/layout/Sidebar'
import Canvas          from '@/app/components/layout/Canvas'
import PreviewStrip    from '@/app/components/layout/PreviewStrip'

// -- Sidebar sections
import NodeSelector    from '@/app/components/sidebar/NodeSelector'
import ImageInsert     from '@/app/components/sidebar/ImageInsert'
import PurposeSelector from '@/app/components/sidebar/PurposeSelector'
import PageCountControl from '@/app/components/sidebar/PageCountControl'
import PromptInput     from '@/app/components/sidebar/PromptInput'
import ActionButtons   from '@/app/components/sidebar/ActionButtons'

// -- Modals
import LibraryModal from '@/app/components/modals/LibraryModal'
import SavesModal   from '@/app/components/modals/SavesModal'

// -- Templates
import ReportTemplate  from '@/app/components/templates/ReportTemplate'
import PanelTemplate   from '@/app/components/templates/PanelTemplate'
import DrawingTemplate from '@/app/components/templates/DrawingTemplate'
import VideoTemplate   from '@/app/components/templates/VideoTemplate'

// -- Types
import type {
  PrintMode,
  PanelOrientation,
  PrintResult,
  HistoryEntry,
  LibraryFolder,
  LibraryImage,
  SavedDocument,
  ExportFormat,
} from '@/lib/types'

// =============================================================================
// Helper — API 호출
// =============================================================================

async function callPrintApi(
  mode: PrintMode,
  images: File[],
  videoStartImage: File | null,
  videoEndImage: File | null,
  prompt: string,
  pageCount: number
): Promise<PrintResult> {
  const formData = new FormData()
  formData.append('mode', mode)
  formData.append('prompt', prompt)

  if (mode === 'REPORT' || mode === 'PANEL' || mode === 'DRAWING') {
    formData.append('pageCount', String(pageCount))
    for (const image of images) {
      formData.append('images', image)
    }
  } else if (mode === 'VIDEO') {
    if (videoStartImage) formData.append('images', videoStartImage)
    if (videoEndImage)   formData.append('images', videoEndImage)
  }

  const res = await fetch('/api/print', { method: 'POST', body: formData })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || '서버 오류가 발생했습니다.')
  }

  return data as PrintResult
}

// =============================================================================
// Page Component
// =============================================================================

export default function PrintPage() {
  // -------------------------------------------------------------------------
  // 상태 — 모드 & 설정
  // -------------------------------------------------------------------------
  const [mode, setMode]               = useState<PrintMode>('REPORT')
  const [orientation, setOrientation] = useState<PanelOrientation>('LANDSCAPE')
  const [prompt, setPrompt]           = useState('')
  const [pageCount, setPageCount]     = useState(6)

  // -------------------------------------------------------------------------
  // 상태 — 이미지 입력
  // -------------------------------------------------------------------------
  const [images, setImages]                   = useState<File[]>([])
  const [videoStartImage, setVideoStartImage] = useState<File | null>(null)
  const [videoEndImage, setVideoEndImage]     = useState<File | null>(null)

  // -------------------------------------------------------------------------
  // 상태 — 결과
  // -------------------------------------------------------------------------
  const [result, setResult]         = useState<PrintResult | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  // -------------------------------------------------------------------------
  // 상태 — UI
  // -------------------------------------------------------------------------
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isSavesOpen, setIsSavesOpen]     = useState(false)

  // -------------------------------------------------------------------------
  // 상태 — Undo / Redo 히스토리
  // -------------------------------------------------------------------------
  const [history, setHistory]           = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // =========================================================================
  // 핸들러 — 모드 변경
  // =========================================================================

  const handleModeChange = useCallback((newMode: PrintMode) => {
    setMode(newMode)
    setResult(null)
    setError(null)
    setCurrentPage(0)
  }, [])

  // =========================================================================
  // 핸들러 — GENERATE
  // =========================================================================

  const handleGenerate = useCallback(async () => {
    // 이미지 검증
    if (mode === 'VIDEO') {
      if (!videoStartImage || !videoEndImage) {
        setError('VIDEO 모드는 Start 이미지와 End 이미지를 모두 선택해야 합니다.')
        return
      }
    } else {
      if (images.length === 0) {
        setError('이미지를 최소 1장 업로드하세요.')
        return
      }
    }

    setIsGenerating(true)
    setError(null)

    try {
      const data = await callPrintApi(
        mode, images, videoStartImage, videoEndImage, prompt, pageCount
      )
      setResult(data)
      setCurrentPage(0)

      // 히스토리 스택에 추가 (향후 Undo/Redo 기반)
      if (data.html) {
        const entry: HistoryEntry = {
          html: data.html,
          slotMapping: data.slotMapping,
          masterData: data.masterData,
          timestamp: Date.now(),
        }
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), entry])
        setHistoryIndex((prev) => prev + 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }, [mode, images, videoStartImage, videoEndImage, prompt, pageCount, historyIndex])

  // =========================================================================
  // 핸들러 — Undo / Redo (기반 구조만, Stage 2에서 완성)
  // =========================================================================

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const handleUndo = useCallback(() => {
    if (!canUndo) return
    const prev = history[historyIndex - 1]
    setResult((r) => r ? { ...r, html: prev.html, slotMapping: prev.slotMapping } : null)
    setHistoryIndex((i) => i - 1)
  }, [canUndo, history, historyIndex])

  const handleRedo = useCallback(() => {
    if (!canRedo) return
    const next = history[historyIndex + 1]
    setResult((r) => r ? { ...r, html: next.html, slotMapping: next.slotMapping } : null)
    setHistoryIndex((i) => i + 1)
  }, [canRedo, history, historyIndex])

  // =========================================================================
  // 핸들러 — NEW PROJECT
  // =========================================================================

  const handleNewProject = useCallback(() => {
    setMode('REPORT')
    setOrientation('LANDSCAPE')
    setImages([])
    setVideoStartImage(null)
    setVideoEndImage(null)
    setPrompt('')
    setPageCount(6)
    setResult(null)
    setCurrentPage(0)
    setError(null)
    setHistory([])
    setHistoryIndex(-1)
  }, [])

  // =========================================================================
  // 핸들러 — EXPORT (Stage 2 구현 예정)
  // =========================================================================

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleExport = useCallback((_format: ExportFormat) => {
    // Stage 2 구현 예정
  }, [])

  // =========================================================================
  // 핸들러 — Library 이미지 선택 (Stage 2 구현 예정)
  // =========================================================================

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLibrarySelectImage = useCallback((_img: LibraryImage) => {
    // Stage 2 구현 예정
  }, [])

  // =========================================================================
  // 핸들러 — Saves (Stage 2 구현 예정)
  // =========================================================================

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSavesOpen = useCallback((_doc: SavedDocument) => {
    // Stage 2 구현 예정
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSavesDelete = useCallback((_docId: string) => {
    // Stage 2 구현 예정
  }, [])

  // =========================================================================
  // Generate 조건: canGenerate
  // =========================================================================

  const canGenerate = mode === 'VIDEO'
    ? (videoStartImage !== null && videoEndImage !== null)
    : images.length > 0

  // =========================================================================
  // 페이지별 HTML 추출 (PreviewStrip용)
  // =========================================================================

  const pages: string[] = result?.html ? [result.html] : []

  // =========================================================================
  // 문서 렌더러 선택
  // =========================================================================

  function renderDocument() {
    if (!result) return null

    const commonProps = {
      html: result.html ?? '',
      slotMapping: result.slotMapping,
      masterData: result.masterData,
      pageIndex: currentPage,
    }

    switch (mode) {
      case 'REPORT':
        return <ReportTemplate {...commonProps} />
      case 'PANEL':
        return <PanelTemplate {...commonProps} orientation={orientation} />
      case 'DRAWING':
        return <DrawingTemplate {...commonProps} />
      case 'VIDEO':
        return <VideoTemplate videoUri={result.videoUri ?? null} />
    }
  }

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <>
      {/* 1. 상단 헤더 */}
      <GlobalHeader
        status={isGenerating ? 'generating' : error ? 'error' : 'idle'}
      />

      {/* 2. 좌측 플로팅 툴바 */}
      <Toolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenSaves={() => setIsSavesOpen(true)}
        onNewProject={handleNewProject}
      />

      {/* 3. 중앙 캔버스 */}
      <Canvas
        mode={mode}
        isEmpty={!result}
        isLoading={isGenerating}
      >
        {renderDocument()}
      </Canvas>

      {/* 4. 하단 페이지 미리보기 바 */}
      <PreviewStrip
        pages={pages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* 5. 우측 사이드바 */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((v) => !v)}
        headerSlot={<NodeSelector currentNode="PRINT" />}
        contentSlot={
          <div className="flex flex-col gap-4">
            {/* INSERT IMAGE */}
            <ImageInsert
              mode={mode}
              images={images}
              onImagesChange={setImages}
              videoStartImage={videoStartImage}
              videoEndImage={videoEndImage}
              onVideoStartChange={setVideoStartImage}
              onVideoEndChange={setVideoEndImage}
            />

            {/* PURPOSE */}
            <PurposeSelector
              mode={mode}
              orientation={orientation}
              onModeChange={handleModeChange}
              onOrientationChange={setOrientation}
            />

            {/* NUMBER OF PAGES */}
            <PageCountControl
              mode={mode}
              value={pageCount}
              onChange={setPageCount}
            />

            {/* PROMPT */}
            <PromptInput
              value={prompt}
              onChange={setPrompt}
            />

            {/* 에러 메시지 */}
            {error && (
              <p className="text-xs text-red-500 leading-relaxed">{error}</p>
            )}
          </div>
        }
        footerSlot={
          <ActionButtons
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            canExport={!!result}
            onGenerate={handleGenerate}
            onExport={handleExport}
          />
        }
      />

      {/* 6. 모달 — Library */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        folders={[] as LibraryFolder[]}
        onSelectImage={handleLibrarySelectImage}
      />

      {/* 7. 모달 — Saves */}
      <SavesModal
        isOpen={isSavesOpen}
        onClose={() => setIsSavesOpen(false)}
        documents={[] as SavedDocument[]}
        onOpen={handleSavesOpen}
        onDelete={handleSavesDelete}
      />
    </>
  )
}