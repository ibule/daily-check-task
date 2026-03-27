import dayjs from 'dayjs';
import { DayCard, PrintConfig, Task, TaskConfig, Weekday, WEEKDAY_FULL_LABELS } from './types';

export function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  let cur = dayjs(start);
  const endDate = dayjs(end);
  while ((cur.isBefore(endDate) || cur.isSame(endDate)) && dates.length < 366) {
    dates.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(1, 'day');
  }
  return dates;
}

export function resolveTasksForDay(config: TaskConfig, weekday: Weekday): Task[] {
  if (config.mode === 'unified') return config.tasks;
  return config.tasksByDay[weekday] ?? [];
}

export function assignEncouragements(list: string[], count: number): string[] {
  if (!list.length) return Array(count).fill('继续加油！') as string[];
  return Array.from({ length: count }, (_, i) => list[i % list.length]);
}

export function resolveGenerateCount(dayCount: number): number {
  if (dayCount <= 14) return dayCount;
  if (dayCount <= 90) return 14;
  return 30;
}

export function buildDayCards(config: PrintConfig): DayCard[] {
  const dates = enumerateDates(config.startDate, config.endDate);
  const assigned = assignEncouragements(config.encouragements, dates.length);
  const name = config.name.trim();

  return dates.map((isoDate, i) => {
    const d = dayjs(isoDate);
    const weekday = d.day() as Weekday;
    const isWeekend = weekday === 0 || weekday === 6;
    const rawEnc = assigned[i] ?? '继续加油！';
    // Prefix name to encouragement if not already included
    const encouragement = name && !rawEnc.includes(name)
      ? `${name}，${rawEnc}`
      : rawEnc;

    return {
      isoDate,
      displayDate: d.format('YYYY 年 MM 月 DD 日'),
      weekday,
      weekdayLabel: WEEKDAY_FULL_LABELS[weekday],
      tasks: resolveTasksForDay(config.taskConfig, weekday),
      encouragement,
      isWeekend,
    };
  });
}

export function getDayCount(start: string, end: string): number {
  return dayjs(end).diff(dayjs(start), 'day') + 1;
}

export function estimatePages(dayCount: number, columnsPerRow: number): number {
  const rowsPerPage = columnsPerRow === 1 ? 2 : columnsPerRow === 2 ? 4 : 6;
  // With landscape 2-col or 3-col, more fit per page
  return Math.ceil(dayCount / rowsPerPage);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getQuickDateRanges(): Array<{ label: string; start: string; end: string }> {
  const today = dayjs();
  const startOfWeek = today.startOf('week').add(1, 'day'); // Monday
  const endOfWeek = startOfWeek.add(6, 'day');             // Sunday

  return [
    {
      label: '本周',
      start: startOfWeek.format('YYYY-MM-DD'),
      end: endOfWeek.format('YYYY-MM-DD'),
    },
    {
      label: '本月',
      start: today.startOf('month').format('YYYY-MM-DD'),
      end: today.endOf('month').format('YYYY-MM-DD'),
    },
    {
      label: '30 天',
      start: today.format('YYYY-MM-DD'),
      end: today.add(29, 'day').format('YYYY-MM-DD'),
    },
    {
      label: '90 天',
      start: today.format('YYYY-MM-DD'),
      end: today.add(89, 'day').format('YYYY-MM-DD'),
    },
    {
      label: '半年',
      start: today.format('YYYY-MM-DD'),
      end: today.add(179, 'day').format('YYYY-MM-DD'),
    },
    {
      label: '一年',
      start: today.format('YYYY-MM-DD'),
      end: today.add(364, 'day').format('YYYY-MM-DD'),
    },
  ];
}
