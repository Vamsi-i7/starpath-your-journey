-- ═══════════════════════════════════════════════════════════════
-- STARPATH DATABASE RESET SCRIPT
-- ═══════════════════════════════════════════════════════════════
-- WARNING: This will DELETE ALL DATA permanently!
-- Run this in Supabase SQL Editor to reset to fresh state
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Delete all user data (in correct order to respect foreign keys)
-- ═══════════════════════════════════════════════════════════════

-- Delete AI & Chat Data (if exists)
DO $$ 
BEGIN
    -- Delete from tables that may or may not exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_generations') THEN
        DELETE FROM ai_generations;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credit_transactions') THEN
        DELETE FROM credit_transactions;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'group_messages') THEN
        DELETE FROM group_messages;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        DELETE FROM messages;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_groups') THEN
        DELETE FROM chat_groups;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_feed') THEN
        DELETE FROM activity_feed;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        DELETE FROM notifications;
    END IF;
END $$;

-- Delete all other tables with IF EXISTS checks
DO $$ 
BEGIN
    -- Social Data
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friendships') THEN
        DELETE FROM friendships;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'challenges') THEN
        DELETE FROM challenges;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_challenges') THEN
        DELETE FROM daily_challenges;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_challenge_progress') THEN
        DELETE FROM user_challenge_progress;
    END IF;
    
    -- Session Data
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_history') THEN
        DELETE FROM session_history;
    END IF;
    
    -- Achievements Progress
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_achievements') THEN
        DELETE FROM user_achievements;
    END IF;
    
    -- Goals & Tasks
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        DELETE FROM tasks;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'goals') THEN
        DELETE FROM goals;
    END IF;
    
    -- Habits & Completions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'habit_completions') THEN
        DELETE FROM habit_completions;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'habits') THEN
        DELETE FROM habits;
    END IF;
    
    -- Subscription & Payment Data
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'razorpay_subscriptions') THEN
        DELETE FROM razorpay_subscriptions;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_orders') THEN
        DELETE FROM payment_orders;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        DELETE FROM subscriptions;
    END IF;
    
    -- User Profiles
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DELETE FROM profiles;
    END IF;
END $$;

-- STEP 2: Delete all authentication users (this removes login credentials)
-- ═══════════════════════════════════════════════════════════════

-- Delete from auth.users (Supabase Auth table)
-- This removes all user accounts and login credentials
DELETE FROM auth.users;

-- STEP 3: Reset any sequences (optional, ensures IDs start from 1 again)
-- ═══════════════════════════════════════════════════════════════

-- If you have any sequences, reset them here
-- Example: ALTER SEQUENCE some_sequence RESTART WITH 1;

-- STEP 4: Verify everything is deleted
-- ═══════════════════════════════════════════════════════════════

-- Check user count (should be 0)
DO $$
DECLARE
    result_text TEXT := '';
BEGIN
    result_text := result_text || 'Database Reset Verification:' || E'\n';
    result_text := result_text || '=============================' || E'\n\n';
    
    -- Check auth.users
    EXECUTE 'SELECT COUNT(*) FROM auth.users' INTO result_text;
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM auth.users);
    
    -- Check each table if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE 'Profiles: %', (SELECT COUNT(*) FROM profiles);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'habits') THEN
        RAISE NOTICE 'Habits: %', (SELECT COUNT(*) FROM habits);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'habit_completions') THEN
        RAISE NOTICE 'Habit Completions: %', (SELECT COUNT(*) FROM habit_completions);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'goals') THEN
        RAISE NOTICE 'Goals: %', (SELECT COUNT(*) FROM goals);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        RAISE NOTICE 'Tasks: %', (SELECT COUNT(*) FROM tasks);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friendships') THEN
        RAISE NOTICE 'Friendships: %', (SELECT COUNT(*) FROM friendships);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        RAISE NOTICE 'Subscriptions: %', (SELECT COUNT(*) FROM subscriptions);
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'All counts should be 0!';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ✅ DATABASE RESET COMPLETE!
-- ═══════════════════════════════════════════════════════════════
-- All users and data have been deleted.
-- The database is now in fresh state.
-- Tables and structure remain intact.
-- You can now sign up as a new user!
-- ═══════════════════════════════════════════════════════════════
