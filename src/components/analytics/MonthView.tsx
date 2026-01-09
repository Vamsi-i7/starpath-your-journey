import { useState, useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from './MetricCard';
import { InsightsPanel } from './InsightsPanel';
import { SkeletonChart, SkeletonMetricCard } from '@/components/ui/skeleton-loader';
import { CheckCircle2, Zap, Clock, Target, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths, getDaysInMonth } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DailyMetrics, WeeklyMetrics, ComparisonMetrics } from '@/hooks/useAnalyticsData';

interface MonthViewProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  dailyData: DailyMetrics[];
  weeklyData: WeeklyMetrics[];
  comparison: {
    habits: ComparisonMetrics;
    xp: ComparisonMetrics;
    minutes: ComparisonMetrics;
  };
  insights: any[];
  loading?: boolean;
}

export const MonthView = memo(({
  currentMonth,
  onMonthChange,
  dailyData,
  weeklyData,
  comparison,
  insights,
  loading = false,
}: MonthViewProps) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Calculate summary metrics
  const summary = useMemo(() => {
    const totalHabits = dailyData.reduce((sum, d) => sum + d.habitsCompleted, 0);
    const totalXp = dailyData.reduce((sum, d) => sum + d.xpEarned, 0);
    const totalMinutes = dailyData.reduce((sum, d) => sum + d.sessionMinutes, 0);
    const daysInMonth = getDaysInMonth(currentMonth);
    const avgPerDay = totalHabits / daysInMonth;
    
    const bestDay = dailyData.reduce((best, day) => 
      day.habitsCompleted > best.habitsCompleted ? day : best
    );
    
    const worstDay = dailyData.reduce((worst, day) => 
      day.habitsCompleted < worst.habitsCompleted ? day : worst
    );

    const activeDays = dailyData.filter(d => d.habitsCompleted > 0).length;
    const monthProgress = (activeDays / daysInMonth) * 100;

    return {
      totalHabits,
      totalXp,
      totalMinutes,
      avgPerDay,
      bestDay,
      worstDay,
      activeDays,
      monthProgress,
      daysInMonth,
    };
  }, [dailyData, currentMonth]);

  // Format data for charts
  const chartData = useMemo(() => {
    return dailyData.map(d => ({
      name: format(parseISO(d.date), 'd'),
      fullDate: format(parseISO(d.date), 'MMM dd'),
      habits: d.habitsCompleted,
      xp: d.xpEarned,
      minutes: d.sessionMinutes,
      date: d.date,
    }));
  }, [dailyData]);

  // Weekly aggregated data
  const weeklyChartData = useMemo(() => {
    return weeklyData.map((w, index) => ({
      name: `Week ${index + 1}`,
      habits: w.totalHabits,
      xp: w.totalXp,
      minutes: w.totalMinutes,
      avgDaily: w.avgDailyCompletion,
    }));
  }, [weeklyData]);

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{payload[0]?.payload?.fullDate || payload[0]?.payload?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
              {entry.name === 'minutes' && ' min'}
              {entry.name === 'habits' && ' habits'}
              {entry.name === 'xp' && ' XP'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>
      <SkeletonChart />
      <SkeletonChart />
    </div>;
  }

  const selectedDayData = selectedDay ? dailyData.find(d => d.date === selectedDay) : null;

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <Card className="p-4 border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Quick jump:</span>
            <Select
              value={format(currentMonth, 'yyyy-MM')}
              onValueChange={(value) => onMonthChange(parseISO(value + '-01'))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = subMonths(new Date(), i);
                  return (
                    <SelectItem key={i} value={format(date, 'yyyy-MM')}>
                      {format(date, 'MMM yyyy')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Month Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Habits"
          value={summary.totalHabits}
          icon={CheckCircle2}
          change={{
            value: comparison.habits.percentageChange,
            direction: comparison.habits.direction,
          }}
          subtitle={`${summary.avgPerDay.toFixed(1)} per day`}
          color="text-emerald-500"
          trend="positive"
        />
        <MetricCard
          title="Total XP"
          value={summary.totalXp}
          icon={Zap}
          change={{
            value: comparison.xp.percentageChange,
            direction: comparison.xp.direction,
          }}
          subtitle={`${(summary.totalXp / summary.daysInMonth).toFixed(0)} per day`}
          color="text-amber-500"
          trend="positive"
        />
        <MetricCard
          title="Active Days"
          value={summary.activeDays}
          icon={Calendar}
          subtitle={`${summary.monthProgress.toFixed(0)}% of month`}
          color="text-blue-500"
        />
        <MetricCard
          title="Peak Day"
          value={summary.bestDay.habitsCompleted}
          icon={Target}
          subtitle={format(parseISO(summary.bestDay.date), 'MMM dd')}
          color="text-purple-500"
        />
      </div>

      {/* Daily Trend Chart */}
      <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Daily Trend</h3>
          <p className="text-xs text-muted-foreground">Day-by-day performance across the month</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorMonthHabits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              stroke="#888"
              style={{ fontSize: '11px' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="left"
              stroke="#888"
              style={{ fontSize: '11px' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#888"
              style={{ fontSize: '11px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="habits"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#colorMonthHabits)"
              animationDuration={1200}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="xp"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 2 }}
              animationDuration={1200}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Weekly Breakdown */}
      <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Weekly Breakdown</h3>
          <p className="text-xs text-muted-foreground">Performance by week within the month</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              stroke="#888"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#888"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="rect"
            />
            <Bar 
              dataKey="habits" 
              fill="#8b5cf6" 
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
            />
            <Bar 
              dataKey="xp" 
              fill="#f59e0b" 
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Day Selector and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Day Drill-Down */}
        <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Day Details</h3>
            <p className="text-xs text-muted-foreground">Select a day to view details</p>
          </div>
          <Select
            value={selectedDay || ''}
            onValueChange={setSelectedDay}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a day" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {dailyData.map(day => (
                <SelectItem key={day.date} value={day.date}>
                  {format(parseISO(day.date), 'MMM dd, yyyy')} - {day.habitsCompleted} habits
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedDayData && (
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Habits Completed</p>
                <p className="text-2xl font-bold text-foreground">{selectedDayData.habitsCompleted}</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs text-muted-foreground mb-1">XP Earned</p>
                <p className="text-2xl font-bold text-amber-500">{selectedDayData.xpEarned}</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs text-muted-foreground mb-1">Active Time</p>
                <p className="text-2xl font-bold text-blue-500">{selectedDayData.sessionMinutes}m</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-xs text-muted-foreground mb-1">Goals Completed</p>
                <p className="text-2xl font-bold text-emerald-500">{selectedDayData.goalsCompleted}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Insights */}
        <div className="lg:col-span-2">
          <InsightsPanel insights={insights} loading={loading} />
        </div>
      </div>

      {/* Month Comparison */}
      <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">vs Previous Month</h3>
          <p className="text-xs text-muted-foreground">Performance comparison</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border/40">
            <p className="text-xs text-muted-foreground mb-2">Habits Completed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{summary.totalHabits}</span>
              <span className={`text-sm font-medium ${
                comparison.habits.direction === 'up' ? 'text-emerald-500' : 
                comparison.habits.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {comparison.habits.direction === 'up' ? '↑' : comparison.habits.direction === 'down' ? '↓' : '→'}
                {comparison.habits.percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-border/40">
            <p className="text-xs text-muted-foreground mb-2">Total XP</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{summary.totalXp}</span>
              <span className={`text-sm font-medium ${
                comparison.xp.direction === 'up' ? 'text-emerald-500' : 
                comparison.xp.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {comparison.xp.direction === 'up' ? '↑' : comparison.xp.direction === 'down' ? '↓' : '→'}
                {comparison.xp.percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-border/40">
            <p className="text-xs text-muted-foreground mb-2">Active Time</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{Math.floor(summary.totalMinutes / 60)}h</span>
              <span className={`text-sm font-medium ${
                comparison.minutes.direction === 'up' ? 'text-emerald-500' : 
                comparison.minutes.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {comparison.minutes.direction === 'up' ? '↑' : comparison.minutes.direction === 'down' ? '↓' : '→'}
                {comparison.minutes.percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});
