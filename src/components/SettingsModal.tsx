import { useState } from 'react';
import { useStore } from '../store';

export default function SettingsModal() {
  const setShowSettingsModal = useStore((s) => s.setShowSettingsModal);
  const [keyValue, setKeyValue] = useState(
    () => localStorage.getItem('deepseek_api_key') ?? ''
  );
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (keyValue.trim()) {
      localStorage.setItem('deepseek_api_key', keyValue.trim());
    } else {
      localStorage.removeItem('deepseek_api_key');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleClear() {
    localStorage.removeItem('deepseek_api_key');
    setKeyValue('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-96 overflow-hidden">
        {/* Warm top bar */}
        <div className="bg-gradient-to-r from-orange-400 to-amber-400 px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">⚙️ 设置</h3>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="text-white/70 hover:text-white text-lg transition-colors"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              DeepSeek API Key
            </label>
            <div className="flex gap-2">
              <input
                type={visible ? 'text' : 'password'}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="sk-..."
                className="flex-1 px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                aria-label="DeepSeek API Key"
              />
              <button
                onClick={() => setVisible(!visible)}
                className="px-3 py-2 text-sm border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                aria-label={visible ? '隐藏' : '显示'}
              >
                {visible ? '🙈' : '👁'}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              填写后 AI 生成将使用您自己的 Key，不消耗平台免费额度（每天 5 次）
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              清除 Key
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-orange-400 hover:bg-orange-500 text-white rounded-lg transition-colors font-medium"
            >
              {saved ? '✓ 已保存' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
