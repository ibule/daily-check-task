// Weekday: 0=Sunday, 1=Monday, ..., 6=Saturday (matches Date.getDay())
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Task {
  id: string;
  name: string; // max 20 chars
}

export type TaskConfig =
  | { mode: 'unified'; tasks: Task[] }
  | { mode: 'byWeekday'; tasksByDay: Record<Weekday, Task[]> };

export interface PrintConfig {
  name: string;
  startDate: string; // ISO "2026-03-24"
  endDate: string;
  taskConfig: TaskConfig;
  encouragements: string[];
  columnsPerRow: 1 | 2 | 3;
  pageOrientation: 'portrait' | 'landscape';
}

export interface DayCard {
  isoDate: string;
  displayDate: string;   // "2026 年 03 月 24 日"
  weekday: Weekday;
  weekdayLabel: string;  // "星期二"
  tasks: Task[];
  encouragement: string;
  isWeekend: boolean;
}

export type AIStyle = 'gentle' | 'lively' | 'positive' | 'poetic' | 'humorous';

export const AI_STYLES: Record<AIStyle, string> = {
  gentle: '温柔鼓励',
  lively: '活泼可爱',
  positive: '正能量',
  poetic: '诗意唯美',
  humorous: '搞笑幽默',
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
};

export const WEEKDAY_FULL_LABELS: Record<Weekday, string> = {
  0: '星期日',
  1: '星期一',
  2: '星期二',
  3: '星期三',
  4: '星期四',
  5: '星期五',
  6: '星期六',
};

export interface TaskTemplate {
  name: string;
  tasks: string[];
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    name: '学生工作日',
    tasks: ['学校作业', '天天默写', '口算', '英语打卡', '读书并完成阅读书单'],
  },
  {
    name: '学生周末',
    tasks: ['兴趣班练习', '体育锻炼', '阅读', '整理房间'],
  },
  {
    name: '运动版',
    tasks: ['跳绳', '跑步', '做操', '拉伸'],
  },
];
