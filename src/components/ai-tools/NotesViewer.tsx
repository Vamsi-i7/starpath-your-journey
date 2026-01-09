import { useState, useMemo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChevronRight, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotesViewerProps {
  content: string;
}

interface TOCItem {
  level: number;
  text: string;
  id: string;
}

export function NotesViewer({ content }: NotesViewerProps) {
  const [showTOC, setShowTOC] = useState(true);

  // Extract table of contents from markdown
  const toc = useMemo(() => {
    const items: TOCItem[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        items.push({ level, text, id });
      }
    });
    
    return items;
  }, [content]);

  // Add IDs to headings in content for smooth scrolling
  const contentWithIds = useMemo(() => {
    let result = content;
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const text = match[2].trim();
        const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        // We'll handle IDs in the renderer component
      }
    });
    
    return result;
  }, [content]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // If no headings, just show content
  if (toc.length === 0) {
    return <MarkdownRenderer content={content} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Table of Contents - Collapsible on mobile */}
      <div className={`lg:col-span-1 ${showTOC ? 'block' : 'hidden lg:block'}`}>
        <div className="sticky top-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <List className="w-4 h-4" />
              Table of Contents
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowTOC(false)}
            >
              Hide
            </Button>
          </div>
          
          <ScrollArea className="h-[400px] rounded-lg border p-4">
            <nav className="space-y-1">
              {toc.map((item, index) => (
                <button
                  key={index}
                  onClick={() => scrollToHeading(item.id)}
                  className={`
                    w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors
                    ${item.level === 1 ? 'font-semibold' : ''}
                    ${item.level === 2 ? 'ml-3' : ''}
                    ${item.level === 3 ? 'ml-6 text-muted-foreground' : ''}
                    ${item.level >= 4 ? 'ml-9 text-xs text-muted-foreground' : ''}
                  `}
                >
                  <span className="flex items-center gap-1">
                    {item.level > 1 && <ChevronRight className="w-3 h-3 opacity-50" />}
                    {item.text}
                  </span>
                </button>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </div>

      {/* Content */}
      <div className="lg:col-span-3">
        {!showTOC && (
          <Button
            variant="outline"
            size="sm"
            className="mb-4 lg:hidden"
            onClick={() => setShowTOC(true)}
          >
            <List className="w-4 h-4 mr-2" />
            Show TOC
          </Button>
        )}
        
        <div className="prose-headings:scroll-mt-20">
          <MarkdownRenderer content={contentWithIds} />
        </div>
      </div>
    </div>
  );
}
