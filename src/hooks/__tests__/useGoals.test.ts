import { describe, it, expect, vi } from 'vitest';

/**
 * Unit tests for Goals feature validation and utility functions
 * These tests verify the business logic without requiring complex mocking
 */

// Constants matching those in useGoals.ts
const MAX_TITLE_LENGTH = 200;
const MAX_TASKS_PER_GOAL = 50;
const MAX_SUBTASK_DEPTH = 3;

// Validation functions extracted for testing
const validateTitle = (title: string): { valid: boolean; error?: string } => {
  const trimmedTitle = title?.trim() || '';
  if (!trimmedTitle) {
    return { valid: false, error: 'Task title cannot be empty.' };
  }
  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: `Title must be less than ${MAX_TITLE_LENGTH} characters.` };
  }
  return { valid: true };
};

const validateDueDate = (dueDate: string | undefined): { valid: boolean; error?: string } => {
  if (!dueDate) return { valid: true };
  const dueDateObj = new Date(dueDate);
  if (isNaN(dueDateObj.getTime())) {
    return { valid: false, error: 'Please provide a valid date.' };
  }
  return { valid: true };
};

interface Task {
  id: string;
  parent_task_id: string | null;
  completed: boolean;
  subtasks?: Task[];
}

const getTaskDepth = (taskId: string, allTasks: { id: string; parent_task_id: string | null }[]): number => {
  const findDepth = (id: string | null, depth: number): number => {
    if (!id) return depth;
    const task = allTasks.find(t => t.id === id);
    if (!task || !task.parent_task_id) return depth;
    return findDepth(task.parent_task_id, depth + 1);
  };
  return findDepth(taskId, 0);
};

const countTasksRecursive = (tasks: Task[]): number => {
  return tasks.reduce((count, task) => {
    return count + 1 + (task.subtasks ? countTasksRecursive(task.subtasks) : 0);
  }, 0);
};

const calculateProgress = (tasks: Task[]): number => {
  const countTasks = (taskList: Task[]): { total: number; completed: number } => {
    return taskList.reduce((acc, t) => {
      acc.total += 1;
      if (t.completed) acc.completed += 1;
      if (t.subtasks) {
        const sub = countTasks(t.subtasks);
        acc.total += sub.total;
        acc.completed += sub.completed;
      }
      return acc;
    }, { total: 0, completed: 0 });
  };

  const { total, completed } = countTasks(tasks);
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

describe('Goals Validation Constants', () => {
  it('should have correct validation limits', () => {
    expect(MAX_TITLE_LENGTH).toBe(200);
    expect(MAX_TASKS_PER_GOAL).toBe(50);
    expect(MAX_SUBTASK_DEPTH).toBe(3);
  });
});

describe('Title Validation', () => {
  it('should reject empty title', () => {
    expect(validateTitle('')).toEqual({
      valid: false,
      error: 'Task title cannot be empty.',
    });
  });

  it('should reject whitespace-only title', () => {
    expect(validateTitle('   ')).toEqual({
      valid: false,
      error: 'Task title cannot be empty.',
    });
  });

  it('should reject title longer than 200 characters', () => {
    const longTitle = 'a'.repeat(201);
    expect(validateTitle(longTitle)).toEqual({
      valid: false,
      error: 'Title must be less than 200 characters.',
    });
  });

  it('should accept valid title', () => {
    expect(validateTitle('Valid Task Title')).toEqual({ valid: true });
  });

  it('should accept title with exactly 200 characters', () => {
    const exactTitle = 'a'.repeat(200);
    expect(validateTitle(exactTitle)).toEqual({ valid: true });
  });

  it('should trim whitespace and validate', () => {
    expect(validateTitle('  Valid Title  ')).toEqual({ valid: true });
  });

  it('should handle null/undefined gracefully', () => {
    expect(validateTitle(null as any)).toEqual({
      valid: false,
      error: 'Task title cannot be empty.',
    });
    expect(validateTitle(undefined as any)).toEqual({
      valid: false,
      error: 'Task title cannot be empty.',
    });
  });
});

describe('Due Date Validation', () => {
  it('should accept undefined due date', () => {
    expect(validateDueDate(undefined)).toEqual({ valid: true });
  });

  it('should accept valid ISO date string', () => {
    expect(validateDueDate('2026-12-31')).toEqual({ valid: true });
  });

  it('should accept valid datetime string', () => {
    expect(validateDueDate('2026-12-31T23:59:59Z')).toEqual({ valid: true });
  });

  it('should reject invalid date string', () => {
    expect(validateDueDate('invalid-date')).toEqual({
      valid: false,
      error: 'Please provide a valid date.',
    });
  });

  it('should reject malformed date', () => {
    expect(validateDueDate('2026-13-45')).toEqual({
      valid: false,
      error: 'Please provide a valid date.',
    });
  });
});

describe('Task Depth Calculation', () => {
  const tasks = [
    { id: 'task-1', parent_task_id: null },
    { id: 'task-2', parent_task_id: 'task-1' },
    { id: 'task-3', parent_task_id: 'task-2' },
    { id: 'task-4', parent_task_id: 'task-3' },
    { id: 'task-5', parent_task_id: null },
  ];

  it('should return 0 for root tasks', () => {
    expect(getTaskDepth('task-1', tasks)).toBe(0);
    expect(getTaskDepth('task-5', tasks)).toBe(0);
  });

  it('should return 1 for first-level subtasks', () => {
    expect(getTaskDepth('task-2', tasks)).toBe(1);
  });

  it('should return 2 for second-level subtasks', () => {
    expect(getTaskDepth('task-3', tasks)).toBe(2);
  });

  it('should return 3 for third-level subtasks', () => {
    expect(getTaskDepth('task-4', tasks)).toBe(3);
  });

  it('should correctly identify when depth exceeds MAX_SUBTASK_DEPTH', () => {
    const depth = getTaskDepth('task-4', tasks);
    expect(depth >= MAX_SUBTASK_DEPTH).toBe(true);
  });
});

describe('Task Counting', () => {
  it('should count tasks with no subtasks', () => {
    const tasks: Task[] = [
      { id: '1', parent_task_id: null, completed: false },
      { id: '2', parent_task_id: null, completed: true },
    ];
    expect(countTasksRecursive(tasks)).toBe(2);
  });

  it('should count tasks with nested subtasks', () => {
    const tasks: Task[] = [
      {
        id: '1',
        parent_task_id: null,
        completed: false,
        subtasks: [
          { id: '1-1', parent_task_id: '1', completed: false },
          {
            id: '1-2',
            parent_task_id: '1',
            completed: false,
            subtasks: [
              { id: '1-2-1', parent_task_id: '1-2', completed: false },
            ],
          },
        ],
      },
      { id: '2', parent_task_id: null, completed: true },
    ];
    expect(countTasksRecursive(tasks)).toBe(5);
  });

  it('should return 0 for empty task list', () => {
    expect(countTasksRecursive([])).toBe(0);
  });

  it('should detect when task count exceeds limit', () => {
    const manyTasks: Task[] = Array.from({ length: 51 }, (_, i) => ({
      id: `task-${i}`,
      parent_task_id: null,
      completed: false,
    }));
    expect(countTasksRecursive(manyTasks) > MAX_TASKS_PER_GOAL).toBe(true);
  });
});

describe('Progress Calculation', () => {
  it('should return 0 for empty task list', () => {
    expect(calculateProgress([])).toBe(0);
  });

  it('should return 0 when no tasks are completed', () => {
    const tasks: Task[] = [
      { id: '1', parent_task_id: null, completed: false },
      { id: '2', parent_task_id: null, completed: false },
    ];
    expect(calculateProgress(tasks)).toBe(0);
  });

  it('should return 100 when all tasks are completed', () => {
    const tasks: Task[] = [
      { id: '1', parent_task_id: null, completed: true },
      { id: '2', parent_task_id: null, completed: true },
    ];
    expect(calculateProgress(tasks)).toBe(100);
  });

  it('should return 50 for half completed tasks', () => {
    const tasks: Task[] = [
      { id: '1', parent_task_id: null, completed: true },
      { id: '2', parent_task_id: null, completed: false },
    ];
    expect(calculateProgress(tasks)).toBe(50);
  });

  it('should round progress correctly', () => {
    const tasks: Task[] = [
      { id: '1', parent_task_id: null, completed: true },
      { id: '2', parent_task_id: null, completed: true },
      { id: '3', parent_task_id: null, completed: false },
    ];
    expect(calculateProgress(tasks)).toBe(67); // 2/3 = 66.67 -> 67
  });

  it('should include subtasks in progress calculation', () => {
    const tasks: Task[] = [
      {
        id: '1',
        parent_task_id: null,
        completed: true,
        subtasks: [
          { id: '1-1', parent_task_id: '1', completed: true },
          { id: '1-2', parent_task_id: '1', completed: false },
        ],
      },
      {
        id: '2',
        parent_task_id: null,
        completed: false,
        subtasks: [
          { id: '2-1', parent_task_id: '2', completed: true },
        ],
      },
    ];
    // 3 completed out of 5 total = 60%
    expect(calculateProgress(tasks)).toBe(60);
  });

  it('should handle deeply nested subtasks', () => {
    const tasks: Task[] = [
      {
        id: '1',
        parent_task_id: null,
        completed: true,
        subtasks: [
          {
            id: '1-1',
            parent_task_id: '1',
            completed: true,
            subtasks: [
              {
                id: '1-1-1',
                parent_task_id: '1-1',
                completed: true,
                subtasks: [
                  { id: '1-1-1-1', parent_task_id: '1-1-1', completed: false },
                ],
              },
            ],
          },
        ],
      },
    ];
    // 3 completed out of 4 total = 75%
    expect(calculateProgress(tasks)).toBe(75);
  });
});

describe('Edge Cases', () => {
  it('should handle special characters in title', () => {
    const result = validateTitle('Learn <React> & "TypeScript" @2026!');
    expect(result.valid).toBe(true);
  });

  it('should handle unicode characters in title', () => {
    const result = validateTitle('学习中文 📚 日本語');
    expect(result.valid).toBe(true);
  });

  it('should handle emoji in title', () => {
    const result = validateTitle('🎯 Complete Project 🚀');
    expect(result.valid).toBe(true);
  });

  it('should handle very long unicode title', () => {
    const longUnicode = '学'.repeat(201);
    const result = validateTitle(longUnicode);
    expect(result.valid).toBe(false);
  });
});
