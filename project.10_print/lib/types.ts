/**
 * lib/types.ts — N10 print 노드 공유 TypeScript 타입 허브
 *
 * 모든 컴포넌트와 API Route가 공통으로 사용하는 타입을 중앙 정의한다.
 * PrintMode는 prompt.ts와 독립적으로 정의하여 클라이언트 컴포넌트에서
 * 안전하게 임포트할 수 있도록 한다.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

// ---------------------------------------------------------------------------
// 1. 핵심 모드 타입
// ---------------------------------------------------------------------------

/** N10 print 노드의 출력 문서 모드 — prompt.ts의 PrintMode와 동기화 유지 */
export type PrintMode = 'REPORT' | 'PANEL' | 'DRAWING' | 'VIDEO'

/** PANEL 모드 전용 용지 방향 */
export type PanelOrientation = 'LANDSCAPE' | 'PORTRAIT'

/** EXPORT 지원 포맷 */
export type ExportFormat = 'jpg' | 'png' | 'pdf' | 'mp4' | 'dxf'

// ---------------------------------------------------------------------------
// 2. API 요청 / 응답 타입
// ---------------------------------------------------------------------------

/** API Route가 반환하는 Protocol 실행 로그 */
export interface ExecutionLog {
  preStep: string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
}

/** `/api/print` 응답 전체 구조 (N10-print.md Output Contract) */
export interface PrintResult {
  executionLog: ExecutionLog
  /** 완성된 HTML 문서. REPORT / PANEL / DRAWING 모드에서 유효. */
  html: string
  /** 이미지 슬롯 ID ↔ 파일명 매핑 테이블 */
  slotMapping: Record<string, string>
  /** OCR로 확정된 마스터 데이터 (프로젝트명, 설계자, 스케일 등) */
  masterData: Record<string, unknown>
  /** VIDEO 모드에서만 유효. 생성된 MP4 스트림 URI. */
  videoUri?: string | null
}

// ---------------------------------------------------------------------------
// 3. 라이브러리 모달 타입
// ---------------------------------------------------------------------------

/** 이미지 카테고리 분류 (Hybrid Taxonomy) */
export type ImageCategory = 'A' | 'B' | 'C' | 'V'

/** 라이브러리 내 개별 이미지 항목 */
export interface LibraryImage {
  id: string
  name: string
  /** 브라우저에서 표시할 ObjectURL 또는 서버 경로 */
  url: string
  category: ImageCategory
  thumbnailUrl?: string
}

/** 라이브러리 폴더 구조
 *
 * 폴더 유형:
 *  - 프로젝트 타이틀명: AI 생성 시 자동 생성
 *  - 'FROM DEVICE': 사용자가 수동 업로드한 이미지
 */
export interface LibraryFolder {
  id: string
  /** 표시 이름 (프로젝트명 또는 'FROM DEVICE') */
  name: string
  images: LibraryImage[]
  createdAt: string
}

// ---------------------------------------------------------------------------
// 4. Undo / Redo 히스토리 타입
// ---------------------------------------------------------------------------

/** 편집 히스토리 단위 항목 */
export interface HistoryEntry {
  /** 해당 시점의 완성 HTML */
  html: string
  slotMapping: Record<string, string>
  masterData: Record<string, unknown>
  timestamp: number
}

// ---------------------------------------------------------------------------
// 6. 캔버스 뷰포트 상태
// ---------------------------------------------------------------------------

/** 무한 캔버스의 팬/줌 상태 (Stage 2 구현 예정) */
export interface CanvasViewport {
  /** 캔버스 X 오프셋 (px) */
  x: number
  /** 캔버스 Y 오프셋 (px) */
  y: number
  /** 줌 배율 (1.0 = 100%) */
  scale: number
}

// ---------------------------------------------------------------------------
// 7. 문서 템플릿 컴포넌트 공통 Props
// ---------------------------------------------------------------------------

/**
 * ReportTemplate / PanelTemplate / DrawingTemplate 공통 Props 인터페이스.
 * VideoTemplate은 별도 정의(videoUri 기반).
 */
export interface DocumentTemplateProps {
  /** API에서 받은 완성 HTML */
  html: string
  /** 슬롯 ID ↔ 이미지 파일명 매핑 */
  slotMapping: Record<string, string>
  /** OCR 확정 마스터 데이터 */
  masterData: Record<string, unknown>
  /** 현재 렌더링할 페이지 번호 (0-base) */
  pageIndex: number
  /** 뷰포트 스케일 배율 (기본값 1.0) — Stage 2 구현 */
  scale?: number
}

/** VIDEO 모드 전용 템플릿 Props */
export interface VideoTemplateProps {
  videoUri: string | null
  isLoading: boolean
}

// ---------------------------------------------------------------------------
// 8. 에이전트 오류 진단 타입
// ---------------------------------------------------------------------------

/** `/api/print` 실패 시 반환되는 구조화 오류 정보 */
export interface AgentErrorInfo {
  /** 사용자 표시용 통합 메시지 */
  message: string
  /** 실패한 에이전트 식별자 */
  failedAgent: string
  /** 오류 유형 */
  errorType: string
  /** 실패 직전까지 완료된 단계의 로그 */
  partialLog: {
    preStep?: string
    step1?: string
    step2?: string
    step3?: string
    step4?: string
  }
}

// ---------------------------------------------------------------------------
// 9. 문서 물리 치수 상수 (CSS px @ 96 dpi)
// ---------------------------------------------------------------------------

export const MM = 3.7795275591 // 1 mm → CSS px (96 dpi 기준)

/** 모드별 문서 물리 치수 (CSS px) */
export const DOC_SIZE: Record<string, { w: number; h: number }> = {
  REPORT:          { w: Math.round(420 * MM),  h: Math.round(297 * MM) },   // 1587 × 1122
  DRAWING:         { w: Math.round(420 * MM),  h: Math.round(297 * MM) },   // 1587 × 1122
  PANEL_LANDSCAPE: { w: Math.round(1189 * MM), h: Math.round(841 * MM) },   // 4494 × 3179
  PANEL_PORTRAIT:  { w: Math.round(841 * MM),  h: Math.round(1189 * MM) },  // 3179 × 4494
  VIDEO:           { w: 1280, h: 720 },
}

/** DOC_SIZE 키 결정 헬퍼 */
export function docSizeKey(mode: PrintMode, orientation?: PanelOrientation): string {
  if (mode === 'PANEL') {
    return orientation === 'PORTRAIT' ? 'PANEL_PORTRAIT' : 'PANEL_LANDSCAPE'
  }
  return mode
}

// ---------------------------------------------------------------------------
// 10. 앱 전역 상태 인터페이스 (page.tsx 상태 설계 기준)
// ---------------------------------------------------------------------------

/**
 * PrintAppState — page.tsx가 보유하는 전체 상태의 형태.
 * Context 도입 전까지는 page.tsx에서 직접 관리하고 props로 전달한다.
 */
export interface PrintAppState {
  /* 모드 */
  mode: PrintMode
  orientation: PanelOrientation  // PANEL 전용

  /* 이미지 입력 */
  images: File[]                // REPORT / PANEL / DRAWING
  videoStartImage: File | null  // VIDEO 전용
  videoEndImage: File | null    // VIDEO 전용

  /* 설정 */
  prompt: string
  pageCount: number

  /* 결과 */
  result: PrintResult | null
  currentPage: number           // 현재 보고 있는 페이지 (0-base)

  /* UI 상태 */
  isGenerating: boolean
  error: string | null
  isSidebarOpen: boolean
  isLibraryOpen: boolean

  /* 히스토리 */
  history: HistoryEntry[]
  historyIndex: number
}
