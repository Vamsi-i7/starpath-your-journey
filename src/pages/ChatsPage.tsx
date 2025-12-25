import { useState, useEffect, useRef } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { Send, MessageCircle, Loader2, Users, Plus, Globe, Lock, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useChat } from '@/hooks/useChat';
import { useGroupChat } from '@/hooks/useGroupChat';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';

const ChatsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get('user');
  const initialGroupId = searchParams.get('group');
  
  const [chatType, setChatType] = useState<'direct' | 'groups'>(initialGroupId ? 'groups' : 'direct');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(initialUserId);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId);
  const [messageInput, setMessageInput] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { isUserOnline } = useOnlinePresence();

  const { chatFriends, messages: directMessages, isLoading: directLoading, sendMessage: sendDirectMessage, isSending: directSending, friendIsTyping, handleTyping } = useChat(selectedFriendId);
  const { 
    groups, 
    publicGroups, 
    members: groupMembers,
    messages: groupMessages, 
    isLoading: groupsLoading, 
    createGroup, 
    isCreating,
    joinGroup,
    isJoining,
    leaveGroup,
    sendMessage: sendGroupMessage, 
    isSending: groupSending 
  } = useGroupChat(selectedGroupId);

  const selectedFriend = chatFriends.find(f => f.id === selectedFriendId);
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages, groupMessages]);

  // Update selected from URL params
  useEffect(() => {
    if (initialUserId) {
      setChatType('direct');
      setSelectedFriendId(initialUserId);
    }
    if (initialGroupId) {
      setChatType('groups');
      setSelectedGroupId(initialGroupId);
    }
  }, [initialUserId, initialGroupId]);

  const handleSendDirect = () => {
    if (!messageInput.trim() || !selectedFriendId) return;
    sendDirectMessage({ receiverId: selectedFriendId, content: messageInput });
    setMessageInput('');
  };

  const handleSendGroup = () => {
    if (!messageInput.trim() || !selectedGroupId) return;
    sendGroupMessage({ groupId: selectedGroupId, content: messageInput });
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatType === 'direct') {
        handleSendDirect();
      } else {
        handleSendGroup();
      }
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    createGroup({ 
      name: newGroupName, 
      description: newGroupDescription, 
      isPublic: newGroupIsPublic 
    });
    setIsCreateGroupOpen(false);
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupIsPublic(false);
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'HH:mm');
    return format(date, 'MMM d, HH:mm');
  };

  const formatLastMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  return (
    <div className="min-h-screen">
      <AppTopbar title="Chats" />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-border/30 flex flex-col">
          <Tabs value={chatType} onValueChange={(v) => setChatType(v as 'direct' | 'groups')} className="flex flex-col h-full">
            <div className="p-4 border-b border-border/30">
              <TabsList className="w-full">
                <TabsTrigger value="direct" className="flex-1 gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Direct
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex-1 gap-2">
                  <Users className="w-4 h-4" />
                  Groups
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="direct" className="flex-1 m-0">
              <ScrollArea className="h-full">
                {directLoading ? (
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
                          setSelectedGroupId(null);
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
                            <p className="font-medium text-foreground truncate">{friend.username}</p>
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
            </TabsContent>

            <TabsContent value="groups" className="flex-1 m-0 flex flex-col">
              <div className="p-2 border-b border-border/30">
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter group name..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-desc">Description (optional)</Label>
                        <Input
                          id="group-desc"
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                          placeholder="Enter description..."
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <Label htmlFor="is-public">Public Group</Label>
                        </div>
                        <Switch
                          id="is-public"
                          checked={newGroupIsPublic}
                          onCheckedChange={setNewGroupIsPublic}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {newGroupIsPublic 
                          ? "Anyone can find and join this group" 
                          : "Only invited members can join"}
                      </p>
                      <Button onClick={handleCreateGroup} disabled={isCreating || !newGroupName.trim()} className="w-full">
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="flex-1">
                {groupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="p-2 space-y-4">
                    {/* My Groups */}
                    {groups.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground px-2 mb-2">MY GROUPS</p>
                        <div className="space-y-1">
                          {groups.map((group) => (
                            <button
                              key={group.id}
                              onClick={() => {
                                setSelectedGroupId(group.id);
                                setSelectedFriendId(null);
                                setSearchParams({ group: group.id });
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                                selectedGroupId === group.id
                                  ? "bg-primary/10 border border-primary/30"
                                  : "hover:bg-card/50"
                              )}
                            >
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {group.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground truncate">{group.name}</p>
                                  {group.is_public ? (
                                    <Globe className="w-3 h-3 text-muted-foreground" />
                                  ) : (
                                    <Lock className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Public Groups */}
                    {publicGroups.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground px-2 mb-2">DISCOVER</p>
                        <div className="space-y-1">
                          {publicGroups.map((group) => (
                            <div
                              key={group.id}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-card/50"
                            >
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-muted text-muted-foreground">
                                  {group.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{group.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => joinGroup(group.id)}
                                disabled={isJoining}
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {groups.length === 0 && publicGroups.length === 0 && (
                      <div className="text-center py-12 px-4">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No groups yet</p>
                        <p className="text-sm text-muted-foreground mt-2">Create a group to chat with multiple friends!</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {chatType === 'direct' && selectedFriend ? (
            <>
              {/* Direct Chat Header */}
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

              {/* Direct Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {directMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card border border-border rounded-bl-md"
                          )}
                        >
                          <p className="break-words">{msg.content}</p>
                          <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
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

              {/* Direct Message Input */}
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
                    disabled={directSending}
                  />
                  <Button onClick={handleSendDirect} disabled={!messageInput.trim() || directSending} size="icon">
                    {directSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : chatType === 'groups' && selectedGroup ? (
            <>
              {/* Group Chat Header */}
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {selectedGroup.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{selectedGroup.name}</p>
                      {selectedGroup.is_public ? (
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => leaveGroup(selectedGroup.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave
                </Button>
              </div>

              {/* Group Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {groupMessages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn("flex gap-2", isMe && "flex-row-reverse")}>
                          {!isMe && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={msg.sender?.avatar_url || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                {msg.sender?.username?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-card border border-border rounded-bl-md"
                            )}
                          >
                            {!isMe && (
                              <p className="text-xs font-medium text-primary mb-1">
                                {msg.sender?.username || 'Unknown'}
                              </p>
                            )}
                            <p className="break-words">{msg.content}</p>
                            <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Group Message Input */}
              <div className="p-4 border-t border-border/30">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={groupSending}
                  />
                  <Button onClick={handleSendGroup} disabled={!messageInput.trim() || groupSending} size="icon">
                    {groupSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {chatType === 'direct' 
                  ? 'Select a conversation to start chatting' 
                  : 'Select or create a group to start chatting'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;
