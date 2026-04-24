import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    // 페이지 수 기반 동적 계산: (선택된 pageCount - excludePages) * maxPerPage
    REPORT: { min: 1, maxPerPage: 4, excludePages: 2 }, // 표지, 목차 2페이지 제외
    PANEL: { min: 1, maxPerPage: 7, excludePages: 0 },
    DRAWING: { min: 1, maxPerPage: 1, excludePages: 0 },
    // VIDEO는 총 2장 고정이자, 2개의 개별 슬롯으로 명확히 구분됨
    VIDEO: {
      min: 2,
      max: 2,
      slots: [
        { id: 'start_image', name: '시작 프레임', max: 1 },
        { id: 'end_image', name: '종료 프레임', max: 1 }
      ]
    },
  })
}
