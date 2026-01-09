import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCategories } from '@/hooks/useCategories';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CategorySelectorProps {
  value?: string;
  onChange: (categoryId: string) => void;
  className?: string;
}

export function CategorySelector({ value, onChange, className }: CategorySelectorProps) {
  const { categories, isLoading, createCategory } = useCategories();
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#8b5cf6',
  });

  const selectedCategory = categories.find((c) => c.id === value);

  const handleCreateCategory = async () => {
    if (!newCategory.name) return;

    const created = await createCategory(newCategory);
    if (created) {
      onChange(created.id);
      setCreateDialogOpen(false);
      setNewCategory({ name: '', description: '', icon: '📁', color: '#8b5cf6' });
    }
  };

  const commonIcons = ['📁', '💪', '📚', '💼', '🧘', '👥', '🎨', '💰', '🏠', '⚡', '🎯', '🌟'];

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
            disabled={isLoading}
          >
            {selectedCategory ? (
              <span className="flex items-center gap-2">
                <span>{selectedCategory.icon}</span>
                <span>{selectedCategory.name}</span>
              </span>
            ) : (
              "Select category..."
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => {
                    onChange(category.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2">{category.icon}</span>
                  <span className="flex-1">{category.name}</span>
                  {category.is_system && (
                    <span className="text-xs text-muted-foreground">System</span>
                  )}
                </CommandItem>
              ))}
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  setCreateDialogOpen(true);
                }}
                className="text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create new category</span>
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Fitness"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Input
                id="category-description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {commonIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewCategory({ ...newCategory, icon })}
                    className={cn(
                      "p-2 text-2xl rounded border hover:border-primary transition-colors",
                      newCategory.icon === icon ? "border-primary bg-primary/10" : "border-border"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="category-color">Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="color"
                  id="category-color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>
            <Button onClick={handleCreateCategory} className="w-full">
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
