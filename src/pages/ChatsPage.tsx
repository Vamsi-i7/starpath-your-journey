import { AppTopbar } from '@/components/app/AppTopbar';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';

const ChatsPage = () => {
  const { friends } = useApp();
  const [selectedFriend, setSelectedFriend] = useState(friends[0] || null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ id: string; text: string; sender: 'me' | 'them' }[]>([
    { id: '1', text: 'Hey! How are your habits going?', sender: 'them' },
    { id: '2', text: 'Great! Just completed my morning routine 🎉', sender: 'me' },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), text: message, sender: 'me' }]);
    setMessage('');
  };

  return (
    <div className="min-h-screen">
      <AppTopbar title="Chats" />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-border/30 p-4 space-y-2">
          {friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => setSelectedFriend(friend)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${selectedFriend?.id === friend.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-card/50'}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center font-bold text-foreground">
                {friend.username.charAt(0)}
              </div>
              <span className="font-medium text-foreground">{friend.username}</span>
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedFriend && (
            <>
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold text-foreground">{selectedFriend.username}</h3>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/30 text-foreground'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border/30 flex gap-2">
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Send className="w-5 h-5" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;
