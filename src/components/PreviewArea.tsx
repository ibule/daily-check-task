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
    <div className="preview-area h-full flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4">
      {needsTruncation && !showFullPreview && (
        <div className="preview-hint mb-4 flex items-center justify-between rounded-lg border border-[#222] bg-[#141414] px-4 py-2.5 text-xs text-[#666]">
          <span>仅预览前 {PREVIEW_LIMIT} 天，打印将包含全部 {dayCount} 天</span>
          <button
            type="button"
            onClick={() => setShowFullPreview(true)}
            className="text-[#5b6cf8] hover:text-[#8b95ff] transition-colors"
          >
            展开全部 →
          </button>
        </div>
      )}
      {showFullPreview && needsTruncation && (
        <div className="preview-hint mb-4 flex items-center justify-between rounded-lg border border-[#222] bg-[#141414] px-4 py-2.5 text-xs text-[#666]">
          <span>预览全部 {dayCount} 天</span>
          <button
            type="button"
            onClick={() => setShowFullPreview(false)}
            className="text-[#5b6cf8] hover:text-[#8b95ff] transition-colors"
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
              <div className="preview-hint no-print mb-2">
                <span className="page-badge">第 {pageIdx + 1} 页</span>
              </div>

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

              {pageIdx < pages.length - 1 && (
                <div className="page-break">
                  <div className="no-print my-5 border-t border-[#1e1e1e]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dayCards.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
          <span className="text-3xl opacity-20">▦</span>
          <span className="text-sm text-[#444]">请先完成配置</span>
        </div>
      )}
    </div>
  );
}
