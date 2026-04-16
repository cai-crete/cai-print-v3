'use client'

/**
 * PanelTemplate.tsx — PANEL 모드 문서 렌더러 (스켈레톤)
 * N10-print.md Output Contract 기준:
 *   html: API 응답 완성 HTML → dangerouslySetInnerHTML로 렌더링
 * design-style-guide.md §4:
 *   A0 Landscape (1189×841mm) / A0 Portrait (841×1189mm) — orientation 의존
 *
 * Stage 2 구현 예정:
 *   - orientation 기반 컨테이너 크기 전환
 *   - 뷰포트 스케일 다운 (A0 → 화면 맞춤)
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { DocumentTemplateProps, PanelOrientation } from '@/lib/types'

interface PanelTemplateProps extends DocumentTemplateProps {
  /** PANEL 전용 용지 방향 */
  orientation?: PanelOrientation
}

export default function PanelTemplate({
  html,
  slotMapping: _slotMapping,
  masterData: _masterData,
  pageIndex: _pageIndex,
  scale = 1,
  orientation = 'LANDSCAPE',
}: PanelTemplateProps) {
  return (
    <div
      style={{
        /*
         * A0 Landscape / Portrait 물리 크기 기준.
         * orientation 값에 따라 aspect-ratio를 설정하여 비율 유지.
         * Stage 2에서 실제 mm → px 환산 및 scale 적용.
         */
        width: '100%',
        aspectRatio: orientation === 'LANDSCAPE' ? '1189 / 841' : '841 / 1189',
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        backgroundColor: 'var(--color-doc-bg)',
        overflow: 'hidden',
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
