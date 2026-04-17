'use client'

import React, { useState } from 'react'
import type { SavedDocument } from '@/lib/types'

interface SavesModalProps {
  isOpen: boolean
  onClose: () => void
  documents: SavedDocument[]
  onOpen: (doc: SavedDocument) => void
  onDeleteBatch?: (docIds: string[]) => void
  onAddDocument?: (mode: string) => void
}

const TABS = ['전체', 'REPORT', 'DRAWING&SPECIFICATION', 'PANEL', 'VIDEO'] as const
type TabType = typeof TABS[number]

export default function SavesModal({
  isOpen,
  onClose,
  documents,
  onOpen,
  onDeleteBatch,
  onAddDocument,
}: SavesModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('전체')
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const filteredDocs = documents.filter(doc => {
    if (activeTab === '전체') return true
    if (activeTab === 'DRAWING&SPECIFICATION' && doc.mode === 'DRAWING') return true
    return doc.mode === activeTab
  })

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteExecute = () => {
    if (selectedIds.size > 0 && onDeleteBatch) {
      onDeleteBatch(Array.from(selectedIds))
    }
    setIsDeleteMode(false)
    setSelectedIds(new Set())
  }

  const handleAddClick = () => {
    if (onAddDocument) {
      let mode = activeTab === '전체' ? 'REPORT' : activeTab === 'DRAWING&SPECIFICATION' ? 'DRAWING' : activeTab
      onAddDocument(mode)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40" style={{ zIndex: 'calc(var(--z-modal) - 1)' }} onClick={onClose} />

      <div
        className="fixed flex flex-col"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(800px, 95vw)',
          height: '80vh',
          backgroundColor: 'var(--color-doc-bg)',
          borderRadius: 'var(--radius-box)',
          boxShadow: 'var(--shadow-float)',
          zIndex: 'var(--z-modal)',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div className="flex flex-col shrink-0 px-5 pt-4 border-b border-gray-100/50">
          <div className="flex items-center justify-between pb-4">
            <span className="text-ui-title text-gray-800 tracking-wide mt-1">SAVES</span>

            <div className="flex items-center gap-3">
              {/* Add Button */}
              {!isDeleteMode && (
                <button
                  onClick={handleAddClick}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                  title="새로운 문서 추가"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              )}

              {/* Delete Mode Toggle / Finalize */}
              {!isDeleteMode ? (
                <button
                  onClick={() => setIsDeleteMode(true)}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                  title="문서 삭제"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setIsDeleteMode(false); setSelectedIds(new Set()); }}
                    className="px-3 py-1 text-xs rounded-full border border-gray-200"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleDeleteExecute}
                    className="px-4 py-1 text-xs rounded-full border border-gray-200 bg-white text-black font-bold tracking-wide hover:bg-gray-50 transition-colors"
                  >
                    DELETE
                  </button>
                </div>
              )}

              <div className="w-[1px] h-4 bg-gray-200 mx-1" />
              <button onClick={onClose} className="text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds(new Set()); setIsDeleteMode(false); }}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 본문 (그리드 뷰 고정) */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30">
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-300">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <p className="mt-3 text-sm text-gray-400">저장된 문서가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="relative group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {isDeleteMode && (
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        className="w-5 h-5 cursor-pointer accent-black shadow-sm"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelection(doc.id)}
                      />
                    </div>
                  )}
                  
                  <button
                    onClick={() => { if (!isDeleteMode) { onOpen(doc); onClose() } }}
                    className={`w-full aspect-[4/3] bg-gray-100 overflow-hidden ${isDeleteMode ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {doc.thumbnailUrl ? (
                      <img src={doc.thumbnailUrl} alt={doc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <line x1="3" y1="9" x2="21" y2="9"/>
                          <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                      </div>
                    )}
                  </button>
                  
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.title || '제목 없음'}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
                        {doc.mode} · {doc.pageCount}p
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(doc.updatedAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
