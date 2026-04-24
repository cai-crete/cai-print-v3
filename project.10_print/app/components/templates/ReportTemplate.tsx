'use client'

/**
 * ReportTemplate.tsx — REPORT 모드 렌더러
 * DocumentFrame을 통해 A3 Landscape(420×297mm) 기준으로 스케일링하여 표시한다.
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import React from 'react'
import type { DocumentTemplateProps } from '../../../lib/types'
import DocumentFrame from './DocumentFrame'

export default function ReportTemplate({
  html,
  slotMapping: _slotMapping,
  masterData: _masterData,
  pageIndex: _pageIndex,
}: DocumentTemplateProps) {
  return <DocumentFrame html={html} mode="REPORT" />
}