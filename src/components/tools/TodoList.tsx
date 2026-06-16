import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  StickyNote,
  ListTodo,
  Sparkles,
  Flag,
  RotateCcw,
  X
} from 'lucide-react';

// Types
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  completedAt?: number;
}

type FilterType = 'all' | 'active' | 'completed';
type TabType = 'tasks' | 'scratchpad';

// Persistence helpers
const STORAGE_KEY_TODOS = 'devbox-todos';
const STORAGE_KEY_SCRATCH = 'devbox-scratchpad';

const loadTodos = (): Todo[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TODOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveTodos = (todos: Todo[]) => {
  localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
};

const loadScratch = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_SCRATCH) || '';
  } catch {
    return '';
  }
};

const saveScratch = (text: string) => {
  localStorage.setItem(STORAGE_KEY_SCRATCH, text);
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
};

const PRIORITY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  high: { bg: 'rgba(244, 63, 94, 0.08)', border: 'rgba(244, 63, 94, 0.25)', text: '#f43f5e', dot: '#f43f5e' },
  medium: { bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.25)', text: '#fbbf24', dot: '#fbbf24' },
  low: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', text: '#10b981', dot: '#10b981' },
};

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [scratchpad, setScratchpad] = useState<string>(loadScratch);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [filter, setFilter] = useState<FilterType>('all');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showAddForm, setShowAddForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scratchRef = useRef<HTMLTextAreaElement>(null);

  // Persist todos on every change
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // Persist scratchpad on every keystroke
  const handleScratchChange = (text: string) => {
    setScratchpad(text);
    saveScratch(text);
  };

  // Focus input when add form opens
  useEffect(() => {
    if (showAddForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddForm]);

  // CRUD operations
  const addTodo = () => {
    const trimmed = newTaskText.trim();
    if (!trimmed) return;

    const newTodo: Todo = {
      id: generateId(),
      text: trimmed,
      completed: false,
      priority: newTaskPriority,
      createdAt: Date.now(),
    };

    setTodos(prev => [newTodo, ...prev]);
    setNewTaskText('');
    setShowAddForm(false);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined }
          : t
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(t => !t.completed));
  };

  // Filtered list
  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  // Stats
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTodo();
    }
    if (e.key === 'Escape') {
      setShowAddForm(false);
      setNewTaskText('');
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Task Board
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Manage your tasks and quick notes — all data persists locally.
          </p>
        </div>

        {/* Stats Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            color: 'var(--accent)'
          }}>
            {activeTasks} active
          </div>
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: 'var(--success)'
          }}>
            {completedTasks} done
          </div>
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}>
            {completionRate}% complete
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: activeTab === 'tasks' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'tasks' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          <ListTodo size={15} />
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('scratchpad')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: activeTab === 'scratchpad' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'scratchpad' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          <StickyNote size={15} />
          Quick Notes
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1, minHeight: 0 }}>
          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'active', 'completed'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: filter === f ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                    background: filter === f ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                    color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {completedTasks > 0 && (
                <button
                  onClick={clearCompleted}
                  className="btn btn-secondary"
                  style={{ padding: '7px 12px', fontSize: '12px' }}
                >
                  <RotateCcw size={13} />
                  <span>Clear Done</span>
                </button>
              )}
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary"
                style={{ padding: '7px 14px', fontSize: '12px' }}
              >
                <Plus size={14} />
                <span>New Task</span>
              </button>
            </div>
          </div>

          {/* Add Task Form */}
          {showAddForm && (
            <div className="fade-in" style={{
              display: 'flex',
              gap: '10px',
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.06) 0%, rgba(99, 102, 241, 0.04) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '12px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <input
                ref={inputRef}
                type="text"
                className="input-control"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                style={{ flex: 1, minWidth: '200px', padding: '10px 14px', fontSize: '13px' }}
              />
              {/* Priority Select */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setNewTaskPriority(p)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: newTaskPriority === p ? `1px solid ${PRIORITY_COLORS[p].dot}` : '1px solid var(--border-color)',
                      background: newTaskPriority === p ? PRIORITY_COLORS[p].bg : 'transparent',
                      color: newTaskPriority === p ? PRIORITY_COLORS[p].text : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Flag size={10} style={{ marginRight: '4px' }} />
                    {p}
                  </button>
                ))}
              </div>
              <button onClick={addTodo} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                Add
              </button>
              <button onClick={() => { setShowAddForm(false); setNewTaskText(''); }} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px'
              }}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Task List */}
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            paddingRight: '4px'
          }}>
            {filteredTodos.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                color: 'var(--text-muted)',
                gap: '12px'
              }}>
                <Sparkles size={36} style={{ opacity: 0.4 }} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  {filter === 'all' ? 'No tasks yet. Add one to get started!' : `No ${filter} tasks.`}
                </span>
              </div>
            ) : (
              filteredTodos.map(todo => {
                const pColor = PRIORITY_COLORS[todo.priority];
                return (
                  <div
                    key={todo.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: todo.completed ? 'rgba(255,255,255,0.02)' : pColor.bg,
                      border: `1px solid ${todo.completed ? 'var(--border-color)' : pColor.border}`,
                      transition: 'all 0.2s ease',
                      opacity: todo.completed ? 0.6 : 1
                    }}
                  >
                    {/* Check Circle */}
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        flexShrink: 0
                      }}
                    >
                      {todo.completed ? (
                        <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                      ) : (
                        <Circle size={20} style={{ color: pColor.dot }} />
                      )}
                    </button>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: todo.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}>
                        {todo.text}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>{formatRelativeTime(todo.createdAt)}</span>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: pColor.dot
                        }} />
                        <span style={{ color: pColor.text, textTransform: 'capitalize' }}>{todo.priority}</span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--text-muted)',
                        borderRadius: '6px',
                        transition: 'color 0.15s ease',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      title="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Progress Bar */}
          {totalTasks > 0 && (
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {completedTasks}/{totalTasks} tasks
              </span>
              <div style={{
                flex: 1,
                height: '6px',
                background: 'var(--border-color)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${completionRate}%`,
                  background: completionRate === 100
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : 'linear-gradient(90deg, var(--accent), #818cf8)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: completionRate === 100 ? 'var(--success)' : 'var(--accent)' }}>
                {completionRate}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Scratchpad Tab */}
      {activeTab === 'scratchpad' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, minHeight: 0 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StickyNote size={14} style={{ color: 'var(--warning)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Quick Notes — auto-saved on every keystroke
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {scratchpad.length} chars
            </span>
          </div>

          <textarea
            ref={scratchRef}
            className="textarea-control"
            value={scratchpad}
            onChange={(e) => handleScratchChange(e.target.value)}
            placeholder="Scribble anything here... meeting notes, quick ideas, code snippets, reminders.&#10;&#10;Everything is saved instantly to local storage. It won't disappear even if the app crashes."
            style={{
              flexGrow: 1,
              resize: 'none',
              fontSize: '14px',
              lineHeight: 1.7,
              padding: '18px',
              borderRadius: '12px',
              background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.03) 0%, rgba(14, 11, 22, 0.4) 100%)',
              borderLeft: '3px solid var(--warning)',
              minHeight: '300px'
            }}
          />

          <div style={{
            padding: '10px 14px',
            background: 'rgba(251, 191, 36, 0.06)',
            border: '1px solid rgba(251, 191, 36, 0.15)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={14} style={{ color: 'var(--warning)' }} />
            <span>Data is persisted to localStorage immediately. Safe from crashes and refreshes.</span>
          </div>
        </div>
      )}
    </div>
  );
};
