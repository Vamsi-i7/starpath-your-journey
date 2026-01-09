import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTemplates } from '@/hooks/useTemplates';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { HabitTemplate } from '@/hooks/useTemplates';

interface TemplateBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: HabitTemplate) => void;
}

export function TemplateBrowser({ open, onOpenChange, onSelectTemplate }: TemplateBrowserProps) {
  const { templates, isLoading, fetchTemplates } = useTemplates();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: HabitTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Habit Templates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedCategory(null);
                fetchTemplates();
              }}
            >
              All
            </Button>
            {categories.filter(c => c.is_system).map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(category.id);
                  fetchTemplates(category.id);
                }}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No templates found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      "hover:border-primary hover:shadow-md",
                      "bg-card"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${template.color}20` }}
                      >
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            <span className="mr-1">{template.category_name}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: template.difficulty }).map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 fill-current text-yellow-500" />
                              ))}
                            </div>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            +{template.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
