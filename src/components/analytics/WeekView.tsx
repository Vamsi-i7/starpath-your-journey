import { useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { MetricCard } from './MetricCard';
import { InsightsPanel } from './InsightsPanel';
import { SkeletonChart, SkeletonMetricCard } from '@/components/ui/skeleton-loader';
import { CheckCircle2, Zap, Clock, Target, TrendingUp, Award } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { DailyMetrics, ComparisonMetrics } from '@/hooks/useAnalyticsData';

interface WeekViewProps {
  dailyData: DailyMetrics[];
  comparison: {
    habits: ComparisonMetrics;
    xp: ComparisonMetrics;
    minutes: ComparisonMetrics;
  };
  insights: any[];
  loading?: boolean;
}

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#faf5ff'];
const DAY_COLORS = {
  Mon: '#8b5cf6',
  Tue: '#a78bfa',
  Wed: '#c4b5fd',
  Thu: '#ddd6fe',
  Fri: '#ede9fe',
  Sat: '#f5f3ff',
  Sun: '#faf5ff',
};

export const WeekView = memo(({ dailyData, comparison, insights, loading = false }: WeekViewProps) => {
  // Calculate summary metrics
  const summary = useMemo(() => {
    const totalHabits = dailyData.reduce((sum, d) => sum + d.habitsCompleted, 0);
    const totalXp = dailyData.reduce((sum, d) => sum + d.xpEarned, 0);
    const totalMinutes = dailyData.reduce((sum, d) => sum + d.sessionMinutes, 0);
    const avgPerDay = totalHabits / 7;
    
    const bestDay = dailyData.reduce((best, day) => 
      day.habitsCompleted > best.habitsCompleted ? day : best
    );
    
    const worstDay = dailyData.reduce((worst, day) => 
      day.habitsCompleted < worst.habitsCompleted ? day : worst
    );

    return {
      totalHabits,
      totalXp,
      totalMinutes,
      avgPerDay,
      bestDay,
      worstDay,
    };
  }, [dailyData]);

  // Format data for charts
  const chartData = useMemo(() => {
    return dailyData.map(d => ({
      name: format(parseISO(d.date), 'EEE'),
      fullDate: format(parseISO(d.date), 'MMM dd'),
      habits: d.habitsCompleted,
      xp: d.xpEarned,
      minutes: d.sessionMinutes,
      completionRate: d.completionRate,
    }));
  }, [dailyData]);

  // Pie chart data for daily distribution
  const pieData = useMemo(() => {
    return dailyData.map(d => ({
      name: format(parseISO(d.date), 'EEE'),
      value: d.habitsCompleted,
    })).filter(d => d.value > 0);
  }, [dailyData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{payload[0]?.payload?.fullDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Week Summary Cards */}
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
          subtitle={`${(summary.totalXp / 7).toFixed(0)} per day`}
          color="text-amber-500"
          trend="positive"
        />
        <MetricCard
          title="Active Time"
          value={`${Math.floor(summary.totalMinutes / 60)}h ${summary.totalMinutes % 60}m`}
          icon={Clock}
          change={{
            value: comparison.minutes.percentageChange,
            direction: comparison.minutes.direction,
          }}
          subtitle={`${(summary.totalMinutes / 7).toFixed(0)} min/day`}
          color="text-blue-500"
          trend="positive"
        />
        <MetricCard
          title="Best Day"
          value={summary.bestDay.habitsCompleted}
          icon={Award}
          subtitle={format(parseISO(summary.bestDay.date), 'EEE, MMM dd')}
          color="text-purple-500"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance Line Chart */}
        <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Daily Performance</h3>
            <p className="text-xs text-muted-foreground">Habits completed per day</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHabits" x1="0" y1="0" x2="0" y2="1">
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
                stroke="#888"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="habits"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#colorHabits)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart - Multiple Metrics */}
        <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Metrics Comparison</h3>
            <p className="text-xs text-muted-foreground">XP and active time by day</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
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
              <Bar 
                dataKey="xp" 
                fill="#f59e0b" 
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
              <Bar 
                dataKey="minutes" 
                fill="#3b82f6" 
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Daily Distribution and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart - Daily Distribution */}
        <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm lg:col-span-1">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Daily Distribution</h3>
            <p className="text-xs text-muted-foreground">Habits completed by day</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-sm">{payload[0].name}</p>
                          <p className="text-xs text-primary">
                            {payload[0].value} habits ({((payload[0].value as number / summary.totalHabits) * 100).toFixed(1)}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No habits completed this week
            </div>
          )}
        </Card>

        {/* Insights Panel */}
        <div className="lg:col-span-2">
          <InsightsPanel insights={insights} loading={loading} />
        </div>
      </div>

      {/* Day-by-Day Breakdown Table */}
      <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Day-by-Day Breakdown</h3>
          <p className="text-xs text-muted-foreground">Detailed daily metrics</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Day</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Habits</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">XP</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">vs Prev</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((day, index) => {
                const prevDay = index > 0 ? chartData[index - 1] : null;
                const change = prevDay ? ((day.habits - prevDay.habits) / Math.max(prevDay.habits, 1)) * 100 : 0;
                
                return (
                  <tr 
                    key={day.name} 
                    className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-sm">{day.name}</p>
                        <p className="text-xs text-muted-foreground">{day.fullDate}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-foreground">{day.habits}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-amber-500 font-medium">{day.xp}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-blue-500 font-medium">{day.minutes}m</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {index > 0 && (
                        <span className={`text-xs font-medium ${
                          change > 0 ? 'text-emerald-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {change > 0 ? '+' : ''}{change.toFixed(0)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
});
