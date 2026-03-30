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
    <div className="preview-area flex-1 overflow-auto bg-amber-50 p-3 md:p-4">
      {needsTruncation && !showFullPreview && (
        <div className="preview-hint mb-3 flex flex-col items-start gap-2 rounded-xl border border-orange-200 bg-orange-100 px-4 py-2.5 text-sm text-orange-800 sm:flex-row sm:items-center sm:justify-between">
          <span>🔍 仅预览前 {PREVIEW_LIMIT} 天，打印/导出将包含全部 {dayCount} 天</span>
          <button
            onClick={() => setShowFullPreview(true)}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
          >
            展开全部预览 →
          </button>
        </div>
      )}
      {showFullPreview && needsTruncation && (
        <div className="preview-hint mb-3 flex flex-col items-start gap-2 rounded-xl border border-amber-200 bg-amber-100 px-4 py-2.5 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span>📋 正在预览全部 {dayCount} 天</span>
          <button
            onClick={() => setShowFullPreview(false)}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
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
              <div className="preview-hint no-print mb-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-0.5 text-xs font-medium text-orange-600">
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
                  <div className="no-print my-4 border-t border-dashed border-orange-200" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dayCards.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-amber-400">
          <span className="text-4xl">📅</span>
          <span className="text-sm">请先完成配置，再预览排版效果</span>
        </div>
      )}
    </div>
  );
}
