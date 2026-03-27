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
import { TASK_TEMPLATES } from '../types';
import SortableTask from './SortableTask';

interface Props {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onApplyTemplate: (tasks: string[]) => void;
}

export default function TaskList({ tasks, onTasksChange, onAdd, onRemove, onApplyTemplate }: Props) {
  const [newTask, setNewTask] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    if (tasks.length >= 15) {
      alert('每套任务最多 15 条');
      return;
    }
    onAdd(name);
    setNewTask('');
  }

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {tasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                onRemove={onRemove}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {tasks.length === 0 && (
        <p className="text-xs text-gray-400 italic py-1">暂无任务，请添加</p>
      )}

      {/* Add task input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value.slice(0, 20))}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="输入任务名称，回车添加"
          maxLength={20}
          className="flex-1 text-sm px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
        />
        <button
          onClick={handleAdd}
          disabled={tasks.length >= 15}
          className="px-3 py-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded disabled:opacity-40"
        >
          + 添加
        </button>
      </div>

      {/* Template selector */}
      <div className="relative">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
        >
          📋 使用模板
          <span className="text-gray-400">{showTemplates ? '▲' : '▼'}</span>
        </button>
        {showTemplates && (
          <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 rounded shadow-lg w-48">
            {TASK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => {
                  onApplyTemplate(tpl.tasks);
                  setShowTemplates(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {tpl.name}
              </button>
            ))}
            <button
              onClick={() => {
                onTasksChange([]);
                setShowTemplates(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 border-t border-gray-100"
            >
              🗑 清空列表
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">{tasks.length}/15 条</p>
    </div>
  );
}
