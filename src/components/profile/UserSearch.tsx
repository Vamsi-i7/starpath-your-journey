import { useState } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useUserSearch } from '@/hooks/useUserSearch';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface UserSearchProps {
  onSelectUser?: (userId: string) => void;
  showAddFriend?: boolean;
}

export function UserSearch({ onSelectUser, showAddFriend = false }: UserSearchProps) {
  const { results, isSearching, debouncedSearch, clearResults } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      debouncedSearch(value);
    } else {
      clearResults();
    }
  };

  const handleUserClick = (userId: string) => {
    if (onSelectUser) {
      onSelectUser(userId);
    } else {
      // Navigate to user profile
      navigate(`/app/profile?user=${userId}`);
    }
    setSearchTerm('');
    clearResults();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by username..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results Dropdown */}
      {results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-[400px] overflow-y-auto">
          <div className="p-2 space-y-1">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className={cn(
                  "w-full p-3 rounded-lg hover:bg-muted transition-colors",
                  "flex items-center gap-3 text-left"
                )}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>
                    {user.username?.[0]?.toUpperCase() || user.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {user.display_name}
                    </p>
                    {user.is_premium && (
                      <Badge variant="secondary" className="text-xs">
                        {user.premium_tier === 'pro' ? '👑 Pro' : '⭐ Premium'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Lv. {user.level}
                  </Badge>
                  {showAddFriend && (
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* No Results */}
      {searchTerm.length >= 2 && !isSearching && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 p-6 text-center">
          <p className="text-sm text-muted-foreground">No users found</p>
        </Card>
      )}
    </div>
  );
}
