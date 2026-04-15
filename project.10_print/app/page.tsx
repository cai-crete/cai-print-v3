'use client'

import React, { useState, useRef } from 'react'
import VideoTemplate from '@/app/components/VideoTemplate'

type PrintMode = 'REPORT' | 'PANEL' | 'DRAWING' | 'VIDEO'

interface PrintResult {
  html: string
  slotMapping: Record<string, unknown>
  masterData: Record<string, unknown>
  videoUri?: string | null
}

export default function PrintPage() {
  const [mode, setMode] = useState<PrintMode>('REPORT')
  const [images, setImages] = useState<File[]>([])
  const [prompt, setPrompt] = useState('')
  const [pageCount, setPageCount] = useState(4)
  const [result, setResult] = useState<PrintResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGenerate = async () => {
    if (images.length === 0) {
      setError('이미지를 최소 1장 업로드하세요.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('mode', mode)
      formData.append('prompt', prompt)
      if (mode === 'REPORT' || mode === 'PANEL') {
        formData.append('pageCount', String(pageCount))
      }
      for (const image of images) {
        formData.append('images', image)
      }
      const res = await fetch('/api/print', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '서버 오류가 발생했습니다.')
      } else {
        setResult(data as PrintResult)
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden text-[#000000]">
      {/* 1. Global Header (System Layer: 10) */}
      <header className="absolute top-0 left-0 right-0 h-14 bg-white border-b border-[#EEEEEE] flex items-center px-6 z-10">
        <h1 className="text-xl font-[800] tracking-tighter">CAI CANVAS | PRINT</h1>
      </header>

      {/* 2. Floating Nav (Nav Layer: 100) */}
      <nav className="absolute top-[4.5rem] right-4 w-72 h-11 bg-white rounded-[10px] shadow-lg flex items-center px-4 z-[100]">
        <div className="flex space-x-4 text-sm font-medium">
          {(['REPORT', 'PANEL', 'DRAWING', 'VIDEO'] as PrintMode[]).map((m) => (
            <button
              key={m}
              className={mode === m ? 'text-[#007BFF]' : 'text-[#666666]'}
              onClick={() => { setMode(m); setResult(null); setError(null) }}
            >
              {m}
            </button>
          ))}
        </div>
      </nav>

      {/* 3. Primary Sidebar (Control Layer: 90) */}
      <aside className="absolute top-[8rem] bottom-4 right-4 w-72 bg-white rounded-[10px] shadow-lg p-5 z-[90] flex flex-col">
        <h2 className="text-lg font-bold mb-4 border-b border-dashed border-[#CCCCCC] pb-2">Properties</h2>

        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#333333] mb-1">Images</label>
            <div
              className="w-full h-24 bg-[#F8F8F8] border border-dashed border-[#CCCCCC] rounded-[10px] flex items-center justify-center text-sm text-[#666666] cursor-pointer hover:border-[#007BFF]"
              onClick={() => fileInputRef.current?.click()}
            >
              {images.length > 0 ? `${images.length}장 선택됨` : '+ Upload Images'}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            />
          </div>

          {(mode === 'REPORT' || mode === 'PANEL') && (
            <div>
              <label className="block text-sm font-semibold text-[#333333] mb-1">Page Count</label>
              <input
                type="number"
                value={pageCount}
                min={1}
                onChange={(e) => setPageCount(parseInt(e.target.value) || 1)}
                className="w-full border border-[#CCCCCC] rounded-[10px] p-2 text-sm focus:outline-none focus:border-[#007BFF]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#333333] mb-1">Prompt (Theme)</label>
            <textarea
              placeholder="e.g. 고층 오피스 외부에서..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full border border-[#CCCCCC] rounded-[10px] p-2 text-sm h-24 focus:outline-none focus:border-[#007BFF] resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 w-full h-[40px] rounded-full bg-[#007BFF] text-white font-bold text-sm shadow-md hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : `Generate ${mode}`}
        </button>
      </aside>

      {/* 4. Preview Strip (Preview Layer: 20) */}
      <div className="absolute bottom-4 left-4 right-[21.25rem] h-40 bg-white rounded-[10px] shadow-lg p-4 z-[20] flex items-center space-x-4 overflow-x-auto border border-[#EEEEEE]">
        <div className="text-[#666666] text-sm">
          {result ? '생성 완료' : 'Preview Generation Results'}
        </div>
      </div>

      {/* 5. Canvas Layer (Base) */}
      <main className="absolute inset-0 pt-14 overflow-hidden flex items-center justify-center p-8 z-0">
        <div className="w-full h-full max-w-[800px] bg-white shadow-xl relative overflow-auto flex items-center justify-center text-[#CCCCCC]">
          <div className="absolute inset-0 pointer-events-none border border-dashed border-[rgba(0,255,255,0.5)] m-4"></div>
          {result ? (
            mode === 'VIDEO' ? (
              <VideoTemplate videoUri={result.videoUri ?? null} />
            ) : (
              <div
                className="w-full h-full p-4 text-black"
                dangerouslySetInnerHTML={{ __html: result.html }}
              />
            )
          ) : (
            `[ ${mode} Document Canvas Area ]`
          )}
        </div>
      </main>
    </div>
  )
}