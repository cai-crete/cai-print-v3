import type { ReactNode } from 'react';

export interface SelectedImage {
  id: string;
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  filename?: string;
}

export interface PrintSavedState {
  html: string;
  mode: 'REPORT' | 'PANEL' | 'DRAWING' | 'VIDEO';
  prompt?: string;
  savedAt: string; // ISO 8601
}

export interface PrintSaveResult {
  html: string;
  thumbnail: string;  // base64 PNG — html2canvas로 첫 페이지 캡처
  mode: 'REPORT' | 'PANEL' | 'DRAWING' | 'VIDEO';
  metadata: Record<string, unknown>; // masterData 그대로
}

export interface PrintToolbarTools {
  canUndo: boolean;
  onUndo: () => void;
  
  canRedo: boolean;
  onRedo: () => void;
  
  onOpenLibrary: () => void;
  onOpenSaves: () => void;
  onSave: () => Promise<void> | void;
  
  // 🟢 신규 추가 요청
  onNewProject: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset?: () => void;
  zoom: number;
}

export interface PrintExpandedViewProps {
  // Canvas에서 선택한 이미지들 → INSERT IMAGE에 자동 로드
  selectedImages?: SelectedImage[];

  // 이전에 저장된 문서 상태 → 편집 재개 시 복원
  savedState?: PrintSavedState;

  // 사이드바에서 시작된 액션 → 해당 기능으로 바로 진입
  initialAction?: 'generate' | 'library' | 'video' | null;

  // Canvas 프록시 경로 (standalone일 때는 '' 또는 생략)
  apiBaseUrl?: string;

  // 저장 완료 시 호출 → Canvas가 NodeCard 썸네일 + 상태 업데이트
  onSave?: (result: PrintSaveResult) => void;

  // 삭제 시 호출 → Canvas가 NodeCard 및 상태 삭제
  onDelete?: () => void;

  className?: string;

  // --- Canvas 연동용 Render Props (Slot 패턴) ---
  // Canvas 팀이 이 함수들을 주입하면 Print 자체 레이아웃 대신 Canvas의 껍데기 안에서 렌더링됩니다.
  renderToolbarWrapper?: (tools: PrintToolbarTools) => ReactNode;
  renderSidebarWrapper?: (printPanels: ReactNode) => ReactNode;
}

export interface PrintSidebarPanelProps {
  // 현재 저장된 문서 (없으면 신규 생성 상태)
  savedState?: PrintSavedState;
  thumbnail?: string; // base64 PNG

  // 사이드바 액션 → Canvas가 이 값으로 initialAction 설정 후 Expand
  onAction: (action: 'generate' | 'library' | 'video') => void;

  className?: string;
}
