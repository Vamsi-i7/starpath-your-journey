import { useState, useMemo } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { AnalyticsTabs } from '@/components/analytics/AnalyticsTabs';
import { TodayView } from '@/components/analytics/TodayView';
import { WeekView } from '@/components/analytics/WeekView';
import { MonthView } from '@/components/analytics/MonthView';
import { YearView } from '@/components/analytics/YearView';
import { AnalyticsGuide } from '@/components/analytics/AnalyticsGuide';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useHabits } from '@/hooks/useHabits';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
} from 'date-fns';

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showGuide, setShowGuide] = useState(false);
  const { habits } = useHabits();

  // Check if user has seen the analytics guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('analytics_guide_seen');
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, []);

  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem('analytics_guide_seen', 'true');
  };
  
  const {
    loading,
    calculateDailyMetrics,
    calculateWeeklyMetrics,
    calculateMonthlyMetrics,
    calculateQuarterlyMetrics,
    compareMetrics,
    generateInsights,
    habitCompletions,
  } = useAnalyticsData();

  // Today view data
  const todayData = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const dailyMetrics = calculateDailyMetrics(today, today);
    const todayMetric = dailyMetrics[0] || {
      date: todayStr,
      habitsCompleted: 0,
      xpEarned: 0,
      sessionMinutes: 0,
      goalsCompleted: 0,
      completionRate: 0,
    };

    return {
      ...todayMetric,
      totalHabits: habits.length,
    };
  }, [calculateDailyMetrics, habits]);

  // Week view data
  const weekViewData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    const currentWeekData = calculateDailyMetrics(weekStart, weekEnd);
    const prevWeekStart = subWeeks(weekStart, 1);
    const prevWeekEnd = subWeeks(weekEnd, 1);
    const prevWeekData = calculateDailyMetrics(prevWeekStart, prevWeekEnd);
    
    const currentHabits = currentWeekData.reduce((sum, d) => sum + d.habitsCompleted, 0);
    const prevHabits = prevWeekData.reduce((sum, d) => sum + d.habitsCompleted, 0);
    const currentXp = currentWeekData.reduce((sum, d) => sum + d.xpEarned, 0);
    const prevXp = prevWeekData.reduce((sum, d) => sum + d.xpEarned, 0);
    const currentMinutes = currentWeekData.reduce((sum, d) => sum + d.sessionMinutes, 0);
    const prevMinutes = prevWeekData.reduce((sum, d) => sum + d.sessionMinutes, 0);
    
    return {
      dailyData: currentWeekData,
      comparison: {
        habits: compareMetrics(currentHabits, prevHabits),
        xp: compareMetrics(currentXp, prevXp),
        minutes: compareMetrics(currentMinutes, prevMinutes),
      },
      insights: generateInsights(currentWeekData),
    };
  }, [calculateDailyMetrics, compareMetrics, generateInsights]);

  // Month view data
  const monthViewData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const currentMonthData = calculateDailyMetrics(monthStart, monthEnd);
    const currentWeeklyData = calculateWeeklyMetrics(monthStart, monthEnd);
    
    const prevMonthStart = subMonths(monthStart, 1);
    const prevMonthEnd = subMonths(monthEnd, 1);
    const prevMonthData = calculateDailyMetrics(prevMonthStart, prevMonthEnd);
    
    const currentHabits = currentMonthData.reduce((sum, d) => sum + d.habitsCompleted, 0);
    const prevHabits = prevMonthData.reduce((sum, d) => sum + d.habitsCompleted, 0);
    const currentXp = currentMonthData.reduce((sum, d) => sum + d.xpEarned, 0);
    const prevXp = prevMonthData.reduce((sum, d) => sum + d.xpEarned, 0);
    const currentMinutes = currentMonthData.reduce((sum, d) => sum + d.sessionMinutes, 0);
    const prevMinutes = prevMonthData.reduce((sum, d) => sum + d.sessionMinutes, 0);
    
    return {
      dailyData: currentMonthData,
      weeklyData: currentWeeklyData,
      comparison: {
        habits: compareMetrics(currentHabits, prevHabits),
        xp: compareMetrics(currentXp, prevXp),
        minutes: compareMetrics(currentMinutes, prevMinutes),
      },
      insights: generateInsights(currentMonthData),
    };
  }, [currentMonth, calculateDailyMetrics, calculateWeeklyMetrics, compareMetrics, generateInsights]);

  // Year view data
  const yearViewData = useMemo(() => {
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 11, 31));
    
    const currentYearMonthly = calculateMonthlyMetrics(yearStart, yearEnd);
    const currentYearQuarterly = calculateQuarterlyMetrics(currentYear);
    
    const prevYearStart = subYears(yearStart, 1);
    const prevYearEnd = subYears(yearEnd, 1);
    const prevYearMonthly = calculateMonthlyMetrics(prevYearStart, prevYearEnd);
    
    const currentHabits = currentYearMonthly.reduce((sum, m) => sum + m.totalHabits, 0);
    const prevHabits = prevYearMonthly.reduce((sum, m) => sum + m.totalHabits, 0);
    const currentXp = currentYearMonthly.reduce((sum, m) => sum + m.totalXp, 0);
    const prevXp = prevYearMonthly.reduce((sum, m) => sum + m.totalXp, 0);
    const currentMinutes = currentYearMonthly.reduce((sum, m) => sum + m.totalMinutes, 0);
    const prevMinutes = prevYearMonthly.reduce((sum, m) => sum + m.totalMinutes, 0);
    
    const yearDailyData = calculateDailyMetrics(yearStart, yearEnd);
    
    return {
      monthlyData: currentYearMonthly,
      quarterlyData: currentYearQuarterly,
      comparison: {
        habits: compareMetrics(currentHabits, prevHabits),
        xp: compareMetrics(currentXp, prevXp),
        minutes: compareMetrics(currentMinutes, prevMinutes),
      },
      insights: generateInsights(yearDailyData),
    };
  }, [currentYear, calculateDailyMetrics, calculateMonthlyMetrics, calculateQuarterlyMetrics, compareMetrics, generateInsights]);

  const handleMonthDrillDown = (monthIndex: number) => {
    const newMonth = new Date(currentYear, monthIndex, 1);
    setCurrentMonth(newMonth);
    setActiveTab('month');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <AppTopbar title="Analytics" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-primary/5">
      <AppTopbar title="Analytics" />
      
      <AnalyticsGuide open={showGuide} onClose={handleCloseGuide} />
      
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <AnalyticsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todayView={
            <TodayView data={todayData} />
          }
          weekView={
            <WeekView
              dailyData={weekViewData.dailyData}
              comparison={weekViewData.comparison}
              insights={weekViewData.insights}
              loading={loading}
            />
          }
          monthView={
            <MonthView
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              dailyData={monthViewData.dailyData}
              weeklyData={monthViewData.weeklyData}
              comparison={monthViewData.comparison}
              insights={monthViewData.insights}
              loading={loading}
            />
          }
          yearView={
            <YearView
              currentYear={currentYear}
              onYearChange={setCurrentYear}
              monthlyData={yearViewData.monthlyData}
              quarterlyData={yearViewData.quarterlyData}
              comparison={yearViewData.comparison}
              insights={yearViewData.insights}
              loading={loading}
              onMonthDrillDown={handleMonthDrillDown}
            />
          }
        />
      </div>
    </div>
  );
};

export default AnalyticsPage;
