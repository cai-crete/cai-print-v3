import React from 'react';
import { Page } from '../types';
import { ReportTemplate } from './Report/ReportTemplate';
import { PanelTemplate } from './Panel/PanelTemplate';
import { DrawingTemplate } from './Drawing/DrawingTemplate';
import { VideoTemplate } from './Video/VideoTemplate';
import { ImageTemplate } from './Image/ImageTemplate';

interface TemplateMasterProps {
  page: Page;
  onUpdateBlock: (blockId: string, content: string | null, fit?: 'cover' | 'contain') => void;
  onImageClick: (rect: DOMRect, blockId: string, content: string | null, onImageChange: (url: string | null) => void) => void;
  onTextClick?: (rect: DOMRect, blockId: string, style: React.CSSProperties) => void;
  onSwapBlocks?: (from: string, to: string) => void;
  onPushToHistory: () => void;
  isExporting: boolean;
  isThumbnail?: boolean;
  editingBlockId?: string | null;
  zoom?: number;
  onUpdateLayout?: (pageId: string, settings: { columns?: string[], rows?: string[] }) => void;
  onResize?: (
    blockId: string, 
    deltaX: number, 
    deltaY: number, 
    direction: string,
    currentCols: string[],
    currentRows: string[],
    gridPos?: { colStart: number, colEnd: number, rowStart: number, rowEnd: number }
  ) => void;
  onResetLayout?: (pageId: string) => void;
  onEndEdit?: () => void;
  isVideoProcessing?: boolean;
  videoProgress?: number;
}

export const TemplateMaster: React.FC<TemplateMasterProps> = React.memo((props) => {
  const { page, isThumbnail } = props;

  switch (page.type) {
    case 'REPORT':
      return (
        <div className="report-template">
          <ReportTemplate {...props} />
        </div>
      );
    case 'PANEL':
      return <PanelTemplate {...props} />;
    case 'DRAWING':
      return <DrawingTemplate {...props} />;
    case 'VIDEO':
      return <VideoTemplate {...props} isThumbnail={isThumbnail} />;
    case 'IMAGE':
      return <ImageTemplate {...props} />;
    default:
      return <PanelTemplate {...props} />;
  }
});
