import { useState, useEffect, useRef } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';

const ChatsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get('user');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(initialUserId);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { isUserOnline } = useOnlinePresence();

  const { chatFriends, messages, isLoading, sendMessage, isSending, friendIsTyping, handleTyping } = useChat(selectedFriendId);

  const selectedFriend = chatFriends.find(f => f.id === selectedFriendId);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update selected friend from URL params
  useEffect(() => {
    if (initialUserId) {
      setSelectedFriendId(initialUserId);
    }
  }, [initialUserId]);

  const handleSend = () => {
    if (!messageInput.trim() || !selectedFriendId) return;
    sendMessage({ receiverId: selectedFriendId, content: messageInput });
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'HH:mm');
    }
    return format(date, 'MMM d, HH:mm');
  };

  const formatLastMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  };

  return (
    <div className="min-h-screen">
      <AppTopbar title="Chats" />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Friends sidebar */}
        <div className="w-80 border-r border-border/30 flex flex-col">
          <div className="p-4 border-b border-border/30">
            <h3 className="font-semibold text-foreground">Conversations</h3>
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : chatFriends.length > 0 ? (
              <div className="p-2 space-y-1">
                {chatFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      setSelectedFriendId(friend.id);
                      setSearchParams({ user: friend.id });
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                      selectedFriendId === friend.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-card/50"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {friend.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isUserOnline(friend.id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{friend.username}</p>
                          {isUserOnline(friend.id) && (
                            <span className="text-xs text-green-500">online</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatLastMessageTime(friend.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {friend.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-2">Add friends to start chatting!</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedFriend ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border/30 flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedFriend.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedFriend.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isUserOnline(selectedFriend.id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{selectedFriend.username}</p>
                    {isUserOnline(selectedFriend.id) && (
                      <span className="text-xs text-green-500">● online</span>
                    )}
                  </div>
                  {friendIsTyping ? (
                    <p className="text-xs text-primary animate-pulse">typing...</p>
                  ) : !isUserOnline(selectedFriend.id) && (
                    <p className="text-xs text-muted-foreground">offline</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card border border-border rounded-bl-md"
                          )}
                        >
                          <p className="break-words">{msg.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {friendIsTyping && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="p-4 border-t border-border/30">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || isSending}
                    size="icon"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;
