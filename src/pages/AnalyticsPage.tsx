import { AppTopbar } from '@/components/app/AppTopbar';
import { useHabits } from '@/hooks/useHabits';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AnalyticsPage = () => {
  const { habits, getTodayString } = useHabits();
  const today = getTodayString();

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const completed = habits.filter(h => h.completedDates.includes(dateStr)).length;
    return { day: date.toLocaleDateString('en', { weekday: 'short' }), completed, total: habits.length };
  });

  const streakData = habits.map(h => ({ name: h.name.slice(0, 10), streak: h.streak }));
  
  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
  const pieData = [
    { name: 'Completed', value: completedToday },
    { name: 'Remaining', value: habits.length - completedToday },
  ];
  const COLORS = ['hsl(160, 80%, 45%)', 'hsl(220, 15%, 30%)'];

  return (
    <div className="min-h-screen">
      <AppTopbar title="Analytics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border/30">
            <h3 className="font-semibold text-foreground mb-4">Weekly Completion</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis dataKey="day" stroke="hsl(220, 10%, 50%)" />
                <YAxis stroke="hsl(220, 10%, 50%)" />
                <Tooltip contentStyle={{ background: 'hsl(230, 25%, 12%)', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="completed" fill="hsl(250, 85%, 65%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/30">
            <h3 className="font-semibold text-foreground mb-4">Today's Progress</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(230, 25%, 12%)', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/30 lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">Streak Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={streakData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis dataKey="name" stroke="hsl(220, 10%, 50%)" />
                <YAxis stroke="hsl(220, 10%, 50%)" />
                <Tooltip contentStyle={{ background: 'hsl(230, 25%, 12%)', border: 'none', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="streak" stroke="hsl(35, 95%, 55%)" strokeWidth={3} dot={{ fill: 'hsl(35, 95%, 55%)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
