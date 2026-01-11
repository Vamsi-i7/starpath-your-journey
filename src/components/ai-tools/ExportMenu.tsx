import { useState } from 'react';
import { Download, FileText, FileDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ExportMenuProps {
  content: string;
  title: string;
  type: 'notes' | 'flashcards' | 'roadmap' | 'mentor' | 'quiz' | 'essay' | 'math' | 'mindmap' | 'summary' | 'language';
}

export function ExportMenu({ content, title, type }: ExportMenuProps) {
  const { profile } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'lifetime';

  const exportAsText = () => {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Exported as TXT');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const exportAsMarkdown = () => {
    try {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-')}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Exported as Markdown');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const exportAsPDF = async () => {
    if (!isPremium) {
      toast.error('PDF export is a premium feature', {
        description: 'Upgrade to premium to export as PDF',
      });
      return;
    }

    setIsExporting(true);
    try {
      const { exportToPDF } = await import('@/lib/pdfExporter');
      await exportToPDF({
        title,
        content,
        type,
      });
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsText}>
          <FileText className="w-4 h-4 mr-2" />
          Export as TXT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown}>
          <FileDown className="w-4 h-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF}>
          <FileDown className="w-4 h-4 mr-2" />
          Export as PDF {!isPremium && '🔒'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
