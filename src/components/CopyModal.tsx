import { useState } from 'react';
import { Weekday, WEEKDAY_LABELS } from '../types';
import { useStore } from '../store';

export default function CopyModal() {
  const copyFromDay = useStore((s) => s.copyFromDay);
  const setShowCopyModal = useStore((s) => s.setShowCopyModal);
  const copyWeekdayTasksTo = useStore((s) => s.copyWeekdayTasksTo);
  const config = useStore((s) => s.config);

  const [selected, setSelected] = useState<Weekday[]>([]);

  const allWeekdays: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

  function toggle(day: Weekday) {
    setSelected((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleConfirm() {
    if (selected.length === 0) return;
    copyWeekdayTasksTo(selected);
    setSelected([]);
  }

  if (copyFromDay === null) return null;

  const fromLabel = WEEKDAY_LABELS[copyFromDay];
  const sourceTasks =
    config.taskConfig.mode === 'byWeekday'
      ? config.taskConfig.tasksByDay[copyFromDay]
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-80 p-5">
        <h3 className="font-semibold text-gray-800 mb-1">复制到其他天</h3>
        <p className="text-sm text-gray-500 mb-4">
          将 <strong>{fromLabel}</strong> 的 {sourceTasks.length} 条任务覆盖到：
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {allWeekdays.map((day) => {
            if (day === copyFromDay) return null;
            return (
              <button
                key={day}
                onClick={() => toggle(day)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selected.includes(day)
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCopyModal(false);
              setSelected([]);
            }}
            className="flex-1 py-2 text-sm rounded border border-gray-200 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="flex-1 py-2 text-sm rounded bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40"
          >
            确认覆盖
          </button>
        </div>
      </div>
    </div>
  );
}
