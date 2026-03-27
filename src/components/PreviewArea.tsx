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

  const n = config.columnsPerRow; // days per page (1, 2, or 3)
  const gridCols =
    n === 1 ? 'grid-cols-1' : n === 2 ? 'grid-cols-2' : 'grid-cols-3';

  // Group cards into pages of exactly N cards each
  const pages: typeof visibleCards[] = [];
  for (let i = 0; i < visibleCards.length; i += n) {
    pages.push(visibleCards.slice(i, i + n));
  }

  return (
    <div className="preview-area flex-1 overflow-auto bg-gray-50 p-4">
      {needsTruncation && !showFullPreview && (
        <div className="preview-hint mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 flex items-center justify-between">
          <span>仅预览前 {PREVIEW_LIMIT} 天，打印/导出将包含全部 {dayCount} 天</span>
          <button
            onClick={() => setShowFullPreview(true)}
            className="ml-2 text-indigo-600 hover:underline text-xs font-medium"
          >
            展开全部预览
          </button>
        </div>
      )}
      {showFullPreview && needsTruncation && (
        <div className="preview-hint mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex items-center justify-between">
          <span>正在预览全部 {dayCount} 天</span>
          <button
            onClick={() => setShowFullPreview(false)}
            className="ml-2 text-indigo-600 hover:underline text-xs font-medium"
          >
            收起
          </button>
        </div>
      )}

      <div className="space-y-2">
        {pages.map((pageCards, pageIdx) => (
          <div key={pageIdx}>
            {/* Page indicator in preview */}
            <div className="preview-hint text-xs text-gray-400 mb-1 no-print">
              第 {pageIdx + 1} 页
            </div>

            {/* One page = N cards side by side */}
            <div className={`grid ${gridCols} gap-3 day-row`}>
              {pageCards.map((card) => (
                <DayCardView key={card.isoDate} card={card} />
              ))}
            </div>

            {/* Page break after every page (except the last) */}
            {pageIdx < pages.length - 1 && (
              <div className="page-break">
                <div className="no-print border-t border-dashed border-gray-300 my-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {dayCards.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-400">
          请配置日期范围
        </div>
      )}
    </div>
  );
}
