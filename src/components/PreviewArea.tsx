import { useMemo } from 'react';
import { useStore } from '../store';
import { buildDayCards, getDayCount } from '../utils';
import DayCardView from './DayCardView';

const PREVIEW_LIMIT = 30;

export default function PreviewArea() {
  const config = useStore((s) => s.config);
  const showFullPreview = useStore((s) => s.showFullPreview);
  const setShowFullPreview = useStore((s) => s.setShowFullPreview);

  const dayCards = useMemo(() => buildDayCards(config), [config]);
  const dayCount = getDayCount(config.startDate, config.endDate);
  const needsTruncation = dayCount > PREVIEW_LIMIT;
  const visibleCards = showFullPreview ? dayCards : dayCards.slice(0, PREVIEW_LIMIT);
  const maxTaskCount = useMemo(
    () => dayCards.reduce((max, card) => Math.max(max, card.tasks.length), 0),
    [dayCards]
  );

  const n = config.columnsPerRow;

  const pages: typeof visibleCards[] = [];
  for (let i = 0; i < visibleCards.length; i += n) {
    pages.push(visibleCards.slice(i, i + n));
  }

  return (
    <div className="preview-area flex-1 overflow-auto bg-amber-50 p-4">
      {needsTruncation && !showFullPreview && (
        <div className="preview-hint mb-3 px-4 py-2.5 bg-orange-100 border border-orange-200 rounded-xl text-sm text-orange-800 flex items-center justify-between">
          <span>🔍 仅预览前 {PREVIEW_LIMIT} 天，打印/导出将包含全部 {dayCount} 天</span>
          <button
            onClick={() => setShowFullPreview(true)}
            className="ml-2 text-orange-600 hover:text-orange-700 hover:underline text-xs font-medium"
          >
            展开全部预览 →
          </button>
        </div>
      )}
      {showFullPreview && needsTruncation && (
        <div className="preview-hint mb-3 px-4 py-2.5 bg-amber-100 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center justify-between">
          <span>📋 正在预览全部 {dayCount} 天</span>
          <button
            onClick={() => setShowFullPreview(false)}
            className="ml-2 text-orange-600 hover:text-orange-700 hover:underline text-xs font-medium"
          >
            收起
          </button>
        </div>
      )}

      <div className="space-y-2 print-pages">
        {pages.map((pageCards, pageIdx) => {
          const pageColCount = Math.max(pageCards.length, 1);
          const gridCols =
            pageColCount === 1
              ? 'grid-cols-1'
              : pageColCount === 2
                ? 'grid-cols-2'
                : 'grid-cols-3';
          const dayRowClass = pageColCount === 2 ? 'day-row day-row-2col' : 'day-row';

          return (
            <div key={pageIdx}>
              {/* Page indicator — pill badge */}
              <div className="preview-hint no-print flex items-center gap-2 mb-2">
                <span className="inline-flex items-center bg-orange-100 text-orange-600 text-xs font-medium px-3 py-0.5 rounded-full">
                  第 {pageIdx + 1} 页
                </span>
              </div>

              {/* One page = N cards side by side */}
              <div className={`grid ${gridCols} gap-3 ${dayRowClass}`}>
                {pageCards.map((card) => (
                  <DayCardView
                    key={card.isoDate}
                    card={card}
                    columnsPerRow={config.columnsPerRow}
                    orientation={config.pageOrientation}
                    fixedTaskRows={Math.max(maxTaskCount, 1)}
                  />
                ))}
              </div>

              {/* Page break between pages (not after last) */}
              {pageIdx < pages.length - 1 && (
                <div className="page-break">
                  <div className="no-print border-t border-dashed border-orange-200 my-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dayCards.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-amber-400 gap-3">
          <span className="text-4xl">📅</span>
          <span className="text-sm">请先在左侧配置日期范围</span>
        </div>
      )}
    </div>
  );
}
