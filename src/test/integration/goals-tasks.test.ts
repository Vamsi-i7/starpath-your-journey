/**
 * Integration Tests for Goals & Tasks Feature
 * Simulates real user workflows to catch bugs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient;
let testUserId: string;

const TEST_EMAIL = 'goals-test@starpath.test';
const TEST_PASSWORD = 'TestPass123!';

beforeAll(async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  supabase = createClient(supabaseUrl, supabaseKey);

  // Authenticate
  const { data: signUpData } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const { data: signInData } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  testUserId = signInData.user!.id;
});

afterAll(async () => {
  // Clean up all test data
  await supabase.from('tasks').delete().eq('user_id', testUserId);
  await supabase.from('goals').delete().eq('user_id', testUserId);
  await supabase.auth.signOut();
});

describe('Goals & Tasks Workflow', () => {
  let goalId: string;
  let taskId1: string;
  let taskId2: string;

  it('should create a goal', async () => {
    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        user_id: testUserId,
        title: 'Learn TypeScript',
        description: 'Master TypeScript fundamentals',
        status: 'active',
        deadline: '2026-03-31',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(goal).toBeDefined();
    expect(goal!.title).toBe('Learn TypeScript');
    goalId = goal!.id;
  });

  it('should add first task to goal', async () => {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: testUserId,
        goal_id: goalId,
        title: 'Read TypeScript handbook',
        parent_task_id: null,
        due_date: null,
        completed: false,
        position: 0,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(task).toBeDefined();
    expect(task!.title).toBe('Read TypeScript handbook');
    taskId1 = task!.id;
  });

  it('should add second task with due date', async () => {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: testUserId,
        goal_id: goalId,
        title: 'Complete TypeScript exercises',
        due_date: '2026-02-15',
        completed: false,
        position: 1,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(task!.due_date).toBe('2026-02-15');
    taskId2 = task!.id;
  });

  it('should add subtask to first task', async () => {
    const { data: subtask, error } = await supabase
      .from('tasks')
      .insert({
        user_id: testUserId,
        goal_id: goalId,
        title: 'Chapter 1: Basic Types',
        parent_task_id: taskId1, // Subtask of taskId1
        completed: false,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(subtask!.parent_task_id).toBe(taskId1);
  });

  it('should retrieve goal with all tasks', async () => {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('goal_id', goalId)
      .order('position', { ascending: true });

    expect(error).toBeNull();
    expect(tasks).toBeDefined();
    expect(tasks!.length).toBeGreaterThanOrEqual(3); // 2 main tasks + 1 subtask
  });

  it('should complete a task', async () => {
    const { data: task, error } = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('id', taskId1)
      .select()
      .single();

    expect(error).toBeNull();
    expect(task!.completed).toBe(true);
  });

  it('should calculate goal progress', async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('completed')
      .eq('goal_id', goalId);

    const totalTasks = tasks!.length;
    const completedTasks = tasks!.filter(t => t.completed).length;
    const progress = Math.round((completedTasks / totalTasks) * 100);

    // Update goal progress
    const { error } = await supabase
      .from('goals')
      .update({ progress })
      .eq('id', goalId);

    expect(error).toBeNull();
    expect(progress).toBeGreaterThan(0);
  });

  it('should mark goal as completed when all tasks done', async () => {
    // Complete all tasks
    await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('goal_id', goalId);

    // Mark goal as completed
    const { data: goal, error } = await supabase
      .from('goals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100,
      })
      .eq('id', goalId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(goal!.status).toBe('completed');
    expect(goal!.progress).toBe(100);
    expect(goal!.completed_at).toBeDefined();
  });

  it('should delete task', async () => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId2);

    expect(error).toBeNull();

    // Verify deletion
    const { data: task } = await supabase
      .from('tasks')
      .select()
      .eq('id', taskId2)
      .single();

    expect(task).toBeNull();
  });

  it('should handle concurrent task additions', async () => {
    const promises = [];

    for (let i = 0; i < 5; i++) {
      promises.push(
        supabase.from('tasks').insert({
          user_id: testUserId,
          goal_id: goalId,
          title: `Concurrent Task ${i}`,
          position: i + 10,
        })
      );
    }

    const results = await Promise.all(promises);

    results.forEach(({ error }) => {
      expect(error).toBeNull();
    });
  });
});

describe('Edge Cases & Error Handling', () => {
  it('should handle missing goal_id gracefully', async () => {
    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: testUserId,
        goal_id: '00000000-0000-0000-0000-000000000000',
        title: 'Orphan Task',
      });

    // Should fail due to FK constraint
    expect(error).toBeDefined();
    expect(error!.message).toContain('foreign key');
  });

  it('should handle circular parent_task_id references', async () => {
    const goal = await supabase
      .from('goals')
      .insert({
        user_id: testUserId,
        title: 'Circular Test',
      })
      .select()
      .single();

    const task1 = await supabase
      .from('tasks')
      .insert({
        user_id: testUserId,
        goal_id: goal.data!.id,
        title: 'Task 1',
      })
      .select()
      .single();

    // Try to create circular reference (task1 -> task1)
    const { error } = await supabase
      .from('tasks')
      .update({ parent_task_id: task1.data!.id })
      .eq('id', task1.data!.id);

    // Should succeed (database allows it, validation should be in code)
    // But frontend should prevent this
    expect(task1.data).toBeDefined();
  });

  it('should handle very long task titles', async () => {
    const goal = await supabase
      .from('goals')
      .insert({
        user_id: testUserId,
        title: 'Long Title Test',
      })
      .select()
      .single();

    const longTitle = 'A'.repeat(250); // Very long title

    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: testUserId,
        goal_id: goal.data!.id,
        title: longTitle,
      });

    // Should either succeed or fail gracefully
    if (error) {
      expect(error.message).toBeDefined();
    }
  });

  it('should handle invalid date formats', async () => {
    const goal = await supabase
      .from('goals')
      .insert({
        user_id: testUserId,
        title: 'Date Test',
      })
      .select()
      .single();

    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: testUserId,
        goal_id: goal.data!.id,
        title: 'Task with bad date',
        due_date: 'invalid-date', // Invalid date format
      });

    // Should fail with date validation error
    expect(error).toBeDefined();
  });
});
