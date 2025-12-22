import { Bell, Trophy, UserPlus, MessageCircle, Clock, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'achievement':
      return <Trophy className="w-4 h-4 text-star" />;
    case 'friend_request':
      return <UserPlus className="w-4 h-4 text-primary" />;
    case 'message':
      return <MessageCircle className="w-4 h-4 text-xp" />;
    case 'habit_reminder':
      return <Clock className="w-4 h-4 text-streak" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getNotificationRoute = (notification: Notification): string | null => {
  switch (notification.type) {
    case 'achievement':
      return '/app/achievements';
    case 'friend_request':
      return '/app/friends';
    case 'message':
      return '/app/chats';
    default:
      return null;
  }
};

export function NotificationDropdown() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-popover border-border">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    markAllAsRead();
                  }}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Read all
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  clearAll();
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer focus:bg-accent/10",
                  !notification.is_read && "bg-primary/5"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    !notification.is_read ? "font-semibold text-foreground" : "text-foreground"
                  )}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
