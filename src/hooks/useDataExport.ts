import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/safeClient';

/**
 * Hook for exporting user data in various formats
 * Allows users to backup and analyze their data
 */

export function useDataExport() {
  const { toast } = useToast();

  const exportToJSON = async () => {
    try {
      toast({
        title: 'Exporting data...',
        description: 'Please wait while we prepare your data',
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all user data
      const [
        { data: habits },
        { data: goals },
        { data: achievements },
        { data: profile },
        { data: sessionHistory },
      ] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*, tasks(*)').eq('user_id', user.id),
        supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(100),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          username: profile?.username,
        },
        profile,
        habits: habits || [],
        goals: goals || [],
        achievements: achievements || [],
        sessions: sessionHistory || [],
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `starpath-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful!',
        description: 'Your data has been downloaded',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Unable to export data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = async (type: 'habits' | 'goals') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let csvContent = '';
      let filename = '';

      if (type === 'habits') {
        const { data: habits } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id);

        if (!habits || habits.length === 0) {
          toast({
            title: 'No data',
            description: 'No habits to export',
          });
          return;
        }

        // CSV headers
        csvContent = 'Name,Frequency,Streak,Created At,Completed Dates Count\n';

        // CSV rows
        habits.forEach((habit) => {
          const completedCount = Array.isArray(habit.completed_dates) 
            ? habit.completed_dates.length 
            : 0;
          
          csvContent += `"${habit.name}",${habit.frequency},${habit.streak || 0},"${habit.created_at}",${completedCount}\n`;
        });

        filename = `habits-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'goals') {
        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);

        if (!goals || goals.length === 0) {
          toast({
            title: 'No data',
            description: 'No goals to export',
          });
          return;
        }

        csvContent = 'Title,Description,Progress,Deadline,Created At\n';

        goals.forEach((goal) => {
          csvContent += `"${goal.title}","${goal.description || ''}",${goal.progress},"${goal.deadline || ''}","${goal.created_at}"\n`;
        });

        filename = `goals-${new Date().toISOString().split('T')[0]}.csv`;
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful!',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} exported to CSV`,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: 'Export failed',
        description: 'Unable to export CSV. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    exportToJSON,
    exportToCSV,
  };
}
