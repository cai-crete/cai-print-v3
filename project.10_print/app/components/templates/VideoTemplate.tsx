'use client'

/**
 * VideoTemplate.tsx — VIDEO 모드 전용 렌더러
 * Veo 3.1 Lite API를 통해 생성된 영상을 렌더링하는 컴포넌트.
 * N10-print.md Output Contract: videoUri → MP4 스트림 URI
 * design-style-guide.md §1: 16:9, 8초, Veo 3.1 lite
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { VideoTemplateProps } from '@/lib/types'

export default function VideoTemplate({ videoUri }: VideoTemplateProps) {
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

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        aspectRatio: '16 / 9',
        borderRadius: 'var(--radius-box)',
        backgroundColor: '#000',
      }}
    >
      <video
        src={videoUri}
        controls
        autoPlay
        loop
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      >
        브라우저가 비디오 태그를 지원하지 않습니다.
      </video>
    </div>
  )
}
