'use client'

/**
 * VideoTemplate.tsx — VIDEO 모드 전용 렌더러
 * Kling O3 (fal.ai)를 통해 생성된 영상을 렌더링하는 컴포넌트.
 * N10-print.md Output Contract: videoUri → MP4 URL
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React, { useState, useEffect } from 'react'
import type { VideoTemplateProps } from '../../../lib/types'

// fal.ai 영상 TTL 안내 문구 — fal.ai 정책 변경 시 이 상수만 갱신
const FAL_VIDEO_TTL_NOTICE = '이 영상은 약 1시간 후 만료됩니다. 지금 다운로드하세요.'

export default function VideoTemplate({ videoUri, isLoading }: VideoTemplateProps) {
  const [videoError, setVideoError] = useState(false)

  // videoUri 변경 시 오류 상태 초기화
  useEffect(() => {
    setVideoError(false)
  }, [videoUri])

  const handleVideoError = () => {
    setVideoError(true)
    console.warn('[VIDEO QA] D등급 — 영상 로드 실패 (URL 만료 또는 오류). 시각 QA 체크리스트를 확인하세요.')
  }

  // 1. 영상 생성 중 (Loading State) — 프로토콜 §IV '건축적 로딩 보드'
  if (isLoading && !videoUri) {
    return (
      <div
        className="w-full relative flex flex-col items-center justify-center overflow-hidden"
        style={{
          aspectRatio: '16 / 9',
          backgroundColor: 'var(--color-placeholder)',
          borderRadius: 'var(--radius-box)',
        }}
      >
        {/* 건축 가이드 라인 (배경) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black" />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(var(--color-gray-200) 1px, transparent 1px), linear-gradient(90deg, var(--color-gray-200) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* 진행 바 (Gray Filling) */}
        <div className="relative w-3/4 h-1 bg-white/50 overflow-hidden mb-6">
          <div
            className="absolute top-0 left-0 h-full bg-[--color-gray-400] transition-all duration-1000 ease-linear"
            style={{
              width: '100%',
              animation: 'loading-fill 120s linear infinite',
            }}
          />
        </div>

        <div className="flex flex-col items-center gap-2 z-10">
          <span className="text-ui-title tracking-widest text-[--color-text-primary]">
            GENERATING VIDEO
          </span>
          <span className="text-[10px] tracking-widest text-[--color-text-caption] uppercase">
            Kling O3 — Rendering Architectural Perspective
          </span>
        </div>

        <style jsx>{`
          @keyframes loading-fill {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0); }
          }
        `}</style>
      </div>
    )
  }

  // 2. 대기 상태 (Empty State)
  if (!videoUri) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{
          aspectRatio: '16 / 9',
          backgroundColor: 'var(--color-placeholder)',
          borderRadius: 'var(--radius-box)',
          color: 'var(--color-text-caption)',
          fontSize: '0.875rem',
        }}
      >
        비디오 생성 대기 중...
      </div>
    )
  }

  // 3. 완료 상태 (Playback State)
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        aspectRatio: '16 / 9',
        borderRadius: 'var(--radius-box)',
        backgroundColor: '#000',
      }}
    >
      {videoError ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ color: '#fff' }}>
          <span style={{ fontSize: '0.875rem' }}>영상을 불러올 수 없습니다.</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '0 1rem' }}>
            {FAL_VIDEO_TTL_NOTICE}
          </span>
        </div>
      ) : (
        <video
          src={videoUri}
          controls
          autoPlay
          loop
          playsInline
          muted
          onError={handleVideoError}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        >
          브라우저가 비디오 태그를 지원하지 않습니다.
        </video>
      )}
    </div>
  )
}