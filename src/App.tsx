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
    <div className="print-root app-root min-h-screen md:h-screen flex flex-col overflow-hidden">
      {/* Toolbar */}
      <header className="toolbar app-toolbar flex-shrink-0">
        <div className="flex items-center justify-between px-5 h-12">
          {/* Logo */}
          <h1 className="text-lg font-bold text-[#ededed] tracking-tight">
            每日打卡生成器
          </h1>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <button type="button" onClick={handlePrint} className="no-print toolbar-btn" aria-label="打印">
              打印
            </button>
            <button type="button" onClick={handleExportPdf} className="no-print toolbar-btn accent" aria-label="导出 PDF">
              导出 PDF
            </button>
          </div>

          {/* Mobile step indicator + action */}
          <div className="no-print flex items-center gap-2 md:hidden">
            {mobileStep === 'config' ? (
              <button
                type="button"
                onClick={() => setMobileStep('preview')}
                className="toolbar-btn accent text-xs"
              >
                预览 →
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setMobileStep('config')} className="toolbar-btn text-xs">← 配置</button>
                <button type="button" onClick={handlePrint} className="toolbar-btn text-xs">打印</button>
                <button type="button" onClick={handleExportPdf} className="toolbar-btn accent text-xs">导出</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PDF hint */}
      {showPdfHint && (
        <div className="no-print flex items-center gap-2 px-5 py-2 text-xs border-b border-[#1f1f1f] bg-[#111] text-accent-soft">
          <span>在打印对话框中选择「另存为 PDF」即可导出</span>
        </div>
      )}

      {/* Performance hint */}
      {dayCount > 90 && (
        <div className="no-print flex items-center px-5 py-1.5 text-xs border-b border-[#1f1f1f] text-subtle">
          共 {dayCount} 天，打印时将自动渲染全部内容
        </div>
      )}

      {/* Main layout */}
      <div className="print-main flex flex-1 min-h-0 overflow-hidden">
        <div className="print-config hidden md:block md:h-full">
          <ConfigPanel />
        </div>
        <div className="print-preview hidden md:block md:h-full md:flex-1 md:min-w-0">
          <PreviewArea />
        </div>

        <div className={`no-print ${mobileStep === 'config' ? 'block' : 'hidden'} flex-1 min-h-0 md:hidden`}>
          <ConfigPanel />
        </div>
        <div className={`no-print ${mobileStep === 'preview' ? 'block' : 'hidden'} flex-1 min-h-0 md:hidden`}>
          <PreviewArea />
        </div>
      </div>

      {/* Footer */}
      <footer className="no-print flex-shrink-0 border-t border-[#2a2a2a] px-5 py-2.5 flex items-center justify-center gap-3 text-[11px] text-[#777]">
        <span>© Copyright 浩铭科技. All Rights Reserved.</span>
        <span className="text-[#444]">|</span>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#aaa] transition-colors"
        >
          粤ICP备2023084687号
        </a>
      </footer>

      {/* Modals */}
      {showCopyModal && <CopyModal />}
    </div>
  );
}
