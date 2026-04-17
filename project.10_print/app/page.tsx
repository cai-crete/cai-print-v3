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

import React, { useState, useCallback, useEffect } from 'react'

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
  AgentErrorInfo,
  HistoryEntry,
  LibraryFolder,
  LibraryImage,
  SavedDocument,
  ExportFormat,
} from '@/lib/types'

// -- Export
import { exportDocument } from '@/lib/export'

// -- Saves
import { savesGet, savesSave, savesDelete } from '@/lib/saves'

// -- Image utils
import { compressImage } from '@/lib/imageUtils'

// =============================================================================
// Helper — 에이전트 구조화 오류 전달용 클래스
// =============================================================================

class AgentApiError extends Error {
  constructor(public readonly info: AgentErrorInfo) {
    super(info.message)
    this.name = 'AgentApiError'
  }
}

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
    // 에이전트 구조화 오류 (failedAgent 포함) → AgentApiError로 전달
    if (data.failedAgent) {
      throw new AgentApiError({
        message:     data.error ?? '에이전트 오류가 발생했습니다.',
        failedAgent: data.failedAgent,
        errorType:   data.errorType ?? 'API_ERROR',
        partialLog:  data.partialLog ?? {},
      })
    }
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
  const [isExporting, setIsExporting]   = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [agentError, setAgentError]     = useState<AgentErrorInfo | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isLibraryOpen, setIsLibraryOpen]       = useState(false)
  const [isSavesOpen, setIsSavesOpen]           = useState(false)
  const [libraryFolders, setLibraryFolders]     = useState<LibraryFolder[]>([])
  const [isLibraryLoading, setIsLibraryLoading] = useState(false)
  const [libraryActionTarget, setLibraryActionTarget] = useState<'common' | 'videoStart' | 'videoEnd' | null>(null)
  const [savedDocuments, setSavedDocuments]     = useState<SavedDocument[]>([])

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
    setAgentError(null)
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
    setAgentError(null)

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
      if (err instanceof AgentApiError) {
        setAgentError(err.info)
      } else {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      }
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
    setAgentError(null)
    setHistory([])
    setHistoryIndex(-1)
  }, [])

  // =========================================================================
  // 핸들러 — EXPORT (Stage 2 구현 예정)
  // =========================================================================

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!result) return
    setIsExporting(true)
    setError(null)
    try {
      await exportDocument(
        result.html ?? '',
        mode,
        orientation,
        format,
        result.videoUri
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'EXPORT 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }, [result, mode, orientation])

  // =========================================================================
  // 핸들러 — Library 열기 (지연 로딩)
  // =========================================================================

  const handleOpenLibrary = useCallback(async (target?: 'common' | 'videoStart' | 'videoEnd') => {
    setLibraryActionTarget(target ?? null)
    setIsLibraryOpen(true)
    if (libraryFolders.length > 0 || isLibraryLoading) return
    setIsLibraryLoading(true)
    try {
      const res  = await fetch('/api/library')
      const data = await res.json()
      const virtualFolder = {
        id: 'ROOT',
        name: 'ALL IMAGES',
        images: data.rootImages || [],
        createdAt: new Date().toISOString()
      }
      setLibraryFolders([virtualFolder, ...(data.folders || [])])
    } catch {
      // 조용히 실패 — 빈 상태 표시
    } finally {
      setIsLibraryLoading(false)
    }
  }, [libraryFolders.length, isLibraryLoading])

  // =========================================================================
  // 핸들러 — Library 이미지 선택
  // =========================================================================

  const handleLibrarySelectImage = useCallback(async (img: LibraryImage) => {
    try {
      const res  = await fetch(img.url)
      const blob = await res.blob()
      const raw  = new File([blob], img.name, { type: blob.type })
      const file = await compressImage(raw)

      if (!libraryActionTarget || libraryActionTarget === 'common') {
        setImages((prev) => [...prev, file])
      } else if (libraryActionTarget === 'videoStart') {
        setVideoStartImage(file)
      } else if (libraryActionTarget === 'videoEnd') {
        setVideoEndImage(file)
      }
    } catch {
      setError('라이브러리 이미지를 불러오는 데 실패했습니다.')
    }
  }, [libraryActionTarget])

  // =========================================================================
  // 핸들러 — Saves
  // =========================================================================

  // mount 시 localStorage에서 목록 로드
  useEffect(() => {
    setSavedDocuments(savesGet())
  }, [])

  const handleSave = useCallback(() => {
    if (!result) return
    const doc: SavedDocument = {
      id:        `${Date.now()}`,
      title:     `${mode} 문서`,
      mode,
      pageCount,
      result,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    savesSave(doc)
    setSavedDocuments(savesGet())
  }, [result, mode, pageCount])

  const handleOpenSaves = useCallback(() => {
    setSavedDocuments(savesGet())
    setIsSavesOpen(true)
  }, [])

  const handleSavesOpen = useCallback((doc: SavedDocument) => {
    setMode(doc.mode)
    setPageCount(doc.pageCount)
    setResult(doc.result)
    setCurrentPage(0)
    setError(null)
  }, [])

  const handleSavesDelete = useCallback((docIds: string[]) => {
    docIds.forEach((id) => savesDelete(id))
    setSavedDocuments(savesGet())
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
        return <VideoTemplate videoUri={result.videoUri ?? null} isLoading={isGenerating} />
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
        onOpenLibrary={() => handleOpenLibrary()}
        onOpenSaves={handleOpenSaves}
        onSave={handleSave}
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
        mode={mode}
        orientation={orientation}
      />

      {/* 5. 우측 사이드바 */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((v) => !v)}
        headerSlot={<NodeSelector currentNode="PRINT" />}
        contentSlot={
          <div className="flex flex-col gap-8">
            {/* INSERT IMAGE */}
            <ImageInsert
              label="INSERT IMAGE"
              mode={mode}
              images={images}
              onImagesChange={setImages}
              videoStartImage={videoStartImage}
              videoEndImage={videoEndImage}
              onVideoStartChange={setVideoStartImage}
              onVideoEndChange={setVideoEndImage}
              onLibraryRequest={handleOpenLibrary}
            />

            {/* PURPOSE */}
            <PurposeSelector
              label="PURPOSE"
              mode={mode}
              orientation={orientation}
              onModeChange={handleModeChange}
              onOrientationChange={setOrientation}
            />

            {/* NUMBER OF PAGES */}
            <PageCountControl
              label="NUMBER OF PAGES"
              mode={mode}
              value={pageCount}
              onChange={setPageCount}
            />

            {/* PROMPT */}
            <PromptInput
              label="PROMPT"
              value={prompt}
              onChange={setPrompt}
            />

            {/* 에러 메시지 — 단순 오류 */}
            {error && !agentError && (
              <p className="text-xs text-red-500 leading-relaxed">{error}</p>
            )}

            {/* 에러 메시지 — 에이전트 구조화 오류 */}
            {agentError && (
              <div
                style={{
                  border: '1px solid #f87171',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#fff1f2',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  color: '#b91c1c',
                }}
              >
                {/* 실패 단계 */}
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  ✕ {agentError.failedAgent} 단계 실패
                </p>
                {/* 오류 유형 */}
                <p style={{ color: '#6b7280', marginBottom: '0.375rem' }}>
                  유형: {agentError.errorType}
                </p>
                {/* 안내 메시지 */}
                <p style={{ marginBottom: '0.5rem' }}>{agentError.message}</p>
                {/* 완료된 단계 로그 (존재할 때만) */}
                {Object.keys(agentError.partialLog).length > 0 && (
                  <details style={{ marginTop: '0.25rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#9ca3af', userSelect: 'none' }}>
                      완료된 단계 로그 보기
                    </summary>
                    <ul style={{ marginTop: '0.375rem', paddingLeft: '0.75rem', color: '#374151', listStyle: 'disc' }}>
                      {agentError.partialLog.preStep && <li>분류: {agentError.partialLog.preStep}</li>}
                      {agentError.partialLog.step1   && <li>OCR: {agentError.partialLog.step1}</li>}
                      {agentError.partialLog.step2   && <li>마스터 데이터: {agentError.partialLog.step2}</li>}
                      {agentError.partialLog.step3   && <li>레이아웃: {agentError.partialLog.step3}</li>}
                      {agentError.partialLog.step4   && <li>글 작성: {agentError.partialLog.step4}</li>}
                    </ul>
                  </details>
                )}
                {/* 닫기 */}
                <button
                  onClick={() => setAgentError(null)}
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        }
        footerSlot={
          <ActionButtons
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            canExport={!!result}
            isExporting={isExporting}
            mode={mode}
            onGenerate={handleGenerate}
            onExport={handleExport}
          />
        }
      />

      {/* 6. 모달 — Library */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => { setIsLibraryOpen(false); setLibraryActionTarget(null) }}
        folders={libraryFolders}
        mode={libraryActionTarget ? 'select' : 'manage'}
        maxSelect={mode === 'VIDEO' && libraryActionTarget ? 1 : undefined}
        onSelectImage={handleLibrarySelectImage}
        onSelectImages={async (imgs) => {
          const files = await Promise.all(imgs.map(async img => {
            const res = await fetch(img.url)
            const blob = await res.blob()
            const raw = new File([blob], img.name, { type: blob.type })
            return compressImage(raw)
          }))
          
          if (libraryActionTarget === 'common') {
            setImages(prev => [...prev, ...files])
          } else if (libraryActionTarget === 'videoStart') {
            setVideoStartImage(files[0] ?? null)
          } else if (libraryActionTarget === 'videoEnd') {
            setVideoEndImage(files[0] ?? null)
          }
          setLibraryActionTarget(null)
          setIsLibraryOpen(false)
        }}
        // 이 아래는 manage 모드 전용 prop
        onAddFolder={() => {}} // 만약 별도 동작이 없다면 비워둡니다 (이전 버전에서 handleLibraryAddFolder 등이 있었음)
      />

      {/* 7. 모달 — Saves */}
      <SavesModal
        isOpen={isSavesOpen}
        onClose={() => setIsSavesOpen(false)}
        documents={savedDocuments}
        onOpen={handleSavesOpen}
        onDeleteBatch={handleSavesDelete}
      />
    </>
  )
}