import { useState } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useLibrary, LibraryItem } from '@/hooks/useLibrary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  BookOpen,
  Map,
  MessageCircle,
  Search,
  Trash2,
  Pin,
  Calendar,
  Tag,
  Loader2,
  Download,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MarkdownRenderer } from '@/components/ai-tools/MarkdownRenderer';
import { FlipCard } from '@/components/ai-tools/FlipCard';
import { RoadmapGraph } from '@/components/ai-tools/RoadmapGraph';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const TOOL_ICONS = {
  notes: FileText,
  flashcards: BookOpen,
  roadmap: Map,
  mentor: MessageCircle,
};

const TOOL_COLORS = {
  notes: 'bg-blue-500/10 text-blue-500',
  flashcards: 'bg-purple-500/10 text-purple-500',
  roadmap: 'bg-green-500/10 text-green-500',
  mentor: 'bg-orange-500/10 text-orange-500',
};

export default function LibraryPage() {
  const { items, isLoading, deleteItem, togglePin } = useLibrary();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<LibraryItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'lifetime';

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || item.tool_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteItem(deleteId);
      setDeleteId(null);
    }
  };

  const handleExportPDF = async (item: LibraryItem) => {
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
        title: item.title,
        content: item.raw_content || JSON.stringify(item.content),
        type: item.tool_type,
      });
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const renderContent = (item: LibraryItem) => {
    switch (item.tool_type) {
      case 'notes':
        return <MarkdownRenderer content={item.raw_content || ''} />;
      case 'flashcards':
        const flashcards = Array.isArray(item.content) ? item.content : [];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcards.map((card: any, index: number) => (
              <FlipCard key={index} question={card.question} answer={card.answer} index={index} />
            ))}
          </div>
        );
      case 'roadmap':
        return <RoadmapGraph content={item.raw_content || ''} />;
      case 'mentor':
        return <MarkdownRenderer content={item.raw_content || ''} />;
      default:
        return <p className="text-muted-foreground">No preview available</p>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <AppTopbar title="Library" />
        <div className="p-4 sm:p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AppTopbar title="Library" />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">My AI Library</h1>
          <p className="text-muted-foreground">
            All your saved AI-generated content in one place
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              variant={filterType === 'notes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('notes')}
            >
              <FileText className="w-4 h-4 mr-1" />
              Notes
            </Button>
            <Button
              variant={filterType === 'flashcards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('flashcards')}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Cards
            </Button>
            <Button
              variant={filterType === 'roadmap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('roadmap')}
            >
              <Map className="w-4 h-4 mr-1" />
              Roadmap
            </Button>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterType !== 'all'
                  ? 'No items found'
                  : 'No saved items yet. Generate content in AI Tools and save it here!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const Icon = TOOL_ICONS[item.tool_type];
              const daysUntilDelete = item.delete_at
                ? Math.ceil(
                    (new Date(item.delete_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                : null;

              return (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setViewItem(item)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${TOOL_COLORS[item.tool_type]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{item.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(item.id, item.is_pinned);
                        }}
                      >
                        <Pin
                          className={`w-4 h-4 ${item.is_pinned ? 'fill-primary text-primary' : ''}`}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Delete warning */}
                    {daysUntilDelete && daysUntilDelete <= 7 && (
                      <div className="flex items-center gap-2 text-xs text-orange-500">
                        <Calendar className="w-3 h-3" />
                        Deletes in {daysUntilDelete} day{daysUntilDelete > 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewItem(item);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportPDF(item);
                        }}
                        disabled={isExporting}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(item.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = TOOL_ICONS[viewItem.tool_type];
                    return <Icon className="w-5 h-5" />;
                  })()}
                  {viewItem.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">{renderContent(viewItem)}</div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item from your
              library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
