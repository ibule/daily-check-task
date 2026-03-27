import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';

interface Props {
  task: Task;
  onRemove: (id: string) => void;
  onUpdate: (id: string, name: string) => void;
}

export default function SortableTask({ task, onRemove, onUpdate }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-1.5 px-2 bg-white border border-gray-200 rounded group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="拖拽排序"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="4" cy="4" r="1.5" />
          <circle cx="8" cy="4" r="1.5" />
          <circle cx="4" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="8" cy="12" r="1.5" />
        </svg>
      </button>

      <input
        type="text"
        value={task.name}
        onChange={(e) => onUpdate(task.id, e.target.value.slice(0, 20))}
        className="flex-1 text-sm outline-none border-none bg-transparent"
        placeholder="任务名称（最多 20 字）"
        maxLength={20}
        aria-label="任务名称"
      />

      <button
        onClick={() => onRemove(task.id)}
        className="text-gray-300 hover:text-red-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="删除任务"
      >
        ✕
      </button>
    </div>
  );
}
