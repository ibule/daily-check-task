import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';
import { useStore } from '../store';
import { Weekday, WEEKDAY_LABELS } from '../types';
import { getDayCount, getQuickDateRanges, estimatePages, parseEncouragementLines } from '../utils';
import TaskList from './TaskList';
import AIPanel from './AIPanel';

const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

function AccordionSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          <span className="text-base">{icon}</span>
          {title}
        </span>
        <span className="text-orange-400 text-sm font-bold">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
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
  const setEncouragements = useStore((s) => s.setEncouragements);
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
  const dayCount = getDayCount(config.startDate, config.endDate);
  const estPages = estimatePages(dayCount, config.columnsPerRow);
  const quickRanges = getQuickDateRanges();

  const maxDate = dayjs(config.startDate).add(364, 'day').toDate();

  function handleStartDateChange(date: Date | null) {
    if (!date) return;
    const iso = dayjs(date).format('YYYY-MM-DD');
    setStartDate(iso);
    const newMax = dayjs(iso).add(364, 'day');
    if (dayjs(config.endDate).isAfter(newMax)) {
      setEndDate(newMax.format('YYYY-MM-DD'));
    }
  }

  function handleEndDateChange(date: Date | null) {
    if (!date) return;
    setEndDate(dayjs(date).format('YYYY-MM-DD'));
  }

  return (
    <div className="config-panel w-full md:w-96 flex-shrink-0 overflow-y-auto border-r border-orange-100 bg-orange-50 p-3">
      {/* Basic Info */}
      <AccordionSection title="基本信息" icon="🗓️">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">打卡人姓名</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入姓名（如：小明）"
            className="w-full px-3 py-1.5 text-sm border border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
            aria-label="打卡人姓名"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">开始日期</label>
            <DatePicker
              selected={dayjs(config.startDate).toDate()}
              onChange={handleStartDateChange}
              dateFormat="yyyy-MM-dd"
              aria-label="开始日期"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">结束日期</label>
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

        {/* Quick range buttons — pill style */}
        <div className="flex flex-wrap gap-1.5">
          {quickRanges.map((r) => (
            <button
              key={r.label}
              onClick={() => {
                setStartDate(r.start);
                setEndDate(r.end);
              }}
              className="px-3 py-0.5 text-xs rounded-full border border-orange-200 bg-white text-gray-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Day count hint */}
        {dayCount > 0 && (
          <p className={`text-xs font-medium ${dayCount > 90 ? 'text-amber-600' : 'text-orange-500'}`}>
            共 {dayCount} 天，预计约 {estPages} 页
            {dayCount > 90 && '，导出可能需要几秒'}
          </p>
        )}
      </AccordionSection>

      {/* Tasks */}
      <AccordionSection title="任务管理" icon="✅">
        {/* Mode toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">配置模式：</span>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              checked={config.taskConfig.mode === 'unified'}
              onChange={() => setTaskMode('unified')}
              className="accent-orange-500"
            />
            统一任务
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              checked={config.taskConfig.mode === 'byWeekday'}
              onChange={() => setTaskMode('byWeekday')}
              className="accent-orange-500"
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
                    className={`relative px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      activeWeekday === day
                        ? 'bg-orange-400 text-white border-orange-400'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    {WEEKDAY_LABELS[day]}
                    {count > 0 && (
                      <span
                        className={`ml-0.5 text-xs ${
                          activeWeekday === day ? 'text-orange-100' : 'text-gray-400'
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
              className="mb-2 text-xs text-orange-500 hover:underline"
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
      <AccordionSection title="鼓励语" icon="🌈">
        {/* AI button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-full hover:opacity-90 shadow-sm"
            aria-label="AI 生成鼓励语"
          >
            ✨ AI 生成
          </button>
          {aiRemainingCount !== null && (
            <span className="text-xs text-gray-400">今日平台剩余 {aiRemainingCount} 次</span>
          )}
        </div>

        {showAIPanel && <AIPanel />}

        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">多行鼓励语</label>
          <textarea
            value={config.encouragements.join('\n')}
            onChange={(e) => {
              setEncouragements(parseEncouragementLines(e.target.value));
            }}
            rows={8}
            placeholder={'支持直接粘贴多行内容\n每行一条鼓励语\n系统会按顺序循环使用'}
            className="w-full text-xs px-3 py-2 border border-orange-200 rounded-lg bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-y leading-6"
          />
        </div>
        <p className="text-xs text-gray-400">
          支持多行粘贴，每行算一条；当前共 {config.encouragements.length} 条，按顺序循环分配给每天
        </p>
      </AccordionSection>

      {/* Layout */}
      <AccordionSection title="布局设置" icon="📐">
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">每页显示天数</p>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                onClick={() => setColumnsPerRow(n)}
                className={`flex-1 py-1.5 text-sm rounded-full border transition-colors ${
                  config.columnsPerRow === n
                    ? 'bg-orange-400 text-white border-orange-400'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                }`}
                aria-label={`每页 ${n} 天`}
              >
                {n} 列
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">纸张方向</p>
          <div className="flex gap-2">
            {(['portrait', 'landscape'] as const).map((o) => (
              <button
                key={o}
                onClick={() => setPageOrientation(o)}
                className={`flex-1 py-1.5 text-sm rounded-full border transition-colors ${
                  config.pageOrientation === o
                    ? 'bg-orange-400 text-white border-orange-400'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
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
