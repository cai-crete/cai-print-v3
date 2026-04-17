import React, { useEffect, useRef } from 'react';
import { Page } from '../../types';
import { ImageBox } from '../../components/Common/ImageBox';
import { EditableText } from '../../components/Common/EditableText';
import { getFitMode } from '../../utils/imageUtils';

interface PanelTemplateProps {
  page: Page;
  onUpdateBlock: (blockId: string, content: string | null, fit?: 'cover' | 'contain') => void;
  onImageClick: (rect: DOMRect, blockId: string, content: string | null, onImageChange: (url: string | null) => void) => void;
  onTextClick: (rect: DOMRect, blockId: string, style: React.CSSProperties) => void;
  onSwapBlocks: (from: string, to: string) => void;
  onPushToHistory: () => void;
  isExporting?: boolean;
  editingBlockId?: string | null;
  zoom?: number;
  onResize?: (id: string, dx: number, dy: number, dir: string, cols: string[], rows: string[], pos: any) => void;
  onResetLayout?: (pageId: string) => void;
  onEndEdit?: () => void;
  isVideoProcessing?: boolean;
  videoProgress?: number;
}

export const PanelTemplate: React.FC<PanelTemplateProps> = ({
  page,
  onUpdateBlock,
  onImageClick,
  onTextClick,
  onSwapBlocks,
  onPushToHistory,
  isExporting,
  editingBlockId,
  zoom = 1,
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
      
      // Sort by hierarchy level to ensure title sets the baseline for subtitle, etc.
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
        
        // Start from the user-defined/template-defined size in the style object
        // We'll read it from the element's style.fontSize set by React props
        let ptSize = 0;
        const styleAttrib = el.getAttribute('style') || '';
        const match = styleAttrib.match(/font-size:\s*(\d+)pt/);
        if (match) {
          ptSize = parseInt(match[1]);
        } else {
          let fontSizePx = parseFloat(window.getComputedStyle(el).fontSize);
          ptSize = Math.floor(fontSizePx * 0.75);
        }

        // 1. Hierarchy Check: Child level cannot exceed 85% of parent level's current font size
        if (level > 1) {
          const parentLevel = level - 1;
          if (fittedSizes[parentLevel]) {
            const maxChildSize = Math.floor(fittedSizes[parentLevel] * 0.85);
            if (ptSize > maxChildSize) {
              ptSize = maxChildSize;
              el.style.fontSize = ptSize + 'pt';
            }
          }
        }
        
        // 2. Overflow Check: Only shrink if it actually exceeds its container
        // This prioritizes filling the box (multi-line) before shrinking.
        while ((el.scrollWidth > parent.clientWidth || el.scrollHeight > parent.clientHeight) && ptSize > 8) {
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
  }, [page.orientation]);

  const getBlock = (id: string, def: string = '') => page.blocks.find(b => b.id === id) || { id, content: def, style: {}, fit: undefined as 'cover' | 'contain' | undefined };

  const isLandscape = page.orientation === 'LANDSCAPE';

  const defaultGridCols = isLandscape 
    ? ['373mm', '373mm', '181.5mm', '181.5mm'] 
    : ['192.5mm', '192.5mm', '192.5mm', '192.5mm'];

  const defaultGridRows = isLandscape
    ? ['75mm', '45mm', '130mm', '25mm', '195mm', '281mm']
    : ['75mm', '45mm', '74mm', '25mm', '115mm', '25mm', '115mm', '190mm', '395mm'];

  const currentCols = page.layoutSettings?.columns || defaultGridCols;
  const currentRows = page.layoutSettings?.rows || defaultGridRows;

  const parseGridPos = (style: React.CSSProperties) => {
    const parse = (val: any) => {
      if (!val) return { start: 1, end: 2 };
      const parts = String(val).split('/').map(s => parseInt(s.trim()));
      return { 
        start: parts[0] || 1, 
        end: parts[1] || (parts[0] ? parts[0] + 1 : 2) 
      };
    };
    const col = parse(style.gridColumn);
    const row = parse(style.gridRow);
    return { colStart: col.start, colEnd: col.end, rowStart: row.start, rowEnd: row.end };
  };

  const handleFitChange = (blockId: string, fit: 'cover' | 'contain') => {
    onPushToHistory();
    onUpdateBlock(blockId, getBlock(blockId).content, fit);
  };

  const paddingGuide = isLandscape 
    ? { t: '20mm', b: '20mm', l: '25mm', r: '25mm' } 
    : { t: '25mm', b: '25mm', l: '20mm', r: '20mm' };

  const renderImageBox = (id: string, style: React.CSSProperties = {}) => (
    <div style={style}>
      <ImageBox 
        id={id} 
        onSwap={onSwapBlocks} 
        initialImage={getBlock(id).content} 
        onImageChange={(url) => onUpdateBlock(id, url || '')} 
        onImageClick={onImageClick} 
        fit={getBlock(id).fit || getFitMode(getBlock(id).content)}
        isEditing={editingBlockId === id}
        zoom={zoom}
        onResize={(...args) => {
          const gridPos = parseGridPos(style);
          onResize?.(args[0], args[1], args[2], args[3], currentCols, currentRows, gridPos);
        }}
        onResetLayout={() => onResetLayout?.(page.id)}
        onEndEdit={onEndEdit}
        onFitChange={(fit) => handleFitChange(id, fit)}
        onPushToHistory={onPushToHistory}
        isExporting={isExporting}
      />
    </div>
  );

  return (
    <div className="panel-template" ref={containerRef}>
      <div className={`page ${isLandscape ? 'a0-landscape' : 'a0-portrait'}`}>
        <div className="panel-grid-master">
          <div className="g-line v" style={{ left: paddingGuide.l }}></div>
          <div className="g-line v" style={{ right: paddingGuide.r }}></div>
          <div className="g-line h" style={{ top: paddingGuide.t }}></div>
          <div className="g-line h" style={{ bottom: paddingGuide.b }}></div>
        </div>

        {isLandscape ? (
          <div className="grid-container" style={{ gridTemplateColumns: currentCols.join(' '), gridTemplateRows: currentRows.join(' '), overflow: editingBlockId ? 'visible' : 'hidden' }}>
            {renderImageBox('img-main', { gridColumn: '1 / 3', gridRow: '1 / 6' })}
            
            <div className="text-cell" style={{ gridColumn: '3 / 5', gridRow: '1' }}>
                <EditableText id="title" className="t-heavy autoscale" data-level="1" style={{ fontSize: '140pt', ...getBlock('title').style }} onTextClick={onTextClick} initialText={getBlock('title', 'THIS IS THE TITLE').content} onUpdate={(val) => onUpdateBlock('title', val)} />
            </div>
            <div className="text-cell" style={{ gridColumn: '3 / 5', gridRow: '2' }}>
                <EditableText id="subtitle" className="t-medium autoscale" data-level="2" style={{ fontSize: '90pt', color: '#555', ...getBlock('subtitle').style }} onTextClick={onTextClick} initialText={getBlock('subtitle', "There's a subtitle, too").content} onUpdate={(val) => onUpdateBlock('subtitle', val)} />
            </div>
            
            <div className="text-cell" style={{ gridColumn: '3 / 5', gridRow: '3' }}>
                <EditableText id="desc" className="t-light autoscale" data-level="4" style={{ fontSize: '30pt', ...getBlock('desc').style }} onTextClick={onTextClick} initialText={getBlock('desc', '이곳은 문서의 진정한 시작을 알리고, 건축이 품고 있는 본질적인 철학을 조명하는 프롤로그 영역입니다. 대지의 기억을 이해하는 것에서 출발했습니다.').content} onUpdate={(val) => onUpdateBlock('desc', val)} />
            </div>
            
            <div className="text-cell" style={{ gridColumn: '3 / 4', gridRow: '4' }}>
                <EditableText id="sub-a" className="t-medium autoscale" data-level="3" style={{ fontSize: '35pt', ...getBlock('sub-a').style }} onTextClick={onTextClick} initialText={getBlock('sub-a', '소제목을 적어주세요.').content} onUpdate={(val) => onUpdateBlock('sub-a', val)} />
            </div>
            <div className="text-cell" style={{ gridColumn: '4 / 5', gridRow: '4' }}>
                <EditableText id="sub-b" className="t-medium autoscale" data-level="3" style={{ fontSize: '35pt', ...getBlock('sub-b').style }} onTextClick={onTextClick} initialText={getBlock('sub-b', '소제목을 적어주세요.').content} onUpdate={(val) => onUpdateBlock('sub-b', val)} />
            </div>

            <div className="text-cell" style={{ gridColumn: '3 / 4', gridRow: '5' }}>
                <EditableText id="desc-a" className="t-light autoscale" data-level="4" style={{ fontSize: '19pt', ...getBlock('desc-a').style }} onTextClick={onTextClick} initialText={getBlock('desc-a', '공간의 시퀀스와 시선의 변화를 스토리텔링 방식으로 서술하여 프레젠테이션의 몰입도를 극대화합니다.').content} onUpdate={(val) => onUpdateBlock('desc-a', val)} />
            </div>
            <div className="text-cell" style={{ gridColumn: '4 / 5', gridRow: '5' }}>
                <EditableText id="desc-b" className="t-light autoscale" data-level="4" style={{ fontSize: '19pt', ...getBlock('desc-b').style }} onTextClick={onTextClick} initialText={getBlock('desc-b', '건축 문서의 전반적인 개요부터 세부적인 디자인 의도까지 심도 있는 내용을 담아내기 위한 공간입니다.').content} onUpdate={(val) => onUpdateBlock('desc-b', val)} />
            </div>

            {renderImageBox('detail-01', { gridColumn: '3', gridRow: '6' })}
            {renderImageBox('detail-02', { gridColumn: '4', gridRow: '6' })}
            {renderImageBox('detail-03', { gridColumn: '1', gridRow: '6' })}
            {renderImageBox('detail-04', { gridColumn: '2', gridRow: '6' })}
          </div>
        ) : (
          <div className="grid-container" style={{ gridTemplateColumns: currentCols.join(' '), gridTemplateRows: currentRows.join(' '), overflow: editingBlockId ? 'visible' : 'hidden' }}>
            <div className="text-cell" style={{ gridColumn: '1 / 5', gridRow: '1' }}>
                <EditableText id="title" className="t-heavy autoscale" data-level="1" style={{ fontSize: '140pt', ...getBlock('title').style }} onTextClick={onTextClick} initialText={getBlock('title', 'THIS IS THE TITLE').content} onUpdate={(val) => onUpdateBlock('title', val)} />
            </div>
            <div className="text-cell" style={{ gridColumn: '1 / 5', gridRow: '2' }}>
                <EditableText id="subtitle" className="t-medium autoscale" data-level="2" style={{ fontSize: '90pt', color: '#555', ...getBlock('subtitle').style }} onTextClick={onTextClick} initialText={getBlock('subtitle', "There's a subtitle, too").content} onUpdate={(val) => onUpdateBlock('subtitle', val)} />
            </div>
            
            <div className="text-cell" style={{ gridColumn: '1 / 5', gridRow: '3' }}>
                <EditableText id="desc" className="t-light autoscale" data-level="4" style={{ fontSize: '26pt', ...getBlock('desc').style }} onTextClick={onTextClick} initialText={getBlock('desc', '이곳은 문서의 진정한 시작을 알리고, 건축이 품고 있는 본질적인 철학을 조명하는 프롤로그 영역입니다. 단순히 물리적인 구조물을 세우는 것을 넘어 제안합니다.').content} onUpdate={(val) => onUpdateBlock('desc', val)} />
            </div>

            {renderImageBox('img-main', { gridColumn: '1 / 4', gridRow: '4 / 8' })}
            
            <div className="text-cell" style={{ gridColumn: '4', gridRow: '4' }}>
                <EditableText id="sub-a" className="t-medium autoscale" data-level="3" style={{ fontSize: '35pt', ...getBlock('sub-a').style }} onTextClick={onTextClick} initialText={getBlock('sub-a', '소제목 A').content} onUpdate={(val) => onUpdateBlock('sub-a', val)} />
            </div>
            <div className="text-cell" style={{ gridColumn: '4', gridRow: '5' }}>
               <EditableText id="desc-a" className="t-light autoscale" data-level="4" style={{ fontSize: '19pt', ...getBlock('desc-a').style }} onTextClick={onTextClick} initialText={getBlock('desc-a', '공간의 시퀀스와 시선의 변화를 서술하여 몰입도를 극대화합니다.').content} onUpdate={(val) => onUpdateBlock('desc-a', val)} />
            </div>
 
            <div className="text-cell" style={{ gridColumn: '4', gridRow: '6' }}>
                <EditableText id="sub-b" className="t-medium autoscale" data-level="3" style={{ fontSize: '35pt', ...getBlock('sub-b').style }} onTextClick={onTextClick} initialText={getBlock('sub-b', '소제목 B').content} onUpdate={(val) => onUpdateBlock('sub-b', val)} />
            </div>
            <div className="text-cell" style={{ gridColumn: '4', gridRow: '7' }}>
               <EditableText id="desc-b" className="t-light autoscale" data-level="4" style={{ fontSize: '19pt', ...getBlock('desc-b').style }} onTextClick={onTextClick} initialText={getBlock('desc-b', '디자인 의도와 기획 단계의 고민을 담아내기 위한 독립된 칸입니다.').content} onUpdate={(val) => onUpdateBlock('desc-b', val)} />
            </div>

            {renderImageBox('detail-01', { gridColumn: '1', gridRow: '8' })}
            {renderImageBox('detail-02', { gridColumn: '2', gridRow: '8' })}
            {renderImageBox('detail-03', { gridColumn: '3', gridRow: '8' })}
            {renderImageBox('detail-04', { gridColumn: '4', gridRow: '8' })}

            {renderImageBox('large-plan', { gridColumn: '1 / 3', gridRow: '9' })}
            {renderImageBox('large-diagram', { gridColumn: '3 / 5', gridRow: '9' })}
          </div>
        )}
      </div>
    </div>
  );
};
