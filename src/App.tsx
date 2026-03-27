import { useStore } from './store';
import { getDayCount } from './utils';
import ConfigPanel from './components/ConfigPanel';
import PreviewArea from './components/PreviewArea';
import SettingsModal from './components/SettingsModal';
import CopyModal from './components/CopyModal';
import { exportToWord } from './wordExport';

export default function App() {
  const config = useStore((s) => s.config);
  const showSettingsModal = useStore((s) => s.showSettingsModal);
  const showCopyModal = useStore((s) => s.showCopyModal);
  const exportProgress = useStore((s) => s.exportProgress);
  const setShowSettingsModal = useStore((s) => s.setShowSettingsModal);
  const setExportProgress = useStore((s) => s.setExportProgress);

  const dayCount = getDayCount(config.startDate, config.endDate);

  function handlePrint() {
    window.print();
  }

  async function handleExportWord() {
    if (exportProgress !== null) return;
    setExportProgress(0);
    try {
      await exportToWord(config, (pct) => setExportProgress(pct));
    } catch (e) {
      console.error(e);
      alert('导出失败，请稍后重试');
    } finally {
      setExportProgress(null);
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Toolbar */}
      <header className="toolbar flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <h1 className="font-bold text-gray-800 flex items-center gap-2">
          📋 每日打卡生成器
        </h1>
        <div className="flex items-center gap-2">
          {exportProgress !== null && (
            <div className="flex items-center gap-2 mr-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{exportProgress}%</span>
            </div>
          )}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="no-print px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1.5"
            aria-label="设置"
          >
            ⚙️ 设置
          </button>
          <button
            onClick={handlePrint}
            className="no-print px-3 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-1.5"
            aria-label="直接打印"
          >
            🖨️ 打印
          </button>
          <button
            onClick={handleExportWord}
            disabled={exportProgress !== null}
            className="no-print px-3 py-1.5 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-60 flex items-center gap-1.5"
            aria-label="导出 Word 文档"
          >
            📄 导出 Word
          </button>
        </div>
      </header>

      {/* Performance hint */}
      {dayCount > 90 && (
        <div className="no-print px-4 py-1.5 bg-orange-50 border-b border-orange-100 text-xs text-orange-700">
          共 {dayCount} 天，预计导出可能需要几秒，请耐心等待
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <ConfigPanel />
        <PreviewArea />
      </div>

      {/* Modals */}
      {showSettingsModal && <SettingsModal />}
      {showCopyModal && <CopyModal />}
    </div>
  );
}
