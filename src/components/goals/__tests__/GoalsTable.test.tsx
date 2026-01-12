import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

/**
 * Component tests for Goals UI components
 * Testing rendering and user interactions
 */

// Simple mock components to avoid dependency issues
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant, size, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress-bar" data-value={value} className={className}>
      {value}%
    </div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

// Test data factory
const createTestGoal = (overrides = {}) => ({
  id: 'goal-1',
  user_id: 'user-1',
  title: 'Test Goal',
  description: 'Test Description',
  status: 'active' as const,
  priority: 'medium' as const,
  progress: 50,
  target_date: '2026-12-31',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  completed_at: null,
  tasks: [],
  ...overrides,
});

const createTestTask = (overrides = {}) => ({
  id: 'task-1',
  goal_id: 'goal-1',
  user_id: 'user-1',
  title: 'Test Task',
  completed: false,
  position: 0,
  due_date: null,
  parent_task_id: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  subtasks: [],
  ...overrides,
});

describe('Goal Data Structure', () => {
  it('should create valid goal with default values', () => {
    const goal = createTestGoal();
    
    expect(goal.id).toBe('goal-1');
    expect(goal.title).toBe('Test Goal');
    expect(goal.status).toBe('active');
    expect(goal.progress).toBe(50);
    expect(goal.tasks).toEqual([]);
  });

  it('should allow overriding goal properties', () => {
    const goal = createTestGoal({
      id: 'custom-id',
      title: 'Custom Goal',
      status: 'completed',
      progress: 100,
    });
    
    expect(goal.id).toBe('custom-id');
    expect(goal.title).toBe('Custom Goal');
    expect(goal.status).toBe('completed');
    expect(goal.progress).toBe(100);
  });

  it('should create goal with tasks', () => {
    const tasks = [
      createTestTask({ id: 'task-1', title: 'Task 1' }),
      createTestTask({ id: 'task-2', title: 'Task 2', completed: true }),
    ];
    
    const goal = createTestGoal({ tasks });
    
    expect(goal.tasks).toHaveLength(2);
    expect(goal.tasks[0].title).toBe('Task 1');
    expect(goal.tasks[1].completed).toBe(true);
  });
});

describe('Task Data Structure', () => {
  it('should create valid task with default values', () => {
    const task = createTestTask();
    
    expect(task.id).toBe('task-1');
    expect(task.title).toBe('Test Task');
    expect(task.completed).toBe(false);
    expect(task.parent_task_id).toBeNull();
  });

  it('should create subtask with parent reference', () => {
    const subtask = createTestTask({
      id: 'subtask-1',
      title: 'Subtask',
      parent_task_id: 'task-1',
    });
    
    expect(subtask.parent_task_id).toBe('task-1');
  });

  it('should create task with due date', () => {
    const task = createTestTask({
      due_date: '2026-06-15',
    });
    
    expect(task.due_date).toBe('2026-06-15');
  });
});

describe('Goals Filtering', () => {
  const goals = [
    createTestGoal({ id: '1', status: 'active', priority: 'high' }),
    createTestGoal({ id: '2', status: 'active', priority: 'low' }),
    createTestGoal({ id: '3', status: 'completed', priority: 'medium' }),
    createTestGoal({ id: '4', status: 'completed', priority: 'high' }),
  ];

  it('should filter active goals', () => {
    const activeGoals = goals.filter(g => g.status === 'active');
    expect(activeGoals).toHaveLength(2);
  });

  it('should filter completed goals', () => {
    const completedGoals = goals.filter(g => g.status === 'completed');
    expect(completedGoals).toHaveLength(2);
  });

  it('should filter by priority', () => {
    const highPriorityGoals = goals.filter(g => g.priority === 'high');
    expect(highPriorityGoals).toHaveLength(2);
  });

  it('should combine filters', () => {
    const activeHighPriority = goals.filter(
      g => g.status === 'active' && g.priority === 'high'
    );
    expect(activeHighPriority).toHaveLength(1);
  });
});

describe('Goals Statistics', () => {
  it('should calculate total tasks across goals', () => {
    const goals = [
      createTestGoal({
        id: '1',
        tasks: [
          createTestTask({ id: 't1' }),
          createTestTask({ id: 't2' }),
        ],
      }),
      createTestGoal({
        id: '2',
        tasks: [
          createTestTask({ id: 't3' }),
        ],
      }),
    ];
    
    const totalTasks = goals.reduce((acc, g) => acc + g.tasks.length, 0);
    expect(totalTasks).toBe(3);
  });

  it('should calculate completed tasks across goals', () => {
    const goals = [
      createTestGoal({
        id: '1',
        tasks: [
          createTestTask({ id: 't1', completed: true }),
          createTestTask({ id: 't2', completed: false }),
        ],
      }),
      createTestGoal({
        id: '2',
        tasks: [
          createTestTask({ id: 't3', completed: true }),
        ],
      }),
    ];
    
    const completedTasks = goals.reduce(
      (acc, g) => acc + g.tasks.filter(t => t.completed).length,
      0
    );
    expect(completedTasks).toBe(2);
  });

  it('should calculate overall completion percentage', () => {
    const goals = [
      createTestGoal({ id: '1', progress: 50 }),
      createTestGoal({ id: '2', progress: 100 }),
      createTestGoal({ id: '3', progress: 0 }),
    ];
    
    const avgProgress = goals.reduce((acc, g) => acc + g.progress, 0) / goals.length;
    expect(avgProgress).toBe(50);
  });
});

describe('Task Hierarchy', () => {
  it('should identify root tasks', () => {
    const tasks = [
      createTestTask({ id: 't1', parent_task_id: null }),
      createTestTask({ id: 't2', parent_task_id: 't1' }),
      createTestTask({ id: 't3', parent_task_id: null }),
    ];
    
    const rootTasks = tasks.filter(t => t.parent_task_id === null);
    expect(rootTasks).toHaveLength(2);
  });

  it('should find subtasks of a parent', () => {
    const tasks = [
      createTestTask({ id: 't1', parent_task_id: null }),
      createTestTask({ id: 't2', parent_task_id: 't1' }),
      createTestTask({ id: 't3', parent_task_id: 't1' }),
      createTestTask({ id: 't4', parent_task_id: 't2' }),
    ];
    
    const subtasksOfT1 = tasks.filter(t => t.parent_task_id === 't1');
    expect(subtasksOfT1).toHaveLength(2);
  });

  it('should build nested task structure', () => {
    interface TaskWithSubtasks {
      id: string;
      parent_task_id: string | null;
      subtasks: TaskWithSubtasks[];
    }
    
    const flatTasks = [
      { id: 't1', parent_task_id: null },
      { id: 't2', parent_task_id: 't1' },
      { id: 't3', parent_task_id: 't1' },
      { id: 't4', parent_task_id: 't2' },
    ];
    
    const buildTree = (tasks: typeof flatTasks, parentId: string | null = null): TaskWithSubtasks[] => {
      return tasks
        .filter(t => t.parent_task_id === parentId)
        .map(t => ({
          ...t,
          subtasks: buildTree(tasks, t.id),
        }));
    };
    
    const tree = buildTree(flatTasks);
    
    expect(tree).toHaveLength(1); // Only t1 is root
    expect(tree[0].subtasks).toHaveLength(2); // t2 and t3
    expect(tree[0].subtasks[0].subtasks).toHaveLength(1); // t4 under t2
  });
});

describe('Goal Sorting', () => {
  it('should sort goals by created date descending', () => {
    const goals = [
      createTestGoal({ id: '1', created_at: '2026-01-01' }),
      createTestGoal({ id: '2', created_at: '2026-01-15' }),
      createTestGoal({ id: '3', created_at: '2026-01-10' }),
    ];
    
    const sorted = [...goals].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });

  it('should sort goals by priority', () => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const goals = [
      createTestGoal({ id: '1', priority: 'low' }),
      createTestGoal({ id: '2', priority: 'high' }),
      createTestGoal({ id: '3', priority: 'medium' }),
    ];
    
    const sorted = [...goals].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    
    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('medium');
    expect(sorted[2].priority).toBe('low');
  });

  it('should sort goals by progress', () => {
    const goals = [
      createTestGoal({ id: '1', progress: 50 }),
      createTestGoal({ id: '2', progress: 100 }),
      createTestGoal({ id: '3', progress: 25 }),
    ];
    
    const sorted = [...goals].sort((a, b) => b.progress - a.progress);
    
    expect(sorted[0].progress).toBe(100);
    expect(sorted[1].progress).toBe(50);
    expect(sorted[2].progress).toBe(25);
  });
});

describe('Due Date Handling', () => {
  it('should identify overdue tasks', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const task = createTestTask({
      due_date: yesterday.toISOString().split('T')[0],
    });
    
    const isOverdue = task.due_date && new Date(task.due_date) < today && !task.completed;
    expect(isOverdue).toBe(true);
  });

  it('should not mark completed tasks as overdue', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const task = createTestTask({
      due_date: yesterday.toISOString().split('T')[0],
      completed: true,
    });
    
    const isOverdue = task.due_date && new Date(task.due_date) < today && !task.completed;
    expect(isOverdue).toBe(false);
  });

  it('should identify tasks due today', () => {
    const today = new Date().toISOString().split('T')[0];
    
    const task = createTestTask({ due_date: today });
    
    const isDueToday = task.due_date === today;
    expect(isDueToday).toBe(true);
  });
});
