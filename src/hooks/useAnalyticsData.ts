import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  parseISO,
  subWeeks,
  subMonths,
  subYears,
  differenceInDays,
  startOfQuarter,
  endOfQuarter,
  getQuarter
} from 'date-fns';

export interface DailyMetrics {
  date: string;
  habitsCompleted: number;
  xpEarned: number;
  sessionMinutes: number;
  goalsCompleted: number;
  completionRate: number;
}

export interface WeeklyMetrics {
  weekStart: string;
  weekEnd: string;
  totalHabits: number;
  totalXp: number;
  totalMinutes: number;
  avgDailyCompletion: number;
}

export interface MonthlyMetrics {
  month: string;
  totalHabits: number;
  totalXp: number;
  totalMinutes: number;
  goalsCompleted: number;
  avgDailyCompletion: number;
}

export interface QuarterlyMetrics {
  quarter: number;
  year: number;
  totalHabits: number;
  totalXp: number;
  totalMinutes: number;
  goalsCompleted: number;
}

export interface ComparisonMetrics {
  current: number;
  previous: number;
  percentageChange: number;
  direction: 'up' | 'down' | 'neutral';
}

export interface AnalyticsInsight {
  type: 'success' | 'warning' | 'info' | 'trend';
  title: string;
  description: string;
  metric?: string;
}

export const useAnalyticsData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [habitCompletions, setHabitCompletions] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch habit completions
      const { data: completionsData } = await supabase
        .from('habit_completions')
        .select('*, habits(xp_reward)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: true });

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      setHabitCompletions(completionsData || []);
      setSessions(sessionsData || []);
      setGoals(goalsData || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching analytics data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate daily metrics for a date range
  const calculateDailyMetrics = (startDate: Date, endDate: Date): DailyMetrics[] => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      // Count habits completed on this day
      const dayCompletions = habitCompletions.filter(
        c => format(parseISO(c.completed_at), 'yyyy-MM-dd') === dayStr
      );
      
      const habitsCompleted = dayCompletions.length;
      const xpEarned = dayCompletions.reduce((sum, c) => sum + (c.habits?.xp_reward || 50), 0);
      
      // Calculate session minutes
      const daySessions = sessions.filter(
        s => format(parseISO(s.start_time), 'yyyy-MM-dd') === dayStr
      );
      const sessionMinutes = daySessions.reduce((sum, s) => {
        const start = new Date(s.start_time);
        const end = s.end_time ? new Date(s.end_time) : new Date();
        return sum + Math.floor((end.getTime() - start.getTime()) / 60000);
      }, 0);
      
      // Goals completed on this day
      const goalsCompleted = goals.filter(
        g => g.completed_at && format(parseISO(g.completed_at), 'yyyy-MM-dd') === dayStr
      ).length;
      
      return {
        date: dayStr,
        habitsCompleted,
        xpEarned,
        sessionMinutes,
        goalsCompleted,
        completionRate: habitsCompleted > 0 ? 100 : 0, // Simplified
      };
    });
  };

  // Calculate weekly metrics
  const calculateWeeklyMetrics = (startDate: Date, endDate: Date): WeeklyMetrics[] => {
    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { weekStartsOn: 1 } // Monday
    );
    
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const dailyData = calculateDailyMetrics(weekStart, weekEnd);
      
      return {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        totalHabits: dailyData.reduce((sum, d) => sum + d.habitsCompleted, 0),
        totalXp: dailyData.reduce((sum, d) => sum + d.xpEarned, 0),
        totalMinutes: dailyData.reduce((sum, d) => sum + d.sessionMinutes, 0),
        avgDailyCompletion: dailyData.reduce((sum, d) => sum + d.habitsCompleted, 0) / 7,
      };
    });
  };

  // Calculate monthly metrics
  const calculateMonthlyMetrics = (startDate: Date, endDate: Date): MonthlyMetrics[] => {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const dailyData = calculateDailyMetrics(monthStart, monthEnd);
      const daysInMonth = dailyData.length;
      
      return {
        month: format(month, 'yyyy-MM'),
        totalHabits: dailyData.reduce((sum, d) => sum + d.habitsCompleted, 0),
        totalXp: dailyData.reduce((sum, d) => sum + d.xpEarned, 0),
        totalMinutes: dailyData.reduce((sum, d) => sum + d.sessionMinutes, 0),
        goalsCompleted: dailyData.reduce((sum, d) => sum + d.goalsCompleted, 0),
        avgDailyCompletion: dailyData.reduce((sum, d) => sum + d.habitsCompleted, 0) / daysInMonth,
      };
    });
  };

  // Calculate quarterly metrics
  const calculateQuarterlyMetrics = (year: number): QuarterlyMetrics[] => {
    return [1, 2, 3, 4].map(quarter => {
      const quarterStart = startOfQuarter(new Date(year, (quarter - 1) * 3, 1));
      const quarterEnd = endOfQuarter(quarterStart);
      const dailyData = calculateDailyMetrics(quarterStart, quarterEnd);
      
      return {
        quarter,
        year,
        totalHabits: dailyData.reduce((sum, d) => sum + d.habitsCompleted, 0),
        totalXp: dailyData.reduce((sum, d) => sum + d.xpEarned, 0),
        totalMinutes: dailyData.reduce((sum, d) => sum + d.sessionMinutes, 0),
        goalsCompleted: dailyData.reduce((sum, d) => sum + d.goalsCompleted, 0),
      };
    });
  };

  // Compare periods
  const compareMetrics = (current: number, previous: number): ComparisonMetrics => {
    const percentageChange = previous === 0 
      ? (current > 0 ? 100 : 0)
      : ((current - previous) / previous) * 100;
    
    let direction: 'up' | 'down' | 'neutral' = 'neutral';
    if (percentageChange > 0) direction = 'up';
    else if (percentageChange < 0) direction = 'down';
    
    return {
      current,
      previous,
      percentageChange: Math.abs(percentageChange),
      direction,
    };
  };

  // Generate insights
  const generateInsights = (data: DailyMetrics[]): AnalyticsInsight[] => {
    const insights: AnalyticsInsight[] = [];
    
    if (data.length === 0) return insights;
    
    // Best day
    const bestDay = data.reduce((best, day) => 
      day.habitsCompleted > best.habitsCompleted ? day : best
    );
    if (bestDay.habitsCompleted > 0) {
      insights.push({
        type: 'success',
        title: 'Peak Performance',
        description: `Your best day was ${format(parseISO(bestDay.date), 'MMM dd')} with ${bestDay.habitsCompleted} habits completed`,
        metric: `${bestDay.habitsCompleted} habits`,
      });
    }
    
    // Consistency check
    const daysWithCompletions = data.filter(d => d.habitsCompleted > 0).length;
    const consistency = (daysWithCompletions / data.length) * 100;
    if (consistency >= 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Consistency',
        description: `You've been active ${consistency.toFixed(0)}% of days in this period`,
        metric: `${daysWithCompletions}/${data.length} days`,
      });
    } else if (consistency < 50) {
      insights.push({
        type: 'warning',
        title: 'Room for Improvement',
        description: `Try to maintain a more consistent habit tracking routine`,
        metric: `${consistency.toFixed(0)}% active`,
      });
    }
    
    // Trend detection
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.habitsCompleted, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.habitsCompleted, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.2) {
      insights.push({
        type: 'trend',
        title: 'Upward Trend',
        description: `Your activity has increased by ${((secondAvg - firstAvg) / firstAvg * 100).toFixed(0)}% in the recent period`,
        metric: '📈 Growing',
      });
    } else if (secondAvg < firstAvg * 0.8) {
      insights.push({
        type: 'warning',
        title: 'Declining Activity',
        description: `Your activity has decreased recently. Let's get back on track!`,
        metric: '📉 Declining',
      });
    }
    
    return insights;
  };

  return {
    loading,
    habitCompletions,
    sessions,
    goals,
    calculateDailyMetrics,
    calculateWeeklyMetrics,
    calculateMonthlyMetrics,
    calculateQuarterlyMetrics,
    compareMetrics,
    generateInsights,
    refreshData: fetchAllData,
  };
};
