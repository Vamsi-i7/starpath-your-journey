import { useState, useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from './MetricCard';
import { InsightsPanel } from './InsightsPanel';
import { SkeletonChart, SkeletonMetricCard } from '@/components/ui/skeleton-loader';
import { CheckCircle2, Zap, Clock, Target, ChevronLeft, ChevronRight, TrendingUp, Award } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
  ComposedChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MonthlyMetrics, QuarterlyMetrics, ComparisonMetrics, DailyMetrics } from '@/hooks/useAnalyticsData';

interface YearViewProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  monthlyData: MonthlyMetrics[];
  quarterlyData: QuarterlyMetrics[];
  comparison: {
    habits: ComparisonMetrics;
    xp: ComparisonMetrics;
    minutes: ComparisonMetrics;
  };
  insights: any[];
  loading?: boolean;
  onMonthDrillDown?: (monthIndex: number) => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTER_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export const YearView = memo(({
  currentYear,
  onYearChange,
  monthlyData,
  quarterlyData,
  comparison,
  insights,
  loading = false,
  onMonthDrillDown,
}: YearViewProps) => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Calculate year summary
  const yearSummary = useMemo(() => {
    const totalHabits = monthlyData.reduce((sum, m) => sum + m.totalHabits, 0);
    const totalXp = monthlyData.reduce((sum, m) => sum + m.totalXp, 0);
    const totalMinutes = monthlyData.reduce((sum, m) => sum + m.totalMinutes, 0);
    const totalGoals = monthlyData.reduce((sum, m) => sum + m.goalsCompleted, 0);
    const totalGoalsCreated = monthlyData.reduce((sum, m) => sum + (m.goalsCreated || 0), 0);
    const avgGoalCompletionRate = monthlyData.reduce((sum, m) => sum + (m.goalCompletionRate || 0), 0) / 12;
    
    const bestMonth = monthlyData.reduce((best, month) => 
      month.totalHabits > best.totalHabits ? month : best
    );
    
    const worstMonth = monthlyData.reduce((worst, month) => 
      month.totalHabits < worst.totalHabits ? month : worst
    );

    // Calculate consistency (months with activity)
    const activeMonths = monthlyData.filter(m => m.totalHabits > 0).length;
    const consistency = (activeMonths / 12) * 100;

    // Calculate volatility (standard deviation of monthly habits)
    const avgMonthlyHabits = totalHabits / 12;
    const variance = monthlyData.reduce((sum, m) => 
      sum + Math.pow(m.totalHabits - avgMonthlyHabits, 2), 0
    ) / 12;
    const volatility = Math.sqrt(variance);

    return {
      totalHabits,
      totalXp,
      totalMinutes,
      totalGoals,
      totalGoalsCreated,
      avgGoalCompletionRate,
      avgMonthlyHabits,
      bestMonth,
      worstMonth,
      activeMonths,
      consistency,
      volatility,
    };
  }, [monthlyData]);

  // Format monthly chart data
  const monthlyChartData = useMemo(() => {
    return monthlyData.map((m, index) => ({
      name: MONTH_NAMES[index],
      month: format(parseISO(m.month + '-01'), 'MMM yyyy'),
      habits: m.totalHabits,
      xp: m.totalXp,
      minutes: m.totalMinutes,
      goals: m.goalsCompleted,
      avgDaily: m.avgDailyCompletion,
      monthIndex: index,
    }));
  }, [monthlyData]);

  // Format quarterly chart data
  const quarterlyChartData = useMemo(() => {
    return quarterlyData.map(q => ({
      name: `Q${q.quarter}`,
      habits: q.totalHabits,
      xp: q.totalXp,
      minutes: q.totalMinutes,
      goals: q.goalsCompleted,
    }));
  }, [quarterlyData]);

  // Radar chart data for monthly distribution
  const radarData = useMemo(() => {
    return monthlyChartData.map(m => ({
      month: m.name,
      value: m.habits,
    }));
  }, [monthlyChartData]);

  const handlePrevYear = () => {
    onYearChange(currentYear - 1);
  };

  const handleNextYear = () => {
    onYearChange(currentYear + 1);
  };

  const handleMonthClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const monthIndex = data.activePayload[0].payload.monthIndex;
      setSelectedMonth(monthIndex);
      if (onMonthDrillDown) {
        onMonthDrillDown(monthIndex);
      }
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{payload[0]?.payload?.month || payload[0]?.payload?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
              {entry.name === 'minutes' && ' min'}
              {entry.name === 'habits' && ' habits'}
              {entry.name === 'xp' && ' XP'}
              {entry.name === 'goals' && ' goals'}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>;
  }

  const selectedMonthData = selectedMonth !== null ? monthlyData[selectedMonth] : null;

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <Card className="p-4 border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevYear}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">{currentYear}</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextYear}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Quick jump:</span>
            <Select
              value={currentYear.toString()}
              onValueChange={(value) => onYearChange(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Year Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Habits"
          value={yearSummary.totalHabits}
          icon={CheckCircle2}
          change={{
            value: comparison.habits.percentageChange,
            direction: comparison.habits.direction,
          }}
          subtitle={`${yearSummary.avgMonthlyHabits.toFixed(0)} per month`}
          color="text-emerald-500"
          trend="positive"
        />
        <MetricCard
          title="Total XP"
          value={yearSummary.totalXp}
          icon={Zap}
          change={{
            value: comparison.xp.percentageChange,
            direction: comparison.xp.direction,
          }}
          subtitle={`${(yearSummary.totalXp / 12).toFixed(0)} per month`}
          color="text-amber-500"
          trend="positive"
        />
        <MetricCard
          title="Active Months"
          value={yearSummary.activeMonths}
          icon={TrendingUp}
          subtitle={`${yearSummary.consistency.toFixed(0)}% consistency`}
          color="text-blue-500"
        />
        <MetricCard
          title="Goals Achieved"
          value={yearSummary.totalGoals}
          icon={Award}
          subtitle={`${(yearSummary.totalGoals / 12).toFixed(1)} per month`}
          color="text-purple-500"
        />
      </div>

      {/* Year Progress Overview */}
      <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Year-to-Date Progress</h3>
          <p className="text-xs text-muted-foreground">Monthly performance throughout {currentYear}</p>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={monthlyChartData} onClick={handleMonthClick}>
            <defs>
              <linearGradient id="colorYearHabits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              stroke="#888"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#888"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#888"
              style={{ fontSize: '12px' }}
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
              strokeWidth={3}
              fill="url(#colorYearHabits)"
              animationDuration={1500}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="xp"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
              animationDuration={1500}
            />
            <Bar
              yAxisId="left"
              dataKey="goals"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              opacity={0.6}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Quarterly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Quarterly Summary</h3>
            <p className="text-xs text-muted-foreground">Performance by quarter (Q1-Q4)</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quarterlyChartData}>
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
              {quarterlyChartData.map((q, index) => (
                <Bar 
                  key={`quarter-${index}`}
                  dataKey="habits" 
                  fill={QUARTER_COLORS[index]}
                  radius={[8, 8, 0, 0]}
                  animationDuration={1200}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Distribution Radar */}
        <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Monthly Distribution</h3>
            <p className="text-xs text-muted-foreground">Habits completed across all months</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#333" opacity={0.2} />
              <PolarAngleAxis 
                dataKey="month" 
                stroke="#888"
                style={{ fontSize: '11px' }}
              />
              <PolarRadiusAxis 
                stroke="#888"
                style={{ fontSize: '10px' }}
              />
              <Radar
                name="Habits"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                animationDuration={1500}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Goal Completion Analytics */}
      <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Goal Completion Analytics
          </h3>
          <p className="text-xs text-muted-foreground">Track your goal achievement throughout the year</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs text-muted-foreground mb-1">Goals Completed</p>
            <p className="text-3xl font-bold text-purple-500">{yearSummary.totalGoals}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {yearSummary.totalGoalsCreated > 0 
                ? `${((yearSummary.totalGoals / yearSummary.totalGoalsCreated) * 100).toFixed(0)}% success rate`
                : 'No goals created yet'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-muted-foreground mb-1">Goals Created</p>
            <p className="text-3xl font-bold text-blue-500">{yearSummary.totalGoalsCreated}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(yearSummary.totalGoalsCreated / 12).toFixed(1)} per month
            </p>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-muted-foreground mb-1">Avg Completion Rate</p>
            <p className="text-3xl font-bold text-amber-500">{yearSummary.avgGoalCompletionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly average
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyChartData}>
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
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="goals"
              stroke="#a855f7"
              strokeWidth={3}
              dot={{ r: 5, fill: '#a855f7' }}
              activeDot={{ r: 7 }}
              animationDuration={1500}
              name="Goals Completed"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Best & Worst Months */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-border/40 bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-500">🏆 Best Month</h3>
              <p className="text-xs text-muted-foreground">Peak performance</p>
            </div>
            <Award className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Month</p>
              <p className="text-2xl font-bold">{format(parseISO(yearSummary.bestMonth.month + '-01'), 'MMMM')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Habits</p>
                <p className="text-xl font-bold text-emerald-500">{yearSummary.bestMonth.totalHabits}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">XP</p>
                <p className="text-xl font-bold text-emerald-500">{yearSummary.bestMonth.totalXp}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/40 bg-amber-500/5 border-amber-500/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-amber-500">📊 Growth Opportunity</h3>
              <p className="text-xs text-muted-foreground">Lowest activity month</p>
            </div>
            <Target className="w-8 h-8 text-amber-500" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Month</p>
              <p className="text-2xl font-bold">{format(parseISO(yearSummary.worstMonth.month + '-01'), 'MMMM')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Habits</p>
                <p className="text-xl font-bold text-amber-500">{yearSummary.worstMonth.totalHabits}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">XP</p>
                <p className="text-xl font-bold text-amber-500">{yearSummary.worstMonth.totalXp}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Year Comparison */}
      <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">vs Previous Year ({currentYear - 1})</h3>
          <p className="text-xs text-muted-foreground">Year-over-year performance comparison</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-border/40 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Total Habits</p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold">{yearSummary.totalHabits}</span>
              <span className={`text-lg font-semibold ${
                comparison.habits.direction === 'up' ? 'text-emerald-500' : 
                comparison.habits.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {comparison.habits.direction === 'up' ? '↑' : comparison.habits.direction === 'down' ? '↓' : '→'}
                {comparison.habits.percentageChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              vs {comparison.habits.previous} in {currentYear - 1}
            </p>
          </div>
          
          <div className="p-6 rounded-lg border border-border/40 bg-gradient-to-br from-amber-500/5 to-transparent">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Total XP</p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold">{yearSummary.totalXp.toLocaleString()}</span>
              <span className={`text-lg font-semibold ${
                comparison.xp.direction === 'up' ? 'text-emerald-500' : 
                comparison.xp.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {comparison.xp.direction === 'up' ? '↑' : comparison.xp.direction === 'down' ? '↓' : '→'}
                {comparison.xp.percentageChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              vs {comparison.xp.previous.toLocaleString()} in {currentYear - 1}
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border/40 bg-gradient-to-br from-blue-500/5 to-transparent">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Active Time</p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold">{Math.floor(yearSummary.totalMinutes / 60)}h</span>
              <span className={`text-lg font-semibold ${
                comparison.minutes.direction === 'up' ? 'text-emerald-500' : 
                comparison.minutes.direction === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {comparison.minutes.direction === 'up' ? '↑' : comparison.minutes.direction === 'down' ? '↓' : '→'}
                {comparison.minutes.percentageChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              vs {Math.floor(comparison.minutes.previous / 60)}h in {currentYear - 1}
            </p>
          </div>
        </div>
      </Card>

      {/* Insights */}
      <InsightsPanel insights={insights} loading={loading} />
    </div>
  );
});
