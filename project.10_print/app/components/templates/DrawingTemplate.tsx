'use client'

/**
 * DrawingTemplate.tsx — DRAWING 모드 문서 렌더러 (스켈레톤)
 * N10-print.md Output Contract 기준:
 *   html: API 응답 완성 HTML → dangerouslySetInnerHTML로 렌더링
 * design-style-guide.md §4:
 *   A3 Landscape (420×297mm), 도각 40mm (우측 Title Block)
 *
 * Stage 2 구현 예정:
 *   - 도각 마스터 데이터 동기화 표시
 *   - 뷰포트 스케일 조정
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { DocumentTemplateProps } from '@/lib/types'

export default function DrawingTemplate({
  html,
  slotMapping: _slotMapping,
  masterData: _masterData,
  pageIndex: _pageIndex,
  scale = 1,
}: DocumentTemplateProps) {
  return (
    <div
      style={{
        /*
         * A3 Landscape, 우측 도각(40mm) 포함.
         * 도각 마스터 데이터 동기화는 Stage 2에서 masterData를 통해 구현.
         */
        width: '100%',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        backgroundColor: 'var(--color-doc-bg)',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
