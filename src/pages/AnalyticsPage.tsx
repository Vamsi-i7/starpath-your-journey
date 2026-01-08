import { useState, useMemo } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subDays, subMonths, subYears, eachDayOfInterval, eachMonthOfInterval, endOfMonth } from 'date-fns';
import { Calendar, TrendingUp, Clock, Target, Flag, CheckCircle2 } from 'lucide-react';

type TimePeriod = '1w' | '1m' | '1y';

const AnalyticsPage = () => {
  const [period, setPeriod] = useState<TimePeriod>('1m');
  const { habits, getTodayString } = useHabits();
  const { goals } = useGoals();
  const { data: sessions } = useSessionHistory(100);
  const today = getTodayString();

  const periodConfig = useMemo(() => {
    const now = new Date();
    switch (period) {
      case '1w':
        return {
          label: 'Week',
          startDate: subDays(now, 6),
          endDate: now,
          days: 7,
        };
      case '1m':
        return {
          label: 'Month',
          startDate: subMonths(now, 1),
          endDate: now,
          days: 30,
        };
      case '1y':
        return {
          label: 'Year',
          startDate: subYears(now, 1),
          endDate: now,
          days: 365,
        };
    }
  }, [period]);

  // Generate habit completion data based on period
  const completionData = useMemo(() => {
    const { startDate, endDate } = periodConfig;

    if (period === '1w') {
      return eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const completed = habits.filter(h => h.completedDates.includes(dateStr)).length;
        return {
          label: format(date, 'EEE'),
          date: dateStr,
          completed,
          total: habits.length,
          rate: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
        };
      });
    } else if (period === '1m') {
      return Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const completed = habits.filter(h => h.completedDates.includes(dateStr)).length;
        return {
          label: format(date, 'd'),
          date: dateStr,
          completed,
          total: habits.length,
          rate: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
        };
      });
    } else {
      return eachMonthOfInterval({ start: startDate, end: endDate }).map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd > endDate ? endDate : monthEnd });
        
        let totalCompleted = 0;
        let totalPossible = 0;
        
        daysInMonth.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const completed = habits.filter(h => h.completedDates.includes(dateStr)).length;
          totalCompleted += completed;
          totalPossible += habits.length;
        });

        return {
          label: format(monthStart, 'MMM'),
          date: format(monthStart, 'yyyy-MM'),
          completed: totalCompleted,
          total: totalPossible,
          rate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
        };
      });
    }
  }, [period, periodConfig, habits]);

  // Goal completion data
  const goalStats = useMemo(() => {
    const { startDate } = periodConfig;
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    
    const goalsInPeriod = goals.filter(g => g.created_at >= startDateStr);
    const completedGoals = goals.filter(g => g.status === 'completed');
    const activeGoals = goals.filter(g => g.status === 'active');
    const atRiskGoals = goals.filter(g => g.status === 'at_risk');
    
    const totalTasks = goals.reduce((acc, g) => acc + g.tasks.length, 0);
    const completedTasks = goals.reduce((acc, g) => acc + g.tasks.filter(t => t.completed).length, 0);
    const avgProgress = goals.length > 0 
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
      : 0;

    return {
      total: goals.length,
      completed: completedGoals.length,
      active: activeGoals.length,
      atRisk: atRiskGoals.length,
      totalTasks,
      completedTasks,
      avgProgress,
      newInPeriod: goalsInPeriod.length,
    };
  }, [goals, periodConfig]);

  // Goal progress distribution for pie chart
  const goalProgressData = useMemo(() => {
    return [
      { name: 'Completed', value: goalStats.completed, color: 'hsl(var(--primary))' },
      { name: 'Active', value: goalStats.active, color: 'hsl(var(--accent))' },
      { name: 'At Risk', value: goalStats.atRisk, color: 'hsl(var(--destructive))' },
    ].filter(d => d.value > 0);
  }, [goalStats]);

  // Session time data based on period
  const sessionData = useMemo(() => {
    if (!sessions?.length) return [];

    const { startDate, endDate } = periodConfig;

    if (period === '1w') {
      return eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const daySessions = sessions.filter(s => s.ended_at.startsWith(dateStr));
        const totalMinutes = Math.round(daySessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60);
        const totalXp = daySessions.reduce((acc, s) => acc + s.xp_earned, 0);
        return {
          label: format(date, 'EEE'),
          minutes: totalMinutes,
          xp: totalXp,
        };
      });
    } else if (period === '1m') {
      return Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const daySessions = sessions.filter(s => s.ended_at.startsWith(dateStr));
        const totalMinutes = Math.round(daySessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60);
        const totalXp = daySessions.reduce((acc, s) => acc + s.xp_earned, 0);
        return {
          label: format(date, 'd'),
          minutes: totalMinutes,
          xp: totalXp,
        };
      });
    } else {
      return eachMonthOfInterval({ start: startDate, end: endDate }).map(monthStart => {
        const monthStr = format(monthStart, 'yyyy-MM');
        const monthSessions = sessions.filter(s => s.ended_at.startsWith(monthStr));
        const totalMinutes = Math.round(monthSessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60);
        const totalXp = monthSessions.reduce((acc, s) => acc + s.xp_earned, 0);
        return {
          label: format(monthStart, 'MMM'),
          minutes: totalMinutes,
          xp: totalXp,
        };
      });
    }
  }, [period, periodConfig, sessions]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalCompleted = completionData.reduce((acc, d) => acc + d.completed, 0);
    const totalPossible = completionData.reduce((acc, d) => acc + d.total, 0);
    const avgRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const totalMinutes = sessionData.reduce((acc, d) => acc + d.minutes, 0);
    const totalXp = sessionData.reduce((acc, d) => acc + d.xp, 0);

    return { totalCompleted, avgRate, totalMinutes, totalXp };
  }, [completionData, sessionData]);

  // Today's habit pie chart
  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
  const habitPieData = [
    { name: 'Completed', value: completedToday },
    { name: 'Remaining', value: Math.max(0, habits.length - completedToday) },
  ];
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  return (
    <div className="min-h-screen">
      <AppTopbar title="Analytics" />
      <div className="p-6 space-y-6">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Viewing: Last {periodConfig.label}</span>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <TabsList>
              <TabsTrigger value="1w">1 Week</TabsTrigger>
              <TabsTrigger value="1m">1 Month</TabsTrigger>
              <TabsTrigger value="1y">1 Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Habit Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Habit Completions</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summaryStats.totalCompleted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Avg Rate</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summaryStats.avgRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Focus Time</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summaryStats.totalMinutes}m</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">XP Earned</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summaryStats.totalXp}</p>
            </CardContent>
          </Card>
        </div>

        {/* Goal Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Total Goals</span>
              </div>
              <p className="text-2xl font-bold mt-1">{goalStats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Goals Completed</span>
              </div>
              <p className="text-2xl font-bold mt-1">{goalStats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Tasks Done</span>
              </div>
              <p className="text-2xl font-bold mt-1">{goalStats.completedTasks}/{goalStats.totalTasks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Avg Progress</span>
              </div>
              <p className="text-2xl font-bold mt-1">{goalStats.avgProgress}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Habit Completions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goal Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={goalProgressData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    dataKey="value" 
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {goalProgressData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Habit Completion Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} unit="%" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Area type="monotone" dataKey="rate" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Focus Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} unit="m" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Line type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Habit Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={habitPieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    dataKey="value" 
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {habitPieData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
