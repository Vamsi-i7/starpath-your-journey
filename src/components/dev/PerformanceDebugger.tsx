import { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/performanceMonitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, AlertTriangle, TrendingUp, Zap, X } from 'lucide-react';

/**
 * Performance Debugger Component
 * Shows real-time performance metrics in development
 */
export function PerformanceDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<any>({});
  const [coreWebVitals, setCoreWebVitals] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary());
      setCoreWebVitals(performanceMonitor.getCoreWebVitals());
      setAlerts(performanceMonitor.getAlerts(10));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!import.meta.env.DEV) return null;

  const getCoreWebVitalStatus = (metric: string, value: number | undefined) => {
    if (!value) return 'neutral';
    
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'neutral';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        size="sm"
        variant="secondary"
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>

      {/* Debugger Panel */}
      {isOpen && (
        <Card className="fixed bottom-16 right-4 z-50 w-96 max-h-[600px] shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Core Web Vitals */}
            <div>
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Core Web Vitals
              </h3>
              <div className="space-y-2">
                {['lcp', 'fid', 'cls'].map((metric) => {
                  const value = coreWebVitals[metric];
                  const status = getCoreWebVitalStatus(metric, value);
                  return (
                    <div key={metric} className="flex items-center justify-between text-xs">
                      <span className="font-mono uppercase">{metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {value ? value.toFixed(2) : 'N/A'}
                          {metric === 'cls' ? '' : 'ms'}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Summary */}
            <div>
              <h3 className="text-xs font-semibold mb-2">Metrics Summary</h3>
              <ScrollArea className="h-40">
                <div className="space-y-1">
                  {Object.entries(summary).map(([name, stats]: [string, any]) => (
                    <div key={name} className="text-xs p-2 rounded bg-muted/50">
                      <div className="font-mono font-medium mb-1">{name}</div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                        <div>Avg: {stats.avg.toFixed(0)}ms</div>
                        <div>Max: {stats.max.toFixed(0)}ms</div>
                        <div>Count: {stats.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                  Recent Alerts
                </h3>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {alerts.map((alert, idx) => (
                      <div key={idx} className="text-xs p-2 rounded bg-destructive/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-medium">{alert.metric}</span>
                          <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {alert.type}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Expected: &lt;{alert.threshold}ms | Actual: {alert.actual.toFixed(0)}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const data = performanceMonitor.exportMetrics();
                  console.log('Performance Metrics:', data);
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `performance-metrics-${Date.now()}.json`;
                  a.click();
                }}
                className="flex-1 text-xs"
              >
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  performanceMonitor.clear();
                  setSummary({});
                  setAlerts([]);
                }}
                className="flex-1 text-xs"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
