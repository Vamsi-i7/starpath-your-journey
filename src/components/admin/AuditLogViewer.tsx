import { AuditLogEntry } from '@/hooks/useAdminUserManagement';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Coins, 
  CreditCard, 
  Ban, 
  CheckCircle,
  User
} from 'lucide-react';

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
  isLoading: boolean;
}

export function AuditLogViewer({ logs, isLoading }: AuditLogViewerProps) {
  const getActionIcon = (action: string) => {
    if (action.includes('credit')) return <Coins className="w-4 h-4" />;
    if (action.includes('subscription')) return <CreditCard className="w-4 h-4" />;
    if (action.includes('status') || action.includes('disable')) return <Ban className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('grant') || action.includes('enable')) return 'bg-green-500';
    if (action.includes('deduct') || action.includes('disable') || action.includes('suspend')) return 'bg-red-500';
    if (action.includes('subscription')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const formatValue = (value: any) => {
    if (!value) return 'N/A';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No audit logs found</p>
        <p className="text-sm text-muted-foreground mt-1">Admin actions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <Card key={log.id} className="border-l-4" style={{ borderLeftColor: getActionColor(log.action).replace('bg-', '') }}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getActionIcon(log.action)}
                <div>
                  <CardTitle className="text-base">
                    {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    by {log.admin_email}
                  </CardDescription>
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {log.target_user_email && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Target:</span>
                <span className="font-medium">{log.target_user_email}</span>
              </div>
            )}

            {log.before_value && Object.keys(log.before_value).length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Before:</span>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {formatValue(log.before_value)}
                </pre>
              </div>
            )}

            {log.after_value && Object.keys(log.after_value).length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">After:</span>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {formatValue(log.after_value)}
                </pre>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs">
                {log.entity_type}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
