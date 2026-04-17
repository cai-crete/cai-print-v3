import React, { useRef, useEffect } from 'react';
import { Page } from '../../types';
import { EditableText } from '../../components/Common/EditableText';
import { ImageBox } from '../../components/Common/ImageBox';

interface DrawingTemplateProps {
  page: Page;
  onUpdateBlock: (id: string, content: string | null, fit?: 'cover' | 'contain') => void;
  onPushToHistory: () => void;
  onImageClick?: (rect: DOMRect, blockId: string, content: string | null, onImageChange: (url: string | null) => void) => void;
  onTextClick?: (rect: DOMRect, blockId: string, style: React.CSSProperties) => void;
  onSwapBlocks?: (from: string, to: string) => void;
  isExporting: boolean;
  editingBlockId?: string | null;
  zoom?: number;
  onResize?: (id: string, dx: number, dy: number, dir: string, cols: string[], rows: string[], pos: any) => void;
  onResetLayout?: (pageId: string) => void;
  onEndEdit?: () => void;
  isVideoProcessing?: boolean;
  videoProgress?: number;
}

export const DrawingTemplate: React.FC<DrawingTemplateProps> = ({ 
  page, 
  onUpdateBlock, 
  onPushToHistory, 
  onImageClick, 
  onTextClick,
  onSwapBlocks,
  isExporting,
  editingBlockId,
  zoom,
  onResize,
  onResetLayout,
  onEndEdit
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const applyAutoScaling = () => {
      if (!containerRef.current) return;
      const elements = Array.from(containerRef.current.querySelectorAll('.autoscale') as NodeListOf<HTMLElement>);
      elements.sort((a, b) => {
        const lvA = parseInt(a.getAttribute('data-level') || '99');
        const lvB = parseInt(b.getAttribute('data-level') || '99');
        return lvA - lvB;
      });

      const fittedSizes: Record<number, number> = {};

      elements.forEach(el => {
        const parent = el.parentElement;
        if (!parent) return;
        const level = parseInt(el.getAttribute('data-level') || '99');
        
        let ptSize = 0;
        const styleAttrib = el.getAttribute('style') || '';
        const match = styleAttrib.match(/font-size:\s*(\d+)pt/);
        if (match) {
          ptSize = parseInt(match[1]);
        } else {
          // Fallback to computed style if no inline pt size found (shouldn't happen with our new pattern)
          let fontSizePx = parseFloat(window.getComputedStyle(el).fontSize);
          ptSize = Math.floor(fontSizePx * 0.75);
        }

        if (level > 1 && fittedSizes[1]) {
          const maxChildSize = Math.floor(fittedSizes[1] * 0.75);
          if (ptSize > maxChildSize) {
            ptSize = maxChildSize;
            el.style.fontSize = ptSize + 'pt';
          }
        }
        
        while ((el.scrollWidth > parent.clientWidth || el.scrollHeight > parent.clientHeight) && ptSize > 6) {
          ptSize--;
          el.style.fontSize = ptSize + 'pt';
        }
        fittedSizes[level] = ptSize;
      });
    };

    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(applyAutoScaling, 50);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { subtree: true, characterData: true, childList: true });
    }
    applyAutoScaling();
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [page.id]);

  const getBlock = (id: string, defaultContent = '') => {
    return page.blocks.find(b => b.id === id) || { id, content: defaultContent, style: {}, fit: undefined as 'cover' | 'contain' | undefined };
  };

  const handleFitChange = (fit: 'cover' | 'contain') => {
    onPushToHistory();
    onUpdateBlock('img-01', getBlock('img-01').content, fit);
  };

  return (
    <div className="drawing-template" ref={containerRef}>
      <div className="page" style={{ width: '420mm', height: '297mm', padding: '7mm', flexShrink: 0, boxSizing: 'border-box', background: '#fff' }}>
        <div className="outer-frame" style={{ 
          display: 'grid', 
          gridTemplateColumns: page.layoutSettings?.columns?.join(' ') || '1fr 80mm',
          gridTemplateRows: '100%',
          height: '100%',
          width: '100%',
          border: '1px solid #000',
          boxSizing: 'border-box'
        }}>
          <div className="drawing-area" style={{ borderRight: '1px solid #000', position: 'relative', overflow: editingBlockId ? 'visible' : 'hidden' }}>
            {/* The cyan cross grid guides -> non-printing, using standard #00ffff */}
            <div className="axis-v"></div>
            <div className="axis-h"></div>

            <div className="w-full h-full relative" style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Single Image Box for the drawing */}
              <div className="w-full h-full p-[4px]">
                <ImageBox
                  id="img-01"
                  onSwap={onSwapBlocks}
                  initialImage={getBlock('img-01').content}
                  onImageChange={(url) => onUpdateBlock('img-01', url || '')}
                  onImageClick={onImageClick}
                  isExporting={isExporting}
                  fit={getBlock('img-01').fit || 'cover'}
                  isEditing={editingBlockId === 'img-01'}
                  onResetLayout={() => onResetLayout?.(page.id)}
                  onEndEdit={onEndEdit}
                  onFitChange={handleFitChange}
                  onPushToHistory={onPushToHistory}
                  zoom={zoom}
                />
              </div>
            </div>
          </div>

          <div className="title-block flex flex-col h-full bg-white relative box-border overflow-hidden">
            {/* 1. PROJECT TITLE */}
            <div className="tb-section flex flex-col box-border" style={{ height: '30mm', borderBottom: '1px solid #000', padding: '2mm 3mm' }}>
              <div className="tb-label">PROJECT TITLE</div>
              <EditableText id="proj-title" className="t-lv1 autoscale" data-level="1" style={{ fontSize: '16pt', fontWeight: 800, ...getBlock('proj-title').style }} onTextClick={onTextClick} initialText={getBlock('proj-title', 'AI ARCHITECTURE HUB 2026').content} onUpdate={(val) => onUpdateBlock('proj-title', val)} />
            </div>

            {/* 2. COMPANY */}
            <div className="tb-section flex flex-col box-border" style={{ height: '40mm', borderBottom: '1px solid #000', padding: '2mm 3mm' }}>
              <div className="tb-label">COMPANY</div>
              <EditableText id="comp-name" className="t-lv1 w-full autoscale" data-level="1" style={{ fontSize: '16pt', fontWeight: 800, marginBottom: '2mm', letterSpacing: '-1.5px', ...getBlock('comp-name').style }} onTextClick={onTextClick} initialText={getBlock('comp-name', 'company name').content} onUpdate={(val) => onUpdateBlock('comp-name', val)} />
              <EditableText id="comp-addr" className="t-lv2 w-full autoscale" data-level="2" style={{ fontSize: '10pt', marginTop: 'auto', ...getBlock('comp-addr').style }} onTextClick={onTextClick} initialText={getBlock('comp-addr', '회사 주소를 작성해 주세요.').content} onUpdate={(val) => onUpdateBlock('comp-addr', val)} />
            </div>

            {/* 3. NOTE - Flex 1 */}
            <div className="tb-section gap-1 flex flex-col box-border" style={{ flex: 1, borderBottom: '1px solid #000', padding: '2mm 3mm' }}>
              <div className="tb-label">NOTE</div>
              <EditableText id="note" className="t-lv2 autoscale" data-level="2" style={{ fontSize: '10pt', ...getBlock('note').style }} onTextClick={onTextClick} initialText={getBlock('note', '자유롭게 메모를 작성해 주세요.').content} onUpdate={(val) => onUpdateBlock('note', val)} />
            </div>

            {/* 4. META SECTIONS */}
            <div className="meta-section flex flex-col box-border" style={{ height: '17mm', borderBottom: '1px solid #000', padding: '2mm 3mm' }}>
              <div className="tb-label">DESIGNED BY</div>
              <EditableText id="designed-by" className="t-lv2 autoscale" data-level="2" style={{ fontSize: '10pt', ...getBlock('designed-by').style }} onTextClick={onTextClick} initialText={getBlock('designed-by', 'Your name').content} onUpdate={(val) => onUpdateBlock('designed-by', val)} />
            </div>
            <div className="meta-section flex flex-col box-border" style={{ height: '17mm', borderBottom: '1px solid #000', padding: '2mm 3mm' }}>
              <div className="tb-label">ARCHITECTURAL ENGINEER</div>
              <EditableText id="arch-eng" className="t-lv2 autoscale" data-level="2" style={{ fontSize: '10pt', ...getBlock('arch-eng').style }} onTextClick={onTextClick} initialText={getBlock('arch-eng', 'Your name').content} onUpdate={(val) => onUpdateBlock('arch-eng', val)} />
            </div>
            <div className="meta-section flex flex-col box-border" style={{ height: '17mm', borderBottom: '1px solid #000', padding: '2mm 3mm' }}>
              <div className="tb-label">APPROVED BY</div>
              <EditableText id="approved-by" className="t-lv2 autoscale" data-level="2" style={{ fontSize: '10pt', ...getBlock('approved-by').style }} onTextClick={onTextClick} initialText={getBlock('approved-by', 'Company name').content} onUpdate={(val) => onUpdateBlock('approved-by', val)} />
            </div>
            <div className="meta-section flex flex-col box-border" style={{ height: '17mm', borderBottom: '1px solid #000', padding: '2mm 3mm' }}>
              <div className="tb-label">SCALE</div>
              <EditableText id="scale" className="t-lv2 autoscale" data-level="2" style={{ fontSize: '10pt', ...getBlock('scale').style }} onTextClick={onTextClick} initialText={getBlock('scale', '').content} onUpdate={(val) => onUpdateBlock('scale', val)} />
            </div>
            <div className="meta-section flex flex-col box-border" style={{ height: '17mm', borderBottom: '1px solid #000', padding: '2mm 3mm' }}>
              <div className="tb-label">DRAWING NO.</div>
              <EditableText id="draw-no" className="t-lv2 autoscale" data-level="2" style={{ fontSize: '10pt', ...getBlock('draw-no').style }} onTextClick={onTextClick} initialText={getBlock('draw-no', '').content} onUpdate={(val) => onUpdateBlock('draw-no', val)} />
            </div>
            <div className="meta-section last flex flex-col box-border" style={{ height: '17mm', borderBottom: '1px solid #000', padding: '2mm 3mm' }}>
              <div className="tb-label">SHEET NO.</div>
              <EditableText id="sheet-no" className="t-lv2 autoscale" data-level="2" style={{ fontSize: '10pt', ...getBlock('sheet-no').style }} onTextClick={onTextClick} initialText={getBlock('sheet-no', '').content} onUpdate={(val) => onUpdateBlock('sheet-no', val)} />
            </div>
            <div className="tb-section flex flex-col box-border" style={{ height: '17mm', borderBottom: 'none', padding: '2mm 3mm' }}>
              <div className="tb-label">FILE NAME</div>
              <EditableText id="file-name" className="t-lv2 autoscale" data-level="2" style={{ fontSize: '10pt', ...getBlock('file-name').style }} onTextClick={onTextClick} initialText={getBlock('file-name', '').content} onUpdate={(val) => onUpdateBlock('file-name', val)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
