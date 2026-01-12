import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileJson, FileText, Loader2 } from 'lucide-react';
import { useDataExport } from '@/hooks/useDataExport';

export function ExportDataSection() {
  const { exportToJSON, exportToCSV } = useDataExport();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    await exportToJSON();
    setIsExporting(false);
  };

  const handleExportHabitsCSV = async () => {
    setIsExporting(true);
    await exportToCSV('habits');
    setIsExporting(false);
  };

  const handleExportGoalsCSV = async () => {
    setIsExporting(true);
    await exportToCSV('goals');
    setIsExporting(false);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Export Your Data
          </h3>
          <p className="text-sm text-muted-foreground">
            Download your habits, goals, and progress data for backup or analysis
          </p>
        </div>

        <div className="space-y-3">
          {/* Export All Data as JSON */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileJson className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Complete Data (JSON)</p>
                <p className="text-xs text-muted-foreground">
                  All your data including habits, goals, achievements
                </p>
              </div>
            </div>
            <Button
              onClick={handleExportJSON}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>

          {/* Export Habits CSV */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">Habits (CSV)</p>
                <p className="text-xs text-muted-foreground">
                  Spreadsheet-compatible format for habits data
                </p>
              </div>
            </div>
            <Button
              onClick={handleExportHabitsCSV}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>

          {/* Export Goals CSV */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-xp/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-xp" />
              </div>
              <div>
                <p className="font-medium text-foreground">Goals (CSV)</p>
                <p className="text-xs text-muted-foreground">
                  Spreadsheet-compatible format for goals data
                </p>
              </div>
            </div>
            <Button
              onClick={handleExportGoalsCSV}
              disabled={isExporting}
              variant="outline"
              size="sm"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Exported data is downloaded directly to your device. 
            We don't send it anywhere else. Keep your backup safe!
          </p>
        </div>
      </div>
    </Card>
  );
}
