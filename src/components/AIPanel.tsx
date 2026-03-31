import { useState } from 'react';
import { useStore } from '../store';
import { AI_STYLES, AIStyle } from '../types';
import { getDayCount } from '../utils';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const GENERATE_API_URL = `${API_BASE_URL}/api/generate-encouragement`;

export default function AIPanel() {
  const config = useStore((s) => s.config);
  const aiStyle = useStore((s) => s.aiStyle);
  const aiLoading = useStore((s) => s.aiLoading);
  const aiRemainingCount = useStore((s) => s.aiRemainingCount);
  const setAIStyle = useStore((s) => s.setAIStyle);
  const setAILoading = useStore((s) => s.setAILoading);
  const setAIRemainingCount = useStore((s) => s.setAIRemainingCount);
  const setEncouragements = useStore((s) => s.setEncouragements);
  const setShowAIPanel = useStore((s) => s.setShowAIPanel);

  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState('');

  const dayCount = Math.max(getDayCount(config.startDate, config.endDate), 1);

  async function callAI() {
    const name = config.name || '小朋友';

    setAILoading(true);
    try {
      const res = await fetch(GENERATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, count: dayCount, style: aiStyle }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      if (!data.success) {
        const err = Object.assign(new Error(data.message), { code: data.error });
        throw err;
      }
      const lines = data.lines;
      if (data.remaining !== undefined) setAIRemainingCount(data.remaining);

      setEncouragements(lines);
      setShowAIPanel(false);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string; name?: string };
      if (e.code === 'rate_limited' || e.code === 'global_limit') {
        setRateLimitMsg(e.message ?? '');
        setShowRateLimitDialog(true);
      } else if (e.name === 'TimeoutError') {
        alert('请求超时，请检查网络后重试');
      } else {
        alert(e.message ?? 'AI 生成失败，请稍后重试');
      }
    } finally {
      setAILoading(false);
    }
  }

  return (
    <div className="mt-3 border border-indigo-100 rounded-lg bg-indigo-50 p-3 space-y-3">
      <div>
        <p className="text-xs text-gray-600 mb-2 font-medium">选择风格：</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(AI_STYLES) as [AIStyle, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setAIStyle(key)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                aiStyle === key
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={callAI}
          disabled={aiLoading}
          className="px-4 py-1.5 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-60 flex items-center gap-1.5"
        >
          {aiLoading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              AI 生成中…
            </>
          ) : (
            `生成 ${dayCount} 条`
          )}
        </button>
        {aiRemainingCount !== null && (
          <span className="text-xs text-gray-500">今日平台剩余 {aiRemainingCount} 次</span>
        )}
      </div>

      <p className="text-xs text-gray-500">
        将按当前日期范围一次性生成 {dayCount} 条鼓励语，并直接覆盖下方多行内容。
      </p>

      {showRateLimitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-80 p-5">
            <h3 className="font-semibold text-gray-800 mb-2">免费次数已用完</h3>
            <p className="text-sm text-gray-600 mb-4">{rateLimitMsg}</p>
            <div className="space-y-2">
              <button
                onClick={() => setShowRateLimitDialog(false)}
                className="block w-full py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
              >
                手动粘贴鼓励语
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
