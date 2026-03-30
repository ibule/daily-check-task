import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { getDayCount } from './utils';
import ConfigPanel from './components/ConfigPanel';
import PreviewArea from './components/PreviewArea';
import SettingsModal from './components/SettingsModal';
import CopyModal from './components/CopyModal';

export default function App() {
  const config = useStore((s) => s.config);
  const showSettingsModal = useStore((s) => s.showSettingsModal);
  const showCopyModal = useStore((s) => s.showCopyModal);
  const showFullPreview = useStore((s) => s.showFullPreview);
  const setShowSettingsModal = useStore((s) => s.setShowSettingsModal);
  const setShowFullPreview = useStore((s) => s.setShowFullPreview);

  const dayCount = getDayCount(config.startDate, config.endDate);
  const prevFullPreview = useRef(showFullPreview);
  const [showPdfHint, setShowPdfHint] = useState(false);

  // Inject @page size + printable row width/height dynamically based on orientation
  useEffect(() => {
    let el = document.getElementById('print-page-style') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'print-page-style';
      document.head.appendChild(el);
    }
    const isLandscape = config.pageOrientation === 'landscape';
    // A4 with 4mm left/right margins and 12mm top/bottom margins
    const printW = isLandscape ? '289mm' : '202mm';
    const printH = isLandscape ? '186mm' : '273mm';
    el.textContent = `
      @page { size: A4 ${config.pageOrientation}; }
      @media print {
        .day-row {
          max-width: ${printW};
          height: ${printH};
        }
        .day-card { height: 100%; }
      }
    `;
  }, [config.pageOrientation]);

  // Auto-expand all cards before print, restore after
  useEffect(() => {
    function onBeforePrint() {
      prevFullPreview.current = showFullPreview;
      setShowFullPreview(true);
    }
    function onAfterPrint() {
      setShowFullPreview(prevFullPreview.current);
      setShowPdfHint(false);
    }
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [showFullPreview, setShowFullPreview]);

  function handlePrint() {
    window.print();
  }

  function handleExportPdf() {
    setShowPdfHint(true);
    setTimeout(() => window.print(), 50);
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Toolbar — warm orange gradient */}
      <header className="toolbar flex items-center justify-between px-5 py-3 flex-shrink-0 bg-gradient-to-r from-orange-500 to-amber-400 shadow-md">
        <h1 className="font-bold text-white text-lg flex items-center gap-2 tracking-wide">
          🌟 每日打卡生成器
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="no-print px-3 py-1.5 text-sm bg-white/20 text-white rounded-full hover:bg-white/30 flex items-center gap-1.5 transition-colors"
            aria-label="设置"
          >
            ⚙️ 设置
          </button>
          <button
            onClick={handlePrint}
            className="no-print px-4 py-1.5 text-sm bg-white text-orange-500 font-medium rounded-full hover:bg-orange-50 flex items-center gap-1.5 transition-colors shadow-sm"
            aria-label="直接打印"
          >
            🖨️ 打印
          </button>
          <button
            onClick={handleExportPdf}
            className="no-print px-4 py-1.5 text-sm border-2 border-white text-white font-medium rounded-full hover:bg-white/10 flex items-center gap-1.5 transition-colors"
            aria-label="导出 PDF"
          >
            📄 导出 PDF
          </button>
        </div>
      </header>

      {/* PDF hint bar */}
      {showPdfHint && (
        <div className="no-print px-4 py-2 bg-orange-100 border-b border-orange-200 text-sm text-orange-800 flex items-center gap-2">
          💡 在打印对话框中，将打印机/目标选为 <strong>「另存为 PDF」</strong> 即可导出 PDF 文件
        </div>
      )}

      {/* Performance hint */}
      {dayCount > 90 && (
        <div className="no-print px-4 py-1.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
          共 {dayCount} 天，打印或导出时将自动渲染全部内容
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
