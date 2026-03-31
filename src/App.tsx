import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { getDayCount } from './utils';
import ConfigPanel from './components/ConfigPanel';
import PreviewArea from './components/PreviewArea';
import CopyModal from './components/CopyModal';

type MobileStep = 'config' | 'preview';

export default function App() {
  const config = useStore((s) => s.config);
  const showCopyModal = useStore((s) => s.showCopyModal);
  const showFullPreview = useStore((s) => s.showFullPreview);
  const setShowFullPreview = useStore((s) => s.setShowFullPreview);

  const dayCount = getDayCount(config.startDate, config.endDate);
  const prevFullPreview = useRef(showFullPreview);
  const [showPdfHint, setShowPdfHint] = useState(false);
  const [mobileStep, setMobileStep] = useState<MobileStep>('config');

  // Keep mobile flow predictable when switching back to desktop
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncDesktopStep = () => {
      if (mediaQuery.matches) {
        setMobileStep('config');
      }
    };
    const handleScreenChange = () => syncDesktopStep();

    syncDesktopStep();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleScreenChange);
      return () => mediaQuery.removeEventListener('change', handleScreenChange);
    }

    mediaQuery.addListener(handleScreenChange);
    return () => mediaQuery.removeListener(handleScreenChange);
  }, []);

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
    <div className="min-h-screen md:h-screen flex flex-col overflow-hidden bg-amber-50">
      {/* Toolbar — warm orange gradient */}
      <header className="toolbar flex-shrink-0 bg-gradient-to-r from-orange-500 to-amber-400 shadow-md">
        <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-bold text-white text-base md:text-lg flex items-center gap-2 tracking-wide">
              🌟 每日打卡生成器
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2">
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

          <div className="no-print flex flex-col gap-2 md:hidden">
            <div className="flex items-center gap-2 text-xs text-white/90">
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  mobileStep === 'config' ? 'bg-white text-orange-500' : 'bg-white/20 text-white'
                }`}
              >
                1. 配置
              </span>
              <span className="opacity-70">→</span>
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  mobileStep === 'preview' ? 'bg-white text-orange-500' : 'bg-white/20 text-white'
                }`}
              >
                2. 预览
              </span>
            </div>

            {mobileStep === 'config' ? (
              <button
                onClick={() => setMobileStep('preview')}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-orange-500 shadow-sm transition-colors hover:bg-orange-50"
              >
                下一步：预览排版
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMobileStep('config')}
                  className="inline-flex items-center justify-center rounded-2xl bg-white/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
                >
                  ← 配置
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-sm font-medium text-orange-500 shadow-sm transition-colors hover:bg-orange-50"
                >
                  🖨️ 打印
                </button>
                <button
                  onClick={handleExportPdf}
                  className="inline-flex items-center justify-center rounded-2xl border border-white bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  📄 导出
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PDF hint bar */}
      {showPdfHint && (
        <div className="no-print flex flex-col gap-1 border-b border-orange-200 bg-orange-100 px-4 py-2 text-sm text-orange-800 sm:flex-row sm:items-center sm:gap-2">
          <span>💡 在打印对话框中，将打印机/目标选为 <strong>「另存为 PDF」</strong> 即可导出 PDF 文件</span>
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
        <div className="hidden md:block">
          <ConfigPanel />
        </div>
        <div className="hidden md:block md:flex-1 md:min-w-0">
          <PreviewArea />
        </div>

        <div className={`${mobileStep === 'config' ? 'block' : 'hidden'} flex-1 min-h-0 md:hidden`}>
          <ConfigPanel />
        </div>
        <div className={`${mobileStep === 'preview' ? 'block' : 'hidden'} flex-1 min-h-0 md:hidden`}>
          <PreviewArea />
        </div>
      </div>

      {/* Modals */}
      {showCopyModal && <CopyModal />}
    </div>
  );
}
