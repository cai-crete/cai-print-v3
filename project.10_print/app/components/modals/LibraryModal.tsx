'use client'

import React, { useState, useRef, useEffect } from 'react'
import type { LibraryFolder, LibraryImage } from '../../../lib/types'

interface LibraryModalProps {
  isOpen: boolean
  onClose: () => void
  folders: LibraryFolder[]
  
  // Manage mode props
  onSelectImage?: (image: LibraryImage) => void
  onAddFolder?: () => void
  onDeleteFolders?: (folderIds: string[]) => void
  onDeleteImages?: (folderId: string, imageIds: string[]) => void
  onAddFileToFolder?: (folderId: string, file: File) => void
  onAddImagesToFolder?: (folderId: string, images: LibraryImage[]) => void
  
  // Select mode props
  mode?: 'manage' | 'select'
  maxSelect?: number // 1이면 단일 선택 (VIDEO 모드 전용)
  onSelectImages?: (images: LibraryImage[]) => void
}

export default function LibraryModal({
  isOpen,
  onClose,
  folders,
  onSelectImage,
  onAddFolder,
  onDeleteFolders,
  onDeleteImages,
  onAddFileToFolder,
  onAddImagesToFolder,
  mode = 'manage',
  maxSelect,
  onSelectImages,
}: LibraryModalProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  // select 모드면 항상 체크박스가 노출되게 취급 (단, maxSelect === 1일 때는 제외)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [isInternalSelecting, setIsInternalSelecting] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addMenuButtonRef = useRef<HTMLButtonElement>(null)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set())
      setIsDeleteMode(false)
      setIsInternalSelecting(false)
      setShowAddMenu(false)
    }
  }, [isOpen])

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showAddMenu) {
        const isClickInsideButton = addMenuButtonRef.current?.contains(e.target as Node)
        const isClickInsideMenu = addMenuRef.current?.contains(e.target as Node)
        
        if (!isClickInsideButton && !isClickInsideMenu) {
          setShowAddMenu(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAddMenu])

  if (!isOpen) return null

  const isSelectMode = mode === 'select'
  const isMultiSelect = isSelectMode && maxSelect !== 1
  const showCheckboxes = isDeleteMode || isMultiSelect || isInternalSelecting

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteExecute = () => {
    if (selectedIds.size === 0) return
    if (!activeFolderId && onDeleteFolders) {
      onDeleteFolders(Array.from(selectedIds))
    } else if (activeFolderId && onDeleteImages) {
      onDeleteImages(activeFolderId, Array.from(selectedIds))
    }
    setIsDeleteMode(false)
    setSelectedIds(new Set())
  }

  const handleInsertExecute = () => {
    if (selectedIds.size === 0) return
    if (!onSelectImages) return

    let gathered: LibraryImage[] = []
    if (!activeFolderId) {
      // 폴더선택 시 폴더 안의 전체 이미지 병합
      selectedIds.forEach(id => {
        const folder = folders.find(f => f.id === id)
        if (folder) gathered.push(...folder.images)
      })
    } else {
      gathered = activeFolder!.images.filter(img => selectedIds.has(img.id))
    }
    
    onSelectImages(gathered)
    onClose()
  }

  const handleAddClick = () => {
    if (!activeFolderId) {
      onAddFolder?.()
    } else {
      setShowAddMenu(!showAddMenu)
    }
  }

  const handleAddFromLibraryExecute = () => {
    if (selectedIds.size === 0 || !activeFolderId || !onAddImagesToFolder) return
    
    // 전체 이미지 중 선택된 것들 필터링 (ROOT 가상 폴더 이미지 포함 전체에서 검색)
    const allImages = folders.flatMap(f => f.images)
    const toCopy = allImages.filter(img => selectedIds.has(img.id))
    
    // 중복 제거 (ID 기준)
    const uniqueToCopyMap = new Map()
    toCopy.forEach(img => uniqueToCopyMap.set(img.id, img))
    const uniqueToCopy = Array.from(uniqueToCopyMap.values())

    onAddImagesToFolder(activeFolderId, uniqueToCopy)
    setIsInternalSelecting(false)
    setSelectedIds(new Set())
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && activeFolderId && onAddFileToFolder) {
      Array.from(files).forEach(f => onAddFileToFolder(activeFolderId, f))
    }
    if (e.target) e.target.value = ''
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
          width: 'min(640px, 90vw)',
          height: '75vh',
          backgroundColor: 'var(--color-doc-bg)',
          borderRadius: 'var(--radius-box)',
          boxShadow: 'var(--shadow-float)',
          zIndex: 'var(--z-modal)',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between shrink-0 px-5 py-4 border-b border-gray-100/50">
          <div className="flex items-center gap-3">
            {isInternalSelecting ? (
              <button onClick={() => { setIsInternalSelecting(false); setSelectedIds(new Set()) }} className="text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            ) : activeFolderId ? (
              <button onClick={() => { setActiveFolderId(null); setIsDeleteMode(false); setSelectedIds(new Set()) }} className="text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            ) : null}
            <span className="text-ui-title text-gray-800 tracking-wide mt-1">
              {isInternalSelecting ? 'ALL IMAGES' : activeFolder ? activeFolder.name.toUpperCase() : 'LIBRARY'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={handleFileChange} />
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-full p-[2px]">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>

            {/* Manage Mode - Add & Delete */}
            {!isSelectMode && !isInternalSelecting && (
              <div className="relative">
                {!isDeleteMode ? (
                  <div className="flex items-center gap-2">
                    <button
                      ref={addMenuButtonRef}
                      onClick={handleAddClick}
                      className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    {!activeFolderId && (
                      <button
                        onClick={() => setIsDeleteMode(true)}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setIsDeleteMode(false); setSelectedIds(new Set()); }}
                      className="px-3 py-1 text-xs rounded-full border border-gray-200 font-medium"
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

                {/* 추가 메뉴 (팝오버) */}
                {showAddMenu && (
                  <div 
                    ref={addMenuRef}
                    className="absolute top-10 right-0 z-[1001] flex flex-col bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded-lg border border-gray-100 overflow-hidden w-40 whitespace-nowrap"
                  >
                    <button 
                      className="text-left px-4 py-3 text-xs tracking-wider font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors" 
                      onClick={() => { setShowAddMenu(false); fileInputRef.current?.click() }}
                    >
                      디바이스에서 추가
                    </button>
                    <div className="h-px bg-gray-100 mx-2" />
                    <button 
                      className="text-left px-4 py-3 text-xs tracking-wider font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors" 
                      onClick={() => { setShowAddMenu(false); setIsInternalSelecting(true); setSelectedIds(new Set()) }}
                    >
                      라이브러리에서 추가
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Internal Selecting - ADD button */}
            {isInternalSelecting && (
              <button
                onClick={handleAddFromLibraryExecute}
                className="px-4 py-1 text-xs rounded-full border border-gray-200 bg-white text-black font-bold tracking-wide hover:bg-gray-50 transition-colors"
              >
                ADD
              </button>
            )}

            {/* Select Mode - Insert */}
            {isMultiSelect && !isInternalSelecting && (
              <button
                onClick={handleInsertExecute}
                className="px-4 py-1 text-xs rounded-full border border-gray-200 bg-white text-black font-bold tracking-wide hover:bg-gray-50 transition-colors"
              >
                INSERT
              </button>
            )}

            {/* Close */}
            <div className="w-[1px] h-4 bg-gray-200 mx-1" />
            <button onClick={onClose} className="text-gray-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-5">
          {folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <p className="mt-2 text-sm text-gray-400">폴더가 없습니다</p>
            </div>
          ) : isInternalSelecting ? (
            /* 내부 선택 (모든 이미지 평면 리스트) */
            <div className={viewMode === 'grid' ? "grid grid-cols-4 gap-4" : "flex flex-col gap-2"}>
              {(() => {
                const allImagesMap = new Map()
                folders.forEach(f => f.images.forEach(img => allImagesMap.set(img.id, img)))
                const allImages = Array.from(allImagesMap.values())

                if (allImages.length === 0) return <div className="col-span-4 text-center text-gray-400 py-10">가져올 수 있는 이미지가 없습니다</div>
                
                return allImages.map(img => (
                  <div
                    key={`all-${img.id}`}
                    className={`relative ${viewMode === 'list' && 'flex items-center gap-4 bg-gray-50/50 p-2 rounded-xl group hover:bg-gray-100/50 transition-colors'}`}
                  >
                    <div className={viewMode === 'grid' ? "absolute top-2 left-2 z-10" : "flex-shrink-0 absolute left-3 z-10"}>
                      <input
                        type="checkbox"
                        className="w-5 h-5 cursor-pointer accent-black"
                        checked={selectedIds.has(img.id)}
                        onChange={() => toggleSelection(img.id)}
                      />
                    </div>
                    <button
                      onClick={() => toggleSelection(img.id)}
                      className={`relative w-full cursor-pointer ${viewMode === 'grid' ? 'aspect-square' : 'flex flex-1 items-center gap-4 pl-10'}`}
                    >
                      <div className={`${viewMode === 'grid' ? 'w-full h-full' : 'w-12 h-12 flex-shrink-0'} rounded-lg overflow-hidden bg-gray-100 border ${selectedIds.has(img.id) ? 'border-black' : 'border-gray-200'} transition-all`}>
                        <img src={img.thumbnailUrl ?? img.url} alt={img.name} className={`w-full h-full object-cover ${viewMode === 'grid' ? 'hover:scale-105 transition-transform duration-300' : ''}`} />
                      </div>
                      {viewMode === 'list' && (
                        <span className="text-sm font-medium text-gray-700 truncate text-left flex-1">{img.name}</span>
                      )}
                    </button>
                  </div>
                ))
              })()}
            </div>
          ) : !activeFolder ? (
            /* 폴더 목록 */
            <div className={viewMode === 'grid' ? "grid grid-cols-3 gap-5" : "flex flex-col gap-2"}>
              {folders.map((folder) => {
                const repImage = folder.images[0]?.thumbnailUrl ?? folder.images[0]?.url
                return (
                  <div
                    key={folder.id}
                    className={`relative group ${viewMode === 'grid' ? 'flex flex-col' : 'flex items-center gap-4 bg-gray-50/50 hover:bg-gray-100/50 p-3 rounded-xl transition-colors'}`}
                  >
                    {/* 썸네일 렌더링 내 체크박스 여부 (단, 단일 선택 모드의 select 모드면 폴더 체크박스 생략) */}
                    {showCheckboxes && (!isSelectMode || isMultiSelect) && (
                      <div className="absolute top-3 left-3 z-50">
                        <input
                          type="checkbox"
                          className="w-5 h-5 cursor-pointer accent-black"
                          checked={selectedIds.has(folder.id)}
                          onChange={() => toggleSelection(folder.id)}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => {
                         // 체크박스 떠있을 땐 폴더 단순 클릭 시 이동, 단일 선택 시에도 내부 이동
                         if (isDeleteMode) return // 삭제 모드일 땐 내부 이동 불가
                         setActiveFolderId(folder.id)
                      }}
                      className={`text-left w-full ${isDeleteMode ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div className={`relative w-full aspect-[4/3] flex flex-col mt-2`}>
                            {/* 폴더 탭 */}
                            <div className={`absolute -top-2 left-0 w-[40%] h-3 rounded-t-md mx-2 ${showCheckboxes && selectedIds.has(folder.id) ? 'bg-black' : 'bg-gray-200'} transition-all z-0`} />
                            
                            {/* 본체 부분 */}
                            <div className={`flex-1 relative z-10 bg-gray-50 rounded-xl rounded-tl-none overflow-hidden border ${showCheckboxes && selectedIds.has(folder.id) ? 'border-black' : 'border-gray-200'} transition-all`}>
                              {repImage ? (
                                <img src={repImage} alt="folder thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-white">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-gray-800 truncate px-1">{folder.name}</p>
                          <p className="text-xs text-gray-400 px-1">{folder.images.length}장</p>
                        </>
                      ) : (
                        <div className="flex gap-4 items-center flex-1 w-full pl-8">
                          <div className={`w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border ${showCheckboxes && selectedIds.has(folder.id) ? 'border-black' : 'border-gray-200'}`}>
                            {repImage ? (
                              <img src={repImage} alt="thumbnail" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{folder.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{folder.images.length}장</p>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            /* 이미지 그리드/리스트 */
            <div className={viewMode === 'grid' ? "grid grid-cols-4 gap-4" : "flex flex-col gap-2"}>
              {activeFolder.images.length === 0 && (
                <div className="col-span-4 text-center text-gray-400 py-10">폴더가 비어있습니다</div>
              )}
              {activeFolder.images.map((img) => (
                <div
                  key={img.id}
                  className={`relative ${viewMode === 'list' && 'flex items-center gap-4 bg-gray-50/50 p-2 rounded-xl group hover:bg-gray-100/50 transition-colors'}`}
                >
                  {showCheckboxes && (
                    <div className={viewMode === 'grid' ? "absolute top-2 left-2 z-10" : "flex-shrink-0 absolute left-3 z-10"}>
                      <input
                        type="checkbox"
                        className="w-5 h-5 cursor-pointer accent-black"
                        checked={selectedIds.has(img.id)}
                        onChange={() => toggleSelection(img.id)}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (isMultiSelect || isDeleteMode) {
                         // 체크박스가 있는 상태면 클릭 시 토글 유도! 아니면 그냥 놔둠 (사용자는 체크박스 자체를 누름)
                         toggleSelection(img.id)
                      } else {
                         // 단일 선택 or manage 일반 클릭
                         onSelectImage?.(img)
                         onClose()
                      }
                    }}
                    className={`relative w-full ${isDeleteMode ? 'cursor-default' : 'cursor-pointer'} ${viewMode === 'grid' ? 'aspect-square' : 'flex flex-1 items-center gap-4 pl-10'}`}
                  >
                    <div className={`${viewMode === 'grid' ? 'w-full h-full' : 'w-12 h-12 flex-shrink-0'} rounded-lg overflow-hidden bg-gray-100 border ${showCheckboxes && selectedIds.has(img.id) ? 'border-black' : 'border-gray-200'} transition-all`}>
                      <img src={img.thumbnailUrl ?? img.url} alt={img.name} className={`w-full h-full object-cover ${viewMode === 'grid' ? 'hover:scale-105 transition-transform duration-300' : ''}`} />
                    </div>
                    {viewMode === 'list' && (
                      <span className="text-sm font-medium text-gray-700 truncate text-left flex-1">{img.name}</span>
                    )}
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
