import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/safeClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, FileText, BookOpen, Map, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AIGeneration {
  id: string;
  type: string;
  prompt: string | null;
  result: unknown;
  created_at: string;
}

interface FileHistoryProps {
  onSelectGeneration?: (type: string, result: string) => void;
}

export function FileHistory({ onSelectGeneration }: FileHistoryProps) {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<AIGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setGenerations(data);
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, [user]);

  const getTypeIcon = (type: string) => {
    if (type.includes('notes')) return <FileText className="w-4 h-4" />;
    if (type.includes('flashcards')) return <BookOpen className="w-4 h-4" />;
    if (type.includes('roadmap')) return <Map className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getTypeLabel = (type: string) => {
    if (type.includes('notes')) return 'Notes';
    if (type.includes('flashcards')) return 'Flashcards';
    if (type.includes('roadmap')) return 'Roadmap';
    if (type.includes('mentor')) return 'Mentor';
    return type;
  };

  const isFileUpload = (type: string) => type.includes('_from_file');

  const toggleItemExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatResult = (result: unknown): string => {
    if (typeof result === 'string') return result;
    if (Array.isArray(result)) {
      return result.map(item => 
        typeof item === 'object' && item !== null && 'question' in item && 'answer' in item
          ? `Q: ${item.question}\nA: ${item.answer}`
          : JSON.stringify(item)
      ).join('\n\n');
    }
    return JSON.stringify(result, null, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (generations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" />
            Generation History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-primary/10">
                        {getTypeIcon(gen.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {getTypeLabel(gen.type)}
                          </span>
                          {isFileUpload(gen.type) && (
                            <span className="text-xs bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded">
                              File Upload
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(gen.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleItemExpanded(gen.id)}
                    >
                      {expandedItems.has(gen.id) ? 'Hide' : 'View'}
                    </Button>
                  </div>
                  
                  {gen.prompt && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      Prompt: {gen.prompt}
                    </p>
                  )}
                  
                  {expandedItems.has(gen.id) && gen.result && (
                    <div className="mt-3 p-3 rounded bg-background border border-border/30">
                      <pre className="text-xs whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {formatResult(gen.result)}
                      </pre>
                      {onSelectGeneration && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => onSelectGeneration(gen.type, formatResult(gen.result))}
                        >
                          Load Result
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
