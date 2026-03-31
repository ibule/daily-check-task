import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task } from '../types';
import SortableTask from './SortableTask';

interface Props {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onApplyTemplate: (tasks: string[]) => void;
}

export default function TaskList({ tasks, onTasksChange, onAdd, onRemove, onApplyTemplate: _onApplyTemplate }: Props) {
  const [newTask, setNewTask] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      onTasksChange(arrayMove(tasks, oldIndex, newIndex));
    }
  }

  function handleUpdate(id: string, name: string) {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, name } : t)));
  }

  function handleAdd() {
    const name = newTask.trim();
    if (!name) return;
    if (tasks.length >= 15) { alert('最多 15 条'); return; }
    onAdd(name);
    setNewTask('');
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {tasks.map((task) => (
              <SortableTask key={task.id} task={task} onRemove={onRemove} onUpdate={handleUpdate} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {tasks.length === 0 && (
        <p className="text-xs text-hint py-1">暂无任务</p>
      )}

      <div className="flex gap-1.5">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value.slice(0, 20))}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="任务名称"
          maxLength={20}
          className="input-base flex-1"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={tasks.length >= 15}
          className="btn-ghost disabled:opacity-30"
        >
          添加
        </button>
      </div>

      <p className="text-xs text-hint">{tasks.length}/15</p>
    </div>
  );
}
