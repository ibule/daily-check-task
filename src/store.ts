import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import { PrintConfig, Task, TaskConfig, Weekday } from './types';
import { generateId } from './utils';


interface AppState {
  config: PrintConfig;
  showFullPreview: boolean;
  aiLoading: boolean;
  aiRemainingCount: number | null;
  showAIPanel: boolean;
  aiStyle: string;
  copyFromDay: Weekday | null;
  showCopyModal: boolean;
  exportProgress: number | null;

  // Actions
  setName: (name: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setTaskMode: (mode: 'unified' | 'byWeekday') => void;
  setUnifiedTasks: (tasks: Task[]) => void;
  setWeekdayTasks: (weekday: Weekday, tasks: Task[]) => void;
  addUnifiedTask: (name: string) => void;
  removeUnifiedTask: (id: string) => void;
  addWeekdayTask: (weekday: Weekday, name: string) => void;
  removeWeekdayTask: (weekday: Weekday, id: string) => void;
  setEncouragements: (list: string[]) => void;
  setColumnsPerRow: (cols: 1 | 2 | 3) => void;
  setPageOrientation: (orientation: 'portrait' | 'landscape') => void;
  setShowFullPreview: (show: boolean) => void;
  setAILoading: (loading: boolean) => void;
  setAIRemainingCount: (count: number | null) => void;
  setShowAIPanel: (show: boolean) => void;
  setAIStyle: (style: string) => void;
  setCopyFromDay: (day: Weekday | null) => void;
  setShowCopyModal: (show: boolean) => void;
  copyWeekdayTasksTo: (targetDays: Weekday[]) => void;
  setExportProgress: (progress: number | null) => void;
  applyTemplate: (tasks: string[]) => void;
  applyWeekdayTemplate: (weekday: Weekday, tasks: string[]) => void;
}

const today = dayjs().format('YYYY-MM-DD');
const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD');

const defaultConfig: PrintConfig = {
  name: '小明',
  startDate: today,
  endDate: endOfMonth,
  taskConfig: {
    mode: 'unified',
    tasks: [
      { id: generateId(), name: '学校作业' },
      { id: generateId(), name: '天天默写' },
      { id: generateId(), name: '口算' },
      { id: generateId(), name: '英语打卡' },
      { id: generateId(), name: '读书并完成阅读书单' },
    ],
  },
  encouragements: [
    '继续加油！',
    '你真棒！',
    '坚持就是胜利！',
    '每天进步一点点！',
    '加油，你是最棒的！',
  ],
  columnsPerRow: 2,
  pageOrientation: 'landscape',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      showFullPreview: false,
      aiLoading: false,
      aiRemainingCount: null,
      showAIPanel: false,
      aiStyle: 'gentle',
      copyFromDay: null,
      showCopyModal: false,
      exportProgress: null,

      setName: (name) =>
        set((s) => ({ config: { ...s.config, name } })),

      setStartDate: (date) =>
        set((s) => ({ config: { ...s.config, startDate: date } })),

      setEndDate: (date) =>
        set((s) => ({ config: { ...s.config, endDate: date } })),

      setTaskMode: (mode) =>
        set((s) => {
          const current = s.config.taskConfig;
          let newTaskConfig: TaskConfig;
          if (mode === 'unified') {
            const tasks = current.mode === 'unified'
              ? current.tasks
              : current.tasksByDay[1] ?? [];
            newTaskConfig = { mode: 'unified', tasks };
          } else {
            const tasks = current.mode === 'unified' ? current.tasks : [];
            newTaskConfig = {
              mode: 'byWeekday',
              tasksByDay: {
                0: [],
                1: tasks,
                2: [...tasks.map(t => ({ ...t, id: generateId() }))],
                3: [...tasks.map(t => ({ ...t, id: generateId() }))],
                4: [...tasks.map(t => ({ ...t, id: generateId() }))],
                5: [...tasks.map(t => ({ ...t, id: generateId() }))],
                6: [],
              },
            };
          }
          return { config: { ...s.config, taskConfig: newTaskConfig } };
        }),

      setUnifiedTasks: (tasks) =>
        set((s) => ({
          config: {
            ...s.config,
            taskConfig: { mode: 'unified', tasks },
          },
        })),

      setWeekdayTasks: (weekday, tasks) =>
        set((s) => {
          if (s.config.taskConfig.mode !== 'byWeekday') return s;
          return {
            config: {
              ...s.config,
              taskConfig: {
                ...s.config.taskConfig,
                tasksByDay: {
                  ...s.config.taskConfig.tasksByDay,
                  [weekday]: tasks,
                },
              },
            },
          };
        }),

      addUnifiedTask: (name) =>
        set((s) => {
          if (s.config.taskConfig.mode !== 'unified') return s;
          const tasks = s.config.taskConfig.tasks;
          if (tasks.length >= 15) return s;
          return {
            config: {
              ...s.config,
              taskConfig: {
                mode: 'unified',
                tasks: [...tasks, { id: generateId(), name: name.slice(0, 20) }],
              },
            },
          };
        }),

      removeUnifiedTask: (id) =>
        set((s) => {
          if (s.config.taskConfig.mode !== 'unified') return s;
          return {
            config: {
              ...s.config,
              taskConfig: {
                mode: 'unified',
                tasks: s.config.taskConfig.tasks.filter((t) => t.id !== id),
              },
            },
          };
        }),

      addWeekdayTask: (weekday, name) =>
        set((s) => {
          if (s.config.taskConfig.mode !== 'byWeekday') return s;
          const dayTasks = s.config.taskConfig.tasksByDay[weekday];
          if (dayTasks.length >= 15) return s;
          return {
            config: {
              ...s.config,
              taskConfig: {
                ...s.config.taskConfig,
                tasksByDay: {
                  ...s.config.taskConfig.tasksByDay,
                  [weekday]: [...dayTasks, { id: generateId(), name: name.slice(0, 20) }],
                },
              },
            },
          };
        }),

      removeWeekdayTask: (weekday, id) =>
        set((s) => {
          if (s.config.taskConfig.mode !== 'byWeekday') return s;
          return {
            config: {
              ...s.config,
              taskConfig: {
                ...s.config.taskConfig,
                tasksByDay: {
                  ...s.config.taskConfig.tasksByDay,
                  [weekday]: s.config.taskConfig.tasksByDay[weekday].filter((t) => t.id !== id),
                },
              },
            },
          };
        }),

      setEncouragements: (list) =>
        set((s) => ({
          config: {
            ...s.config,
            encouragements: list.filter((line) => line.trim()),
          },
        })),

      setColumnsPerRow: (cols) =>
        set((s) => ({ config: { ...s.config, columnsPerRow: cols } })),

      setPageOrientation: (orientation) =>
        set((s) => ({ config: { ...s.config, pageOrientation: orientation } })),

      setShowFullPreview: (show) => set({ showFullPreview: show }),
      setAILoading: (loading) => set({ aiLoading: loading }),
      setAIRemainingCount: (count) => set({ aiRemainingCount: count }),
      setShowAIPanel: (show) => set({ showAIPanel: show }),
      setAIStyle: (style) => set({ aiStyle: style }),

      setCopyFromDay: (day) => set({ copyFromDay: day }),
      setShowCopyModal: (show) => set({ showCopyModal: show }),

      copyWeekdayTasksTo: (targetDays) =>
        set((s) => {
          const { copyFromDay } = s;
          if (s.config.taskConfig.mode !== 'byWeekday' || copyFromDay === null) return s;
          const sourceTasks = s.config.taskConfig.tasksByDay[copyFromDay];
          const newTasksByDay = { ...s.config.taskConfig.tasksByDay };
          for (const day of targetDays) {
            newTasksByDay[day] = sourceTasks.map((t) => ({ ...t, id: generateId() }));
          }
          return {
            config: {
              ...s.config,
              taskConfig: { ...s.config.taskConfig, tasksByDay: newTasksByDay },
            },
            showCopyModal: false,
          };
        }),

      setExportProgress: (progress) => set({ exportProgress: progress }),

      applyTemplate: (tasks) =>
        set((s) => {
          if (s.config.taskConfig.mode !== 'unified') return s;
          return {
            config: {
              ...s.config,
              taskConfig: {
                mode: 'unified',
                tasks: tasks.map((name) => ({ id: generateId(), name })),
              },
            },
          };
        }),

      applyWeekdayTemplate: (weekday, tasks) =>
        set((s) => {
          if (s.config.taskConfig.mode !== 'byWeekday') return s;
          return {
            config: {
              ...s.config,
              taskConfig: {
                ...s.config.taskConfig,
                tasksByDay: {
                  ...s.config.taskConfig.tasksByDay,
                  [weekday]: tasks.map((name) => ({ id: generateId(), name })),
                },
              },
            },
          };
        }),
    }),
    {
      name: 'daily-check-config',
      partialize: (s) => ({ config: s.config }),
    }
  )
);
