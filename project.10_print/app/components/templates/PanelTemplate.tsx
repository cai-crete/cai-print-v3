'use client'

/**
 * PanelTemplate.tsx — PANEL 모드 렌더러
 * DocumentFrame을 통해 A0 Landscape/Portrait 기준으로 스케일링하여 표시한다.
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { DocumentTemplateProps, PanelOrientation } from '@/lib/types'
import DocumentFrame from './DocumentFrame'

interface PanelTemplateProps extends DocumentTemplateProps {
  orientation?: PanelOrientation
}

export default function PanelTemplate({
  html,
  slotMapping: _slotMapping,
  masterData: _masterData,
  pageIndex: _pageIndex,
  orientation = 'LANDSCAPE',
}: PanelTemplateProps) {
  return <DocumentFrame html={html} mode="PANEL" orientation={orientation} />
}