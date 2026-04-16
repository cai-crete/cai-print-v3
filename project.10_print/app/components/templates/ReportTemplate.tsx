'use client'

/**
 * ReportTemplate.tsx — REPORT 모드 문서 렌더러 (스켈레톤)
 * N10-print.md Output Contract 기준:
 *   html: API 응답 완성 HTML → dangerouslySetInnerHTML로 렌더링
 * design-style-guide.md §4: A3 Landscape (420×297mm)
 *
 * Stage 2 구현 예정:
 *   - 뷰포트 스케일 조정 (--ui-scale 기반)
 *   - 페이지 인덱스별 DOM 추출
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { DocumentTemplateProps } from '@/lib/types'

export default function ReportTemplate({
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
         * A3 Landscape 물리 크기 기준 (420×297mm → 96dpi 환산 기준 내부 비율 유지).
         * 실제 픽셀 스케일은 캔버스 뷰포트에 따라 scale 파라미터로 조정됨 (Stage 2).
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
