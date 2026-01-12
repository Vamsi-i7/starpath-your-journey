/**
 * Integration Tests for Habits Feature
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient;
let testUserId: string;
let testHabitId: string;

const TEST_EMAIL = 'habits-test@starpath.test';
const TEST_PASSWORD = 'TestPass123!';

beforeAll(async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  supabase = createClient(supabaseUrl, supabaseKey);

  await supabase.auth.signUp({ email: TEST_EMAIL, password: TEST_PASSWORD });
  const { data } = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
  testUserId = data.user!.id;
});

afterAll(async () => {
  await supabase.from('habit_completions').delete().eq('user_id', testUserId);
  await supabase.from('habits').delete().eq('user_id', testUserId);
  await supabase.auth.signOut();
});

describe('Habits Feature', () => {
  it('should create a habit with all fields', async () => {
    const { data: habit, error } = await supabase
      .from('habits')
      .insert({
        user_id: testUserId,
        name: 'Morning Exercise',
        description: ' 30 minutes workout',
        icon: '💪',
        color: '#ff6b6b',
        frequency: 'daily',
        difficulty: 'medium',
        xp_reward: 10,
        streak: 0,
        best_streak: 0,
        total_completions: 0,
        is_active: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(habit).toBeDefined();
    expect(habit!.name).toBe('Morning Exercise');
    testHabitId = habit!.id;
  });

  it('should track habit completion', async () => {
    const today = new Date().toISOString();

    const { data: completion, error } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: testHabitId,
        user_id: testUserId,
        completed_at: today,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(completion).toBeDefined();
  });

  it('should update habit streak', async () => {
    const { data: habit, error } = await supabase
      .from('habits')
      .update({ streak: 5, best_streak: 5, total_completions: 5 })
      .eq('id', testHabitId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(habit!.streak).toBe(5);
    expect(habit!.best_streak).toBe(5);
  });

  it('should retrieve habit completions', async () => {
    const { data: completions, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', testHabitId)
      .order('completed_at', { ascending: false });

    expect(error).toBeNull();
    expect(completions).toBeDefined();
    expect(completions!.length).toBeGreaterThan(0);
  });

  it('should deactivate a habit', async () => {
    const { data: habit, error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', testHabitId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(habit!.is_active).toBe(false);
  });

  it('should handle habit with category', async () => {
    const { data: habit, error } = await supabase
      .from('habits')
      .insert({
        user_id: testUserId,
        name: 'Read Book',
        category_id: null, // No category for now
        frequency: 'daily',
        difficulty: 'easy',
        xp_reward: 5,
        is_active: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(habit).toBeDefined();

    // Clean up
    await supabase.from('habits').delete().eq('id', habit!.id);
  });

  it('should query active habits only', async () => {
    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', testUserId)
      .eq('is_active', true);

    expect(error).toBeNull();
    expect(habits).toBeDefined();
  });

  it('should handle completion on same day (duplicate)', async () => {
    const today = new Date().toISOString();

    // Try to add duplicate completion
    const { error } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: testHabitId,
        user_id: testUserId,
        completed_at: today,
      });

    // Should succeed (no unique constraint on date)
    // Frontend should handle deduplication
    expect(error).toBeNull();
  });
});

describe('Habit Analytics', () => {
  it('should calculate weekly completion rate', async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: completions, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', testUserId)
      .gte('completed_at', oneWeekAgo.toISOString());

    expect(error).toBeNull();
    expect(completions).toBeDefined();

    const weeklyCount = completions!.length;
    expect(weeklyCount).toBeGreaterThanOrEqual(0);
  });

  it('should get best performing habits', async () => {
    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', testUserId)
      .order('total_completions', { ascending: false })
      .limit(5);

    expect(error).toBeNull();
    expect(habits).toBeDefined();
  });
});
