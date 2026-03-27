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
      <div className="bg-white rounded-xl shadow-xl w-96 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">⚙️ 设置</h3>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="text-gray-400 hover:text-gray-600 text-lg"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            DeepSeek API Key
          </label>
          <div className="flex gap-2">
            <input
              type={visible ? 'text' : 'password'}
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
              aria-label="DeepSeek API Key"
            />
            <button
              onClick={() => setVisible(!visible)}
              className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
              aria-label={visible ? '隐藏' : '显示'}
            >
              {visible ? '🙈' : '👁'}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            填写后 AI 生成将使用您自己的 Key，不消耗平台免费额度（每天 5 次）
          </p>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded hover:bg-red-50"
          >
            清除 Key
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setShowSettingsModal(false)}
            className="px-4 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            {saved ? '✓ 已保存' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
