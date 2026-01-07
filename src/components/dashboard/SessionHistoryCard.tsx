import { Clock, Sparkles, Timer, Coffee, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSessionHistory, useSessionStats } from '@/hooks/useSessionHistory';
import { format } from 'date-fns';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

function getSessionIcon(type: string) {
  switch (type) {
    case 'pomodoro_work':
      return <Timer className="w-3 h-3" />;
    case 'pomodoro_break':
      return <Coffee className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
}

function getSessionLabel(type: string) {
  switch (type) {
    case 'pomodoro_work':
      return 'Pomodoro';
    case 'pomodoro_break':
      return 'Break';
    default:
      return 'Focus';
  }
}

export function SessionHistoryCard() {
  const { data: sessions, isLoading } = useSessionHistory(10);
  const { data: stats } = useSessionStats();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Session History
        </CardTitle>
        {stats && (
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span>{stats.totalSessions} sessions</span>
            <span>{stats.totalMinutes} min total</span>
            <span className="text-primary">{stats.totalXp} XP earned</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-4">Loading...</div>
        ) : !sessions?.length ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No sessions yet. Start focusing to track your progress!
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={session.session_type === 'pomodoro_break' ? 'secondary' : 'default'} className="gap-1">
                      {getSessionIcon(session.session_type)}
                      {getSessionLabel(session.session_type)}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{formatDuration(session.duration_seconds)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.ended_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    <Sparkles className="w-3 h-3" />
                    +{session.xp_earned} XP
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
