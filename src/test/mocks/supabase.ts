import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user-id' } } }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
};

// Helper to create mock goals data
export const createMockGoal = (overrides = {}) => ({
  id: 'goal-1',
  user_id: 'test-user-id',
  title: 'Test Goal',
  description: 'Test Description',
  status: 'active',
  priority: 'medium',
  progress: 0,
  target_date: '2026-12-31',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  completed_at: null,
  ...overrides,
});

// Helper to create mock tasks data
export const createMockTask = (overrides = {}) => ({
  id: 'task-1',
  user_id: 'test-user-id',
  goal_id: 'goal-1',
  title: 'Test Task',
  completed: false,
  position: 0,
  due_date: null,
  parent_task_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

// Mock implementation for useGoals hook testing
export const createMockGoalsData = () => ({
  goals: [
    {
      ...createMockGoal(),
      tasks: [
        createMockTask(),
        createMockTask({ id: 'task-2', title: 'Task 2', completed: true }),
      ],
    },
    {
      ...createMockGoal({ id: 'goal-2', title: 'Goal 2', status: 'completed', progress: 100 }),
      tasks: [
        createMockTask({ id: 'task-3', goal_id: 'goal-2', title: 'Task 3', completed: true }),
      ],
    },
  ],
});
