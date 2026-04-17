import React from 'react';
import { Page } from '../../types';
import { ImageBox } from '../../components/Common/ImageBox';
import { EditableText } from '../../components/Common/EditableText';
import { GridMaster } from '../../components/Common/GridMaster';
import { useEffect, useRef } from 'react';
import { getFitMode } from '../../utils/imageUtils';
import { getBlockData } from '../../utils/templateUtils';

// Layout 0: Cover Page
const ReportCover = ({ 
  page, onUpdateBlock, onTextClick
}: {
  page: Page,
  onUpdateBlock: (id: string, content: string | null) => void,
  onTextClick?: (rect: DOMRect, blockId: string, style: React.CSSProperties) => void
}) => {
  const getBlock = (id: string, def: string = '') => getBlockData(page, id, def);

  return (
    <div className="page cover">
      <GridMaster />
      <EditableText 
        id="keywords"
        className="editable" 
        style={{ textAlign: 'center', fontSize: '12pt', height: '20mm', ...getBlock('keywords').style }}
        onTextClick={onTextClick}
        initialText={getBlock('keywords', 'KEYWORD / KEYWORD / KEYWORD / KEYWORD').content}
        onUpdate={(val) => onUpdateBlock('keywords', val)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--gap)' }}>
        <EditableText 
          id="main-title"
          className="editable autoscale"
          data-level="1" 
          style={{ fontSize: '72pt', fontWeight: 800, width: '350mm', height: '100mm', textAlign: 'center', ...getBlock('main-title').style }}
          onTextClick={onTextClick}
          initialText={getBlock('main-title', 'Main Project Title').content}
          onUpdate={(val) => onUpdateBlock('main-title', val)}
        />
        <EditableText 
          id="sub-title"
          className="editable autoscale"
          data-level="2" 
          style={{ fontSize: '28pt', textAlign: 'center', lineHeight: 1.4, width: '350mm', height: '40mm', ...getBlock('sub-title').style }}
          onTextClick={onTextClick}
          initialText={getBlock('sub-title', 'Subtitle Content Here<br>Location & Concept').content}
          onUpdate={(val) => onUpdateBlock('sub-title', val)}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', height: '20mm' }}>
        <EditableText 
          id="date"
          className="editable" 
          style={{ fontSize: '14pt', minWidth: '50mm', ...getBlock('date').style }}
          onTextClick={onTextClick}
          initialText={getBlock('date', '2026.03.30').content}
          onUpdate={(val) => onUpdateBlock('date', val)}
        />
        <EditableText 
          id="company"
          className="editable comp-name"
          style={getBlock('company').style}
          onTextClick={onTextClick}
          initialText={getBlock('company', 'COMPANY NAME').content}
          onUpdate={(val) => onUpdateBlock('company', val)}
        />
      </div>
    </div>
  );
};

// Layout 1: Contents Page
const ReportContents = ({ 
  page, onUpdateBlock, onTextClick
}: { 
  page: Page, 
  onUpdateBlock: (id: string, content: string | null) => void, 
  onTextClick?: (rect: DOMRect, blockId: string, style: React.CSSProperties) => void
}) => {
  const getBlock = (id: string, def: string = '') => getBlockData(page, id, def);

  return (
    <div className="page contents">
      <GridMaster />
      <div className="inner-header">
        <EditableText 
          id="contents-title"
          className="editable main-title autoscale" 
          data-level="1"
          style={{ fontSize: '60pt', height: '60mm', width: '300mm', ...getBlock('contents-title').style }}
          onTextClick={onTextClick}
          initialText={getBlock('contents-title', 'CONTENTS').content}
          onUpdate={(val) => onUpdateBlock('contents-title', val)}
        />
        <EditableText 
          id="company"
          className="editable comp-name"
          style={getBlock('company').style}
          onTextClick={onTextClick}
          initialText={getBlock('company', 'COMPANY NAME').content}
          onUpdate={(val) => onUpdateBlock('company', val)}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 60mm)', gap: '20mm 15mm', flexGrow: 1, alignContent: 'end' }}>
        {(() => {
          const existingIndices = [1, 2, 3, 4, 5, 6].filter(i => getBlock(`chapter-${i}-title`).content !== "");
          const displayIndices = existingIndices.length > 0 ? existingIndices : [1, 2, 3];
          const total = displayIndices.length;

          const slotMap: Record<number, number[]> = {
            1: [4],
            2: [4, 5],
            3: [4, 5, 6],
            4: [1, 2, 4, 5],
            5: [1, 2, 4, 5, 6],
            6: [1, 2, 3, 4, 5, 6]
          };

          const targetSlots = slotMap[total] || [1, 2, 3, 4, 5, 6];

          return displayIndices.map((i, orderIdx) => {
            const slot = targetSlots[orderIdx];
            const row = Math.ceil(slot / 3);
            const col = (slot - 1) % 3 + 1;

            return (
              <div 
                key={i} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden', 
                  height: '60mm', 
                  justifyContent: 'flex-end',
                  gridRow: row,
                  gridColumn: col
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5mm', marginBottom: '3mm', flexWrap: 'nowrap' }}>
                  <EditableText 
                    id={`chapter-${i}-idx`}
                    className="editable autoscale" 
                    data-level="2"
                    style={{ fontSize: '44pt', fontWeight: 800, minWidth: '15mm', display: 'inline-block', whiteSpace: 'nowrap', ...getBlock(`chapter-${i}-idx`).style }}
                    onTextClick={onTextClick}
                    initialText={getBlock(`chapter-${i}-idx`, i < 10 ? `0${i}` : `${i}`).content}
                    onUpdate={(val) => onUpdateBlock(`chapter-${i}-idx`, val)}
                  />
                  <EditableText 
                    id={`chapter-${i}-title`}
                    className="editable autoscale" 
                    data-level="2"
                    style={{ fontSize: '28pt', fontWeight: 700, ...getBlock(`chapter-${i}-title`).style }}
                    onTextClick={onTextClick}
                    initialText={getBlock(`chapter-${i}-title`, `챕터 ${i} 제목`).content}
                    onUpdate={(val) => onUpdateBlock(`chapter-${i}-title`, val)}
                  />
                </div>
                <EditableText 
                  id={`chapter-${i}-desc`}
                  className="editable" 
                  style={{ fontSize: '20pt', color: '#666', paddingLeft: '20mm', lineHeight: 1.6, height: '18.6mm', ...getBlock(`chapter-${i}-desc`).style }}
                  onTextClick={onTextClick}
                  initialText={getBlock(`chapter-${i}-desc`, '').content}
                  onUpdate={(val) => onUpdateBlock(`chapter-${i}-desc`, val)}
                />
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};

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

const ReportStandard = ({ 
  page, onUpdateBlock, onImageClick, onTextClick, onSwapBlocks, columns,
  editingBlockId, zoom, onResize, onResetLayout, onEndEdit, onPushToHistory
}: any) => {
  const getBlock = (id: string, def: string = '') => getBlockData(page, id, def);
  
  const currentCols = page.layoutSettings?.columns || 
    (columns === 1 ? ['390mm'] : ['192.5mm', '192.5mm']);
  const currentRows = page.layoutSettings?.rows || ['1fr'];

  return (
    <div className="page report-standard">
      <GridMaster />
      <div className="inner-header">
        <EditableText id="main-title" className="autoscale" data-level="1" style={{ fontSize: '24pt', ...getBlock('main-title').style }} onTextClick={onTextClick} initialText={getBlock('main-title', 'Main Project Title').content} onUpdate={(val) => onUpdateBlock('main-title', val)} />
        <EditableText id="company" className="comp-name" style={getBlock('company').style} onTextClick={onTextClick} initialText={getBlock('company', 'COMPANY NAME').content} onUpdate={(val) => onUpdateBlock('company', val)} />
      </div>
      <div className="inner-sub-header">
        <EditableText id="page-title" className="sub-title-box autoscale" data-level="2" style={{ fontSize: '16pt', ...getBlock('page-title').style }} onTextClick={onTextClick} initialText={getBlock('page-title', 'Page Title Content').content} onUpdate={(val) => onUpdateBlock('page-title', val)} />
        <EditableText id="index-info" className="index-indicator autoscale" data-level="3" style={{ fontSize: '12pt', ...getBlock('index-info').style }} onTextClick={onTextClick} initialText={getBlock('index-info', '00. Chapter : Sub-Chapter').content} onUpdate={(val) => onUpdateBlock('index-info', val)} />
      </div>

      <EditableText id="page-desc" className="page-desc-area" style={{ fontSize: '11pt', ...getBlock('page-desc').style }} onTextClick={onTextClick} initialText={getBlock('page-desc', 'Full page description text goes here.').content} onUpdate={(val) => onUpdateBlock('page-desc', val)} />

      <div style={{ display: 'grid', gridTemplateColumns: currentCols.join(' '), gridTemplateRows: currentRows.join(' '), gap: 'var(--gap)', flexGrow: 1, overflow: editingBlockId ? 'visible' : 'hidden' }}>
        {Array.from({ length: columns }).map((_, i) => {
          const gridStyle = { gridColumn: `${i + 1}`, gridRow: '1' };
          return (
            <div key={i} style={{ ...gridStyle, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              <ImageBox
                id={`img-${i}`}
                onSwap={onSwapBlocks}
                initialImage={getBlock(`img-${i}`).content}
                onImageClick={onImageClick}
                onImageChange={(url) => onUpdateBlock(`img-${i}`, url || '')}
                fit={getBlock(`img-${i}`).fit || getFitMode(getBlock(`img-${i}`).content)}
                isEditing={editingBlockId === `img-${i}`}
                zoom={zoom}
                onResize={(...args) => onResize?.(args[0], args[1], args[2], args[3], currentCols, currentRows, parseGridPos(gridStyle))}
                onResetLayout={() => onResetLayout?.(page.id)}
                onEndEdit={onEndEdit}
                onFitChange={(fit) => {
                  onPushToHistory?.();
                  onUpdateBlock(`img-${i}`, getBlock(`img-${i}`).content, fit);
                }}
                onPushToHistory={onPushToHistory}
              />
              <EditableText id={`img-desc-${i}`} className="desc-vertical" style={{ fontSize: '11pt', ...getBlock(`img-desc-${i}`).style }} onTextClick={onTextClick} initialText={getBlock(`img-desc-${i}`, 'Image description text.').content} onUpdate={(val) => onUpdateBlock(`img-desc-${i}`, val)} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Layout 4: Mixed Page
const ReportMixed = ({ 
  page, onUpdateBlock, onImageClick, onTextClick, onSwapBlocks,
  editingBlockId, zoom, onResize, onResetLayout, onEndEdit, onPushToHistory
}: any) => {
  const getBlock = (id: string, def: string = '') => getBlockData(page, id, def);

  const currentCols = page.layoutSettings?.columns || ['240mm', '145mm'];
  const currentRows = page.layoutSettings?.rows || ['1fr', '1fr'];

  const renderImageBox = (id: string, style: React.CSSProperties = {}) => (
    <div style={{ ...style, position: 'relative' }}>
      <ImageBox
        id={id}
        onSwap={onSwapBlocks}
        initialImage={getBlock(id).content}
        onImageClick={onImageClick}
        onImageChange={(url) => onUpdateBlock(id, url || '')}
        fit={getBlock(id).fit || getFitMode(getBlock(id).content)}
        isEditing={editingBlockId === id}
        zoom={zoom}
        onResize={(...args) => onResize?.(args[0], args[1], args[2], args[3], currentCols, currentRows, parseGridPos(style))}
        onResetLayout={() => onResetLayout?.(page.id)}
        onEndEdit={onEndEdit}
        onFitChange={(fit) => {
          onPushToHistory?.();
          onUpdateBlock(id, getBlock(id).content, fit);
        }}
        onPushToHistory={onPushToHistory}
      />
    </div>
  );

  return (
    <div className="page report-mixed">
      <GridMaster />
      <div className="inner-header">
        <EditableText id="main-title" className="autoscale" data-level="1" style={{ fontSize: '24pt', ...getBlock('main-title').style }} onTextClick={onTextClick} initialText={getBlock('main-title', 'Main Project Title').content} onUpdate={(val) => onUpdateBlock('main-title', val)} />
        <EditableText id="company" className="comp-name" style={getBlock('company').style} onTextClick={onTextClick} initialText={getBlock('company', 'COMPANY NAME').content} onUpdate={(val) => onUpdateBlock('company', val)} />
      </div>
      <div className="inner-sub-header">
        <EditableText id="page-title" className="sub-title-box autoscale" data-level="2" style={{ fontSize: '16pt', ...getBlock('page-title').style }} onTextClick={onTextClick} initialText={getBlock('page-title', 'Page Title Content').content} onUpdate={(val) => onUpdateBlock('page-title', val)} />
        <EditableText id="index-info" className="index-indicator autoscale" data-level="3" style={{ fontSize: '12pt', ...getBlock('index-info').style }} onTextClick={onTextClick} initialText={getBlock('index-info', '00. Chapter : Sub-Chapter').content} onUpdate={(val) => onUpdateBlock('index-info', val)} />
      </div>

      <EditableText id="page-desc" className="page-desc-area" style={{ fontSize: '11pt', ...getBlock('page-desc').style }} onTextClick={onTextClick} initialText={getBlock('page-desc', 'Full page description text goes here.').content} onUpdate={(val) => onUpdateBlock('page-desc', val)} />

      <div style={{ display: 'grid', gridTemplateColumns: currentCols.join(' '), gridTemplateRows: currentRows.join(' '), gap: 'var(--gap)', flexGrow: 1, overflow: editingBlockId ? 'visible' : 'hidden' }}>
        <div style={{ gridColumn: '1', gridRow: '1 / 3', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {renderImageBox('img-left', { gridColumn: '1', gridRow: '1 / 3', flex: 1, display: 'flex', flexDirection: 'column' })}
          <EditableText id="img-desc-left" className="desc-vertical" style={{ fontSize: '11pt', ...getBlock('img-desc-left').style }} onTextClick={onTextClick} initialText={getBlock('img-desc-left', 'Image description.').content} onUpdate={(val) => onUpdateBlock('img-desc-left', val)} />
        </div>
        {[0, 1].map(i => (
          <div key={i} style={{ gridColumn: '2', gridRow: `${i + 1}`, display: 'flex', gap: 'var(--gap)', overflow: editingBlockId ? 'visible' : 'hidden' }}>
            {renderImageBox(`img-right-${i}`, { gridColumn: '2', gridRow: `${i + 1}`, flex: 1.36 })}
            <EditableText id={`img-desc-right-${i}`} className="desc-horizontal" style={{ fontSize: '11pt', ...getBlock(`img-desc-right-${i}`).style }} onTextClick={onTextClick} initialText={getBlock(`img-desc-right-${i}`, 'Image description.').content} onUpdate={(val) => onUpdateBlock(`img-desc-right-${i}`, val)} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Layout 5: Grid Page
const ReportGrid = ({ 
  page, onUpdateBlock, onImageClick, onTextClick, onSwapBlocks,
  editingBlockId, zoom, onResize, onResetLayout, onEndEdit, onPushToHistory
}: any) => {
  const getBlock = (id: string, def: string = '') => getBlockData(page, id, def);

  const currentCols = page.layoutSettings?.columns || ['192.5mm', '192.5mm'];
  const currentRows = page.layoutSettings?.rows || ['1fr', '1fr'];

  const renderImageBox = (id: string, style: React.CSSProperties = {}) => (
    <div style={{ ...style, position: 'relative' }}>
      <ImageBox
        id={id}
        onSwap={onSwapBlocks}
        initialImage={getBlock(id).content}
        onImageChange={(url) => onUpdateBlock(id, url || '')}
        onImageClick={onImageClick}
        fit={getBlock(id).fit || getFitMode(getBlock(id).content)}
        isEditing={editingBlockId === id}
        zoom={zoom}
        onResize={(...args) => onResize?.(args[0], args[1], args[2], args[3], currentCols, currentRows, parseGridPos(style))}
        onResetLayout={() => onResetLayout?.(page.id)}
        onEndEdit={onEndEdit}
        onFitChange={(fit) => {
          onPushToHistory?.();
          onUpdateBlock(id, getBlock(id).content, fit);
        }}
        onPushToHistory={onPushToHistory}
      />
    </div>
  );

  return (
    <div className="page report-grid">
      <GridMaster />
      <div className="inner-header">
        <EditableText id="main-title" className="autoscale" data-level="1" style={{ fontSize: '24pt', ...getBlock('main-title').style }} onTextClick={onTextClick} initialText={getBlock('main-title', 'Main Project Title').content} onUpdate={(val) => onUpdateBlock('main-title', val)} />
        <EditableText id="company" className="comp-name" style={getBlock('company').style} onTextClick={onTextClick} initialText={getBlock('company', 'COMPANY NAME').content} onUpdate={(val) => onUpdateBlock('company', val)} />
      </div>
      <div className="inner-sub-header">
        <EditableText id="page-title" className="sub-title-box autoscale" data-level="2" style={{ fontSize: '16pt', ...getBlock('page-title').style }} onTextClick={onTextClick} initialText={getBlock('page-title', 'Page Title Content').content} onUpdate={(val) => onUpdateBlock('page-title', val)} />
        <EditableText id="index-info" className="index-indicator autoscale" data-level="3" style={{ fontSize: '12pt', ...getBlock('index-info').style }} onTextClick={onTextClick} initialText={getBlock('index-info', '00. Chapter : Sub-Chapter').content} onUpdate={(val) => onUpdateBlock('index-info', val)} />
      </div>

      <EditableText id="page-desc" className="page-desc-area" style={{ fontSize: '11pt', ...getBlock('page-desc').style }} onTextClick={onTextClick} initialText={getBlock('page-desc', 'Full page description text goes here.').content} onUpdate={(val) => onUpdateBlock('page-desc', val)} />

      <div style={{ display: 'grid', gridTemplateColumns: currentCols.join(' '), gridTemplateRows: currentRows.join(' '), gap: 'var(--gap)', flexGrow: 1, overflow: editingBlockId ? 'visible' : 'hidden' }}>
        {[0, 1, 2, 3].map(i => {
          const row = Math.floor(i / 2) + 1;
          const col = (i % 2) + 1;
          const style = { gridColumn: `${col}`, gridRow: `${row}` };
          return (
            <div key={i} style={{ ...style, display: 'flex', gap: 'var(--gap)', alignItems: 'stretch', overflow: editingBlockId ? 'visible' : 'hidden' }}>
              {renderImageBox(`img-grid-${i}`, { ...style, flex: 1.8 })}
              <EditableText id={`img-desc-grid-${i}`} className="desc-horizontal" style={{ fontSize: '11pt', ...getBlock(`img-desc-grid-${i}`).style }} onTextClick={onTextClick} initialText={getBlock(`img-desc-grid-${i}`, 'Image description.').content} onUpdate={(val) => onUpdateBlock(`img-desc-grid-${i}`, val)} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ReportTemplate = ({ 
  page, 
  onUpdateBlock, 
  onImageClick,
  onTextClick,
  onSwapBlocks,
  editingBlockId,
  zoom,
  onUpdateLayout,
  onResize,
  onResetLayout,
  onEndEdit,
  onPushToHistory
}: { 
  page: Page, 
  onUpdateBlock: (id: string, content: string | null, fit?: 'cover' | 'contain') => void,
  onImageClick?: (rect: DOMRect, blockId: string, content: string | null, onImageChange: (url: string | null) => void) => void,
  onTextClick?: (rect: DOMRect, blockId: string, style: React.CSSProperties) => void,
  onSwapBlocks?: (from: string, to: string) => void,
  editingBlockId?: string | null,
  zoom?: number,
  onUpdateLayout?: (pageId: string, settings: { columns?: string[], rows?: string[] }) => void,
  onResize?: (id: string, dx: number, dy: number, dir: string, cols: string[], rows: string[], pos: any) => void,
  onResetLayout?: (pageId: string) => void,
  onEndEdit?: () => void,
  onPushToHistory?: () => void,
  isVideoProcessing?: boolean,
  videoProgress?: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutIdx = page.reportLayoutIdx || 0;

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
          let fontSizePx = parseFloat(window.getComputedStyle(el).fontSize);
          ptSize = Math.floor(fontSizePx * 0.75);
        }

        if (level > 1 && fittedSizes[level - 1]) {
          const maxChildSize = Math.floor(fittedSizes[level - 1] * 0.85);
          if (ptSize > maxChildSize) {
            ptSize = maxChildSize;
            el.style.fontSize = ptSize + 'pt';
          }
        }
        
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
  }, [layoutIdx, page.id]);

  return (
    <div className="report-template-container w-full h-full" ref={containerRef}>
      {(() => {
        const props = { 
          page, onUpdateBlock, onImageClick, onTextClick, onSwapBlocks, 
          editingBlockId, zoom, onResize, onResetLayout, onEndEdit, onPushToHistory 
        };
        switch (layoutIdx) {
          case 0: return <ReportCover {...props} />;
          case 1: return <ReportContents {...props} />;
          case 2: return <ReportStandard {...props} columns={1} />;
          case 3: return <ReportStandard {...props} columns={2} />;
          case 4: return <ReportMixed {...props} />;
          case 5: return <ReportGrid {...props} />;
          default: return <ReportCover {...props} />;
        }
      })()}
    </div>
  );
};
