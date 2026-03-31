import { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';
import { useStore } from '../store';
import { Weekday, WEEKDAY_LABELS } from '../types';
import { getDayCount, getQuickDateRanges, estimatePages, parseEncouragementLines } from '../utils';
import TaskList from './TaskList';
import AIPanel from './AIPanel';

const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

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
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const dayCount = getDayCount(config.startDate, config.endDate);
  const estPages = estimatePages(dayCount, config.columnsPerRow);
  const quickRanges = getQuickDateRanges();
  const allSuggestedNames = ['尚思彤', '尚思嘉'];
  const maxDate = dayjs(config.startDate).add(364, 'day').toDate();

  function handleNameChange(value: string) {
    setName(value);
    if (value.trim()) {
      const filtered = allSuggestedNames.filter((n) => n.startsWith(value.trim()));
      setNameSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function handleSelectSuggestion(name: string) {
    setName(name);
    setShowSuggestions(false);
    nameInputRef.current?.blur();
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        nameInputRef.current && !nameInputRef.current.contains(e.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="config-panel h-full w-full md:w-80 flex-shrink-0 overflow-y-auto px-3 py-4 space-y-2">

      {/* ── 基本信息 ── */}
      <div className="section-card">
        <div className="section-header">
          <span className="icon">🗓</span>
          基本信息
        </div>
        <div className="section-body">

          {/* Name */}
          <div className="relative">
            <label className="field-label">打卡人姓名</label>
            <input
              ref={nameInputRef}
              type="text"
              value={config.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => {
                if (config.name.trim()) {
                  const filtered = allSuggestedNames.filter((n) => n.startsWith(config.name.trim()));
                  if (filtered.length > 0) { setNameSuggestions(filtered); setShowSuggestions(true); }
                }
              }}
              placeholder="输入姓名"
              className="input-base"
              aria-label="打卡人姓名"
              autoComplete="off"
            />
            {showSuggestions && nameSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="suggestions-dropdown">
                {nameSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(name); }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">开始日期</label>
              <DatePicker
                selected={dayjs(config.startDate).toDate()}
                onChange={handleStartDateChange}
                dateFormat="yyyy-MM-dd"
                aria-label="开始日期"
              />
            </div>
            <div>
              <label className="field-label">结束日期</label>
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

          {/* Quick ranges */}
          <div className="flex flex-wrap gap-1.5">
            {quickRanges.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => { setStartDate(r.start); setEndDate(r.end); }}
                className="pill-btn"
              >
                {r.label}
              </button>
            ))}
          </div>

          {dayCount > 0 && (
            <p className="text-xs text-muted">
              {dayCount} 天 · {estPages} 页
              {dayCount > 90 && ' · 导出较慢'}
            </p>
          )}
        </div>
      </div>

      {/* ── 任务管理 ── */}
      <div className="section-card">
        <div className="section-header">
          <span className="icon">✓</span>
          任务管理
        </div>
        <div className="section-body">
          {/* Mode toggle */}
          <div className="flex items-center gap-4">
            {(['unified', 'byWeekday'] as const).map((mode) => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={config.taskConfig.mode === mode}
                  onChange={() => setTaskMode(mode)}
                  className="accent-[#5b6cf8]"
                />
                <span className="text-xs text-dim">
                  {mode === 'unified' ? '统一' : '按星期'}
                </span>
              </label>
            ))}
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
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {WEEKDAY_ORDER.map((day) => {
                  const count = config.taskConfig.mode === 'byWeekday'
                    ? config.taskConfig.tasksByDay[day].length : 0;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setActiveWeekday(day)}
                      className={`pill-btn${activeWeekday === day ? ' active' : ''}`}
                    >
                      {WEEKDAY_LABELS[day]}
                      {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => { setCopyFromDay(activeWeekday); setShowCopyModal(true); }}
                className="text-xs text-muted"
              >
                复制到其他天 →
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
        </div>
      </div>

      {/* ── 鼓励语 ── */}
      <div className="section-card">
        <div className="section-header">
          <span className="icon">✦</span>
          鼓励语
        </div>
        <div className="section-body">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="btn-primary"
              aria-label="AI 生成鼓励语"
            >
              <span className="icon-sm">✦</span> AI 生成
            </button>
            {aiRemainingCount !== null && (
              <span className="text-xs text-hint">剩余 {aiRemainingCount} 次</span>
            )}
          </div>

          {showAIPanel && <AIPanel />}

          <div>
            <label className="field-label">鼓励语列表（每行一条）</label>
            <textarea
              value={config.encouragements.join('\n')}
              onChange={(e) => setEncouragements(parseEncouragementLines(e.target.value))}
              rows={7}
              placeholder={'每行一条&#10;系统按顺序循环使用'}
              className="input-base resize-y leading-6 textarea-hint"
            />
          </div>
          <p className="text-xs text-hint">
            共 {config.encouragements.length} 条
          </p>
        </div>
      </div>

      {/* ── 布局 ── */}
      <div className="section-card">
        <div className="section-header">
          <span className="icon">⊞</span>
          布局
        </div>
        <div className="section-body">
          <div>
            <label className="field-label">每页列数</label>
            <div className="flex gap-1.5">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setColumnsPerRow(n)}
                  className={`pill-btn flex-1${config.columnsPerRow === n ? ' active' : ''}`}
                  aria-label={`${n} 列`}
                >
                  {n} 列
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">纸张方向</label>
            <div className="flex gap-1.5">
              {(['portrait', 'landscape'] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setPageOrientation(o)}
                  className={`pill-btn flex-1${config.pageOrientation === o ? ' active' : ''}`}
                  aria-label={o === 'portrait' ? '竖向' : '横向'}
                >
                  {o === 'portrait' ? '竖向' : '横向'}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2 text-hint">
              {config.columnsPerRow === 1 ? '推荐竖向' : config.columnsPerRow === 3 ? '推荐横向' : '竖横均可'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
