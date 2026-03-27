import { useState } from 'react';
import { useStore } from '../store';
import { AI_STYLES, AIStyle } from '../types';
import { resolveGenerateCount, getDayCount } from '../utils';

const STYLE_PROMPTS: Record<AIStyle, string> = {
  gentle: '温柔亲切，像妈妈说话的语气，给孩子温暖感',
  lively: '活泼开朗，可以用叠词、拟声词，语气轻松有趣',
  positive: '积极向上，简洁有力，像运动员宣言',
  poetic: '文艺清新，句式优美，带有画面感',
  humorous: '轻松幽默，可以有小玩笑，让孩子看了想笑',
};

export default function AIPanel() {
  const config = useStore((s) => s.config);
  const aiStyle = useStore((s) => s.aiStyle);
  const aiLoading = useStore((s) => s.aiLoading);
  const aiRemainingCount = useStore((s) => s.aiRemainingCount);
  const setAIStyle = useStore((s) => s.setAIStyle);
  const setAILoading = useStore((s) => s.setAILoading);
  const setAIGeneratedLines = useStore((s) => s.setAIGeneratedLines);
  const setAIRemainingCount = useStore((s) => s.setAIRemainingCount);
  const confirmAILines = useStore((s) => s.confirmAILines);
  const setShowSettingsModal = useStore((s) => s.setShowSettingsModal);
  const setShowAIPanel = useStore((s) => s.setShowAIPanel);

  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState('');
  const [editingLines, setEditingLines] = useState<string[]>([]);

  const dayCount = getDayCount(config.startDate, config.endDate);
  const genCount = resolveGenerateCount(dayCount);

  async function callAI() {
    const name = config.name || '小朋友';
    const userKey = localStorage.getItem('deepseek_api_key');

    setAILoading(true);
    try {
      let lines: string[];

      if (userKey) {
        // Direct call with user's key
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            temperature: 0.9,
            messages: [
              {
                role: 'system',
                content:
                  '你是一个专门为孩子生成打卡鼓励语的助手。只输出鼓励语列表，每条独占一行，不要编号，不要引号，不要任何其他内容。',
              },
              {
                role: 'user',
                content: `请为名叫「${name}」的孩子生成 ${genCount} 条每日打卡鼓励语。\n风格要求：${STYLE_PROMPTS[aiStyle as AIStyle]}\n要求：每条不超过 20 字，语气亲切自然，每条独立一行。`,
              },
            ],
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
          if (res.status === 401) {
            throw Object.assign(new Error('API Key 无效，请检查设置'), { code: 'invalid_key' });
          }
          throw new Error(`DeepSeek 错误 ${res.status}`);
        }
        const data = await res.json();
        lines = (data.choices[0].message.content as string)
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean);
      } else {
        // Platform proxy
        const res = await fetch('/api/generate-encouragement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, count: genCount, style: aiStyle }),
          signal: AbortSignal.timeout(20000),
        });
        const data = await res.json();
        if (!data.success) {
          const err = Object.assign(new Error(data.message), { code: data.error });
          throw err;
        }
        lines = data.lines;
        if (data.remaining !== undefined) setAIRemainingCount(data.remaining);
      }

      setAIGeneratedLines(lines);
      setEditingLines(lines);
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

  async function regenLine(index: number) {
    // Simple single line regen: re-call and replace
    const name = config.name || '小朋友';
    const userKey = localStorage.getItem('deepseek_api_key');
    try {
      let newLine = '';
      if (userKey) {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${userKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'deepseek-chat',
            temperature: 1.0,
            messages: [
              { role: 'system', content: '你是一个专门为孩子生成打卡鼓励语的助手。只输出1条鼓励语，不要编号不要引号。' },
              { role: 'user', content: `请为名叫「${name}」的孩子生成1条每日打卡鼓励语。风格：${STYLE_PROMPTS[aiStyle as AIStyle]}，不超过20字。` },
            ],
          }),
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        newLine = (data.choices[0].message.content as string).trim();
      } else {
        const res = await fetch('/api/generate-encouragement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, count: 1, style: aiStyle }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await res.json();
        if (data.success && data.lines[0]) newLine = data.lines[0];
      }
      if (newLine) {
        const updated = [...editingLines];
        updated[index] = newLine;
        setEditingLines(updated);
        setAIGeneratedLines(updated);
      }
    } catch {
      // ignore single regen errors silently
    }
  }

  return (
    <div className="mt-3 border border-indigo-100 rounded-lg bg-indigo-50 p-3 space-y-3">
      {/* Style picker */}
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
            `生成 ${genCount} 条`
          )}
        </button>
        {aiRemainingCount !== null && (
          <span className="text-xs text-gray-500">今日平台剩余 {aiRemainingCount} 次</span>
        )}
      </div>

      {/* Generated lines */}
      {editingLines.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-600 font-medium">生成结果（可编辑）：</p>
          {editingLines.map((line, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                type="text"
                value={line}
                onChange={(e) => {
                  const updated = [...editingLines];
                  updated[i] = e.target.value;
                  setEditingLines(updated);
                  setAIGeneratedLines(updated);
                }}
                className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded bg-white"
              />
              <button
                onClick={() => regenLine(i)}
                className="text-xs text-gray-400 hover:text-indigo-500"
                aria-label="单条重新生成"
                title="重新生成"
              >
                🔄
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              onClick={confirmAILines}
              className="flex-1 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              使用这批鼓励语
            </button>
            <button
              onClick={() => {
                setAIGeneratedLines([]);
                setEditingLines([]);
                setShowAIPanel(false);
              }}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Rate limit dialog */}
      {showRateLimitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-80 p-5">
            <h3 className="font-semibold text-gray-800 mb-2">免费次数已用完</h3>
            <p className="text-sm text-gray-600 mb-4">{rateLimitMsg}</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowRateLimitDialog(false);
                  setShowSettingsModal(true);
                }}
                className="block w-full py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                填写自己的 DeepSeek Key
              </button>
              <button
                onClick={() => setShowRateLimitDialog(false)}
                className="block w-full py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
              >
                手动输入鼓励语
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
