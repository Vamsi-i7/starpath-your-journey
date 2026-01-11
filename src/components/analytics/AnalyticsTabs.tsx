import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, TrendingUp, BarChart3, Sun } from 'lucide-react';

interface AnalyticsTabsProps {
  activeTab: 'today' | 'week' | 'month' | 'year';
  onTabChange: (tab: 'today' | 'week' | 'month' | 'year') => void;
  todayView: React.ReactNode;
  weekView: React.ReactNode;
  monthView: React.ReactNode;
  yearView: React.ReactNode;
}

export const AnalyticsTabs = ({
  activeTab,
  onTabChange,
  todayView,
  weekView,
  monthView,
  yearView,
}: AnalyticsTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="w-full">
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <TabsList className="w-full justify-start h-14 bg-transparent px-4 sm:px-6 gap-2">
          <TabsTrigger 
            value="today" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 sm:px-6 transition-all"
          >
            <Sun className="w-4 h-4" />
            <span>Today</span>
          </TabsTrigger>
          <TabsTrigger 
            value="week" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 sm:px-6 transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Week</span>
            <span className="sm:hidden">Week</span>
          </TabsTrigger>
          <TabsTrigger 
            value="month"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 sm:px-6 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Month</span>
            <span className="sm:hidden">Month</span>
          </TabsTrigger>
          <TabsTrigger 
            value="year"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 sm:px-6 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Year</span>
            <span className="sm:hidden">Year</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="p-4 sm:p-6">
        <TabsContent value="today" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
          {todayView}
        </TabsContent>

        <TabsContent value="week" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
          {weekView}
        </TabsContent>

        <TabsContent value="month" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
          {monthView}
        </TabsContent>

        <TabsContent value="year" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
          {yearView}
        </TabsContent>
      </div>
    </Tabs>
  );
};
