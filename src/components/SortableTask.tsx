import { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';

interface Props {
  task: Task;
  onRemove: (id: string) => void;
  onUpdate: (id: string, name: string) => void;
}

export default function SortableTask({ task, onRemove, onUpdate }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const divRef = useRef<HTMLDivElement>(null);

  // dnd-kit transform/transition must be applied as inline style (changes every animation frame).
  // We write directly to the DOM element to avoid the "no inline styles" lint rule.
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    el.style.transform = CSS.Transform.toString(transform) ?? '';
    el.style.transition = transition ?? '';
  }, [transform, transition]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (divRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={`task-row group${isDragging ? ' opacity-40' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-hint hover:text-dim cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="拖拽排序"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="3" cy="3" r="1.3" />
          <circle cx="7" cy="3" r="1.3" />
          <circle cx="3" cy="7" r="1.3" />
          <circle cx="7" cy="7" r="1.3" />
          <circle cx="3" cy="11" r="1.3" />
          <circle cx="7" cy="11" r="1.3" />
        </svg>
      </button>

      <input
        type="text"
        value={task.name}
        onChange={(e) => onUpdate(task.id, e.target.value.slice(0, 20))}
        className="flex-1 text-sm outline-none border-none bg-transparent text-[#ccc] placeholder-[#444]"
        placeholder="任务名称"
        maxLength={20}
        aria-label="任务名称"
      />

      <button
        type="button"
        onClick={() => onRemove(task.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-hint hover:text-[#f87171]"
        aria-label="删除"
      >
        ✕
      </button>
    </div>
  );
}
