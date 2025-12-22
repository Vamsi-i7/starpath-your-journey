import { AppTopbar } from '@/components/app/AppTopbar';
import { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ChatsPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ id: string; text: string; sender: 'me' | 'them' }[]>([]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), text: message, sender: 'me' }]);
    setMessage('');
  };

  return (
    <div className="min-h-screen">
      <AppTopbar title="Chats" />
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r border-border/30 p-4">
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-2">Add friends to start chatting!</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a conversation to start chatting</p>
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;
