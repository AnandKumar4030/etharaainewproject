import { useState, useRef } from 'react';
import { tasksApi } from '../lib/api';
import { Plus, Flag, Users, Calendar } from 'lucide-react';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: 'text-gray-400',  dot: 'bg-gray-400' },
  { id: 'in_progress', label: 'In Progress',  color: 'text-blue-400',  dot: 'bg-blue-400' },
  { id: 'done',        label: 'Done',         color: 'text-green-400', dot: 'bg-green-500' },
];

const priorityColor = { low: 'text-gray-400', medium: 'text-yellow-400', high: 'text-red-400' };

function TaskCard({ task, onDragStart, onEdit, isAdmin, onDelete }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  return (
    <div
      draggable
      id={`task-card-${task.id}`}
      onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); onDragStart(task.id); }}
      className="kanban-card group"
      style={{ borderColor: isOverdue ? 'rgb(239,68,68,0.4)' : undefined }}
    >
      <p className="text-sm font-medium mb-2 leading-snug" style={{ color: 'var(--text-1)' }}>{task.title}</p>
      {task.description && (
        <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-3)' }}>{task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Flag className={`w-3 h-3 ${priorityColor[task.priority]}`} />
          {task.assigneeName && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
              <Users className="w-3 h-3" />{task.assigneeName.split(' ')[0]}
            </span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : ''}`} style={isOverdue ? {} : { color: 'var(--text-3)' }}>
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(task)} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>Edit</button>
            <button onClick={() => onDelete(task.id)} className="text-xs px-1.5 py-0.5 rounded text-red-400 hover:text-red-300" style={{ background: 'var(--surface-2)' }}>Del</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanView({ tasks, isAdmin, onEdit, onDelete, onCreateInColumn, onStatusChange }) {
  const [dragOver, setDragOver] = useState(null);
  const draggingId = useRef(null);

  const handleDrop = async (e, colId) => {
    e.preventDefault();
    setDragOver(null);
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === colId) return;
    try {
      const { data } = await tasksApi.update(taskId, { status: colId });
      onStatusChange(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div
            key={col.id}
            className={`kanban-column flex-shrink-0 ${dragOver === col.id ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-1 pb-2 mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`text-xs font-bold uppercase tracking-wide ${col.color}`}>{col.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                  {colTasks.length}
                </span>
              </div>
              {isAdmin && col.id === 'todo' && (
                <button
                  onClick={() => onCreateInColumn(col.id)}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  title="Add task"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {colTasks.length === 0 ? (
                <div className="text-xs text-center py-6 rounded-lg border-2 border-dashed" style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}>
                  Drop tasks here
                </div>
              ) : (
                colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isAdmin={isAdmin}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDragStart={(id) => { draggingId.current = id; }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
