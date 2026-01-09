import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLibrary } from '@/hooks/useLibrary';

interface SaveButtonProps {
  content: any;
  rawContent?: string;
  toolType: 'notes' | 'flashcards' | 'roadmap' | 'mentor';
  defaultTitle?: string;
}

export function SaveButton({ content, rawContent, toolType, defaultTitle }: SaveButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle || '');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { saveItem } = useLibrary();

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
    await saveItem(toolType, title, content, rawContent, tagArray);
    setIsSaving(false);
    setOpen(false);
    setTitle('');
    setTags('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save to Library
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to Library</DialogTitle>
          <DialogDescription>
            Give this {toolType} a title and optionally add tags
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Give it a memorable title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="e.g. biology, exam, chapter-5"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save to Library
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
