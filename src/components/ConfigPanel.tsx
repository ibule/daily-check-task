import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';
import { useStore } from '../store';
import { Weekday, WEEKDAY_LABELS } from '../types';
import { getDayCount, getQuickDateRanges, estimatePages } from '../utils';
import TaskList from './TaskList';
import AIPanel from './AIPanel';

const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

function AccordionSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 font-medium text-sm text-gray-700"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-3 space-y-3">{children}</div>}
    </div>
  );
}

export default function ConfigPanel() {
  const config = useStore((s) => s.config);
  const setName = useStore((s) => s.setName);
  const setStartDate = useStore((s) => s.setStartDate);
  const setEndDate = useStore((s) => s.setEndDate);
  const setTaskMode = useStore((s) => s.setTaskMode);
  const setUnifiedTasks = useStore((s) => s.setUnifiedTasks);
  const setWeekdayTasks = useStore((s) => s.setWeekdayTasks);
  const addUnifiedTask = useStore((s) => s.addUnifiedTask);
  const removeUnifiedTask = useStore((s) => s.removeUnifiedTask);
  const addWeekdayTask = useStore((s) => s.addWeekdayTask);
  const removeWeekdayTask = useStore((s) => s.removeWeekdayTask);
  const addEncouragement = useStore((s) => s.addEncouragement);
  const removeEncouragement = useStore((s) => s.removeEncouragement);
  const updateEncouragement = useStore((s) => s.updateEncouragement);
  const setColumnsPerRow = useStore((s) => s.setColumnsPerRow);
  const setPageOrientation = useStore((s) => s.setPageOrientation);
  const showAIPanel = useStore((s) => s.showAIPanel);
  const setShowAIPanel = useStore((s) => s.setShowAIPanel);
  const setCopyFromDay = useStore((s) => s.setCopyFromDay);
  const setShowCopyModal = useStore((s) => s.setShowCopyModal);
  const applyTemplate = useStore((s) => s.applyTemplate);
  const applyWeekdayTemplate = useStore((s) => s.applyWeekdayTemplate);
  const aiRemainingCount = useStore((s) => s.aiRemainingCount);

  const [activeWeekday, setActiveWeekday] = useState<Weekday>(1);
  const [newEncouragement, setNewEncouragement] = useState('');

  const dayCount = getDayCount(config.startDate, config.endDate);
  const estPages = estimatePages(dayCount, config.columnsPerRow);
  const quickRanges = getQuickDateRanges();

  const maxDate = dayjs(config.startDate).add(364, 'day').toDate();

  function handleStartDateChange(date: Date | null) {
    if (!date) return;
    const iso = dayjs(date).format('YYYY-MM-DD');
    setStartDate(iso);
    // Clamp end date if needed
    const newMax = dayjs(iso).add(364, 'day');
    if (dayjs(config.endDate).isAfter(newMax)) {
      setEndDate(newMax.format('YYYY-MM-DD'));
    }
  }

  function handleEndDateChange(date: Date | null) {
    if (!date) return;
    const iso = dayjs(date).format('YYYY-MM-DD');
    setEndDate(iso);
  }

  function addEnc() {
    const text = newEncouragement.trim();
    if (!text) return;
    addEncouragement(text);
    setNewEncouragement('');
  }

  return (
    <div className="config-panel w-96 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-3 space-y-2.5">
      {/* Basic Info */}
      <AccordionSection title="▸ 基本信息">
        <div>
          <label className="block text-xs text-gray-500 mb-1">打卡人姓名</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入姓名（如：小明）"
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
            aria-label="打卡人姓名"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <DatePicker
              selected={dayjs(config.startDate).toDate()}
              onChange={handleStartDateChange}
              dateFormat="yyyy-MM-dd"
              aria-label="开始日期"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <DatePicker
              selected={dayjs(config.endDate).toDate()}
              onChange={handleEndDateChange}
              minDate={dayjs(config.startDate).toDate()}
              maxDate={maxDate}
              dateFormat="yyyy-MM-dd"
              aria-label="结束日期"
            />
          </div>
        </div>

        {/* Quick range buttons */}
        <div className="flex flex-wrap gap-1.5">
          {quickRanges.map((r) => (
            <button
              key={r.label}
              onClick={() => {
                setStartDate(r.start);
                setEndDate(r.end);
              }}
              className="px-2 py-0.5 text-xs border border-gray-200 rounded hover:border-indigo-400 hover:text-indigo-600"
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Day count hint */}
        {dayCount > 0 && (
          <p className={`text-xs ${dayCount > 90 ? 'text-orange-500' : 'text-gray-500'}`}>
            共 {dayCount} 天，预计约 {estPages} 页
            {dayCount > 90 && '，导出可能需要几秒'}
          </p>
        )}
      </AccordionSection>

      {/* Tasks */}
      <AccordionSection title="▸ 任务管理">
        {/* Mode toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">配置模式：</span>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              checked={config.taskConfig.mode === 'unified'}
              onChange={() => setTaskMode('unified')}
              className="accent-indigo-500"
            />
            统一任务
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              checked={config.taskConfig.mode === 'byWeekday'}
              onChange={() => setTaskMode('byWeekday')}
              className="accent-indigo-500"
            />
            按星期配置
          </label>
        </div>

        {config.taskConfig.mode === 'unified' ? (
          <TaskList
            tasks={config.taskConfig.tasks}
            onTasksChange={setUnifiedTasks}
            onAdd={addUnifiedTask}
            onRemove={removeUnifiedTask}
            onApplyTemplate={applyTemplate}
          />
        ) : (
          <div>
            {/* Weekday tabs */}
            <div className="flex flex-wrap gap-1 mb-3">
              {WEEKDAY_ORDER.map((day) => {
                const count =
                  config.taskConfig.mode === 'byWeekday'
                    ? config.taskConfig.tasksByDay[day].length
                    : 0;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveWeekday(day)}
                    className={`relative px-2.5 py-1 text-xs rounded border transition-colors ${
                      activeWeekday === day
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {WEEKDAY_LABELS[day]}
                    {count > 0 && (
                      <span
                        className={`ml-0.5 text-xs ${
                          activeWeekday === day ? 'text-indigo-200' : 'text-gray-400'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Copy button */}
            <button
              onClick={() => {
                setCopyFromDay(activeWeekday);
                setShowCopyModal(true);
              }}
              className="mb-2 text-xs text-indigo-600 hover:underline"
            >
              复制到其他天 ↓
            </button>

            {config.taskConfig.mode === 'byWeekday' && (
              <TaskList
                tasks={config.taskConfig.tasksByDay[activeWeekday]}
                onTasksChange={(tasks) => setWeekdayTasks(activeWeekday, tasks)}
                onAdd={(name) => addWeekdayTask(activeWeekday, name)}
                onRemove={(id) => removeWeekdayTask(activeWeekday, id)}
                onApplyTemplate={(tasks) => applyWeekdayTemplate(activeWeekday, tasks)}
              />
            )}
          </div>
        )}
      </AccordionSection>

      {/* Encouragements */}
      <AccordionSection title="▸ 鼓励语">
        {/* AI button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:opacity-90"
            aria-label="AI 生成鼓励语"
          >
            ✨ AI 生成
          </button>
          {aiRemainingCount !== null && (
            <span className="text-xs text-gray-400">今日平台剩余 {aiRemainingCount} 次</span>
          )}
        </div>

        {showAIPanel && <AIPanel />}

        {/* Manual encouragements */}
        <div className="space-y-1.5">
          {config.encouragements.map((enc, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={enc}
                onChange={(e) => updateEncouragement(i, e.target.value)}
                className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded"
                placeholder="鼓励语"
              />
              <button
                onClick={() => removeEncouragement(i)}
                className="text-gray-300 hover:text-red-400 text-xs"
                aria-label="删除鼓励语"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newEncouragement}
            onChange={(e) => setNewEncouragement(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEnc()}
            placeholder="输入鼓励语，回车添加"
            className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
          />
          <button
            onClick={addEnc}
            className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded"
          >
            + 添加
          </button>
        </div>
        <p className="text-xs text-gray-400">
          共 {config.encouragements.length} 条，按顺序循环分配给每天
        </p>
      </AccordionSection>

      {/* Layout */}
      <AccordionSection title="▸ 布局设置">
        <div>
          <p className="text-xs text-gray-500 mb-2">每页显示天数</p>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                onClick={() => setColumnsPerRow(n)}
                className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
                  config.columnsPerRow === n
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}
                aria-label={`每页 ${n} 天`}
              >
                {n} 列
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">纸张方向</p>
          <div className="flex gap-2">
            {(['portrait', 'landscape'] as const).map((o) => (
              <button
                key={o}
                onClick={() => setPageOrientation(o)}
                className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
                  config.pageOrientation === o
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}
                aria-label={o === 'portrait' ? '竖向' : '横向'}
              >
                {o === 'portrait' ? '⬜ 竖向' : '⬛ 横向'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {config.columnsPerRow === 1
              ? '推荐竖向'
              : config.columnsPerRow === 3
              ? '推荐横向'
              : '竖向或横向均可'}
          </p>
        </div>
      </AccordionSection>
    </div>
  );
}
