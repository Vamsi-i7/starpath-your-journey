import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EnhancedMentorChatProps {
  onSendMessage: (message: string, context?: string) => Promise<void>;
  messages: Message[];
  isGenerating: boolean;
}

const SUGGESTED_QUESTIONS = [
  "How can I stay motivated?",
  "What's a good study schedule?",
  "How do I overcome procrastination?",
  "Tips for better focus?",
];

export function EnhancedMentorChat({ onSendMessage, messages, isGenerating }: EnhancedMentorChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { habits } = useHabits();
  const { goals } = useGoals();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    
    // Build context from user's habits and goals
    const contextParts = [];
    
    if (habits.length > 0) {
      const habitNames = habits.map(h => h.name).join(', ');
      contextParts.push(`User's current habits: ${habitNames}`);
    }
    
    if (goals.length > 0) {
      const goalTitles = goals.map(g => g.title).join(', ');
      contextParts.push(`User's current goals: ${goalTitles}`);
    }
    
    const context = contextParts.length > 0 ? contextParts.join('. ') : undefined;
    
    const message = input;
    setInput('');
    await onSendMessage(message, context);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Context Panel */}
      {(habits.length > 0 || goals.length > 0) && (
        <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">AI has context about:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {habits.length > 0 && (
              <span className="bg-primary/10 px-2 py-0.5 rounded">
                {habits.length} habit{habits.length > 1 ? 's' : ''}
              </span>
            )}
            {goals.length > 0 && (
              <span className="bg-accent/10 px-2 py-0.5 rounded">
                {goals.length} goal{goals.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI Mentor</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask me anything about your studies, habits, or goals!
                </p>
              </div>
              
              {/* Suggested Questions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-xs"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className={msg.role === 'user' ? 'bg-primary' : 'bg-accent'}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Message Bubble */}
              <div
                className={`flex-1 max-w-[80%] ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownRenderer content={msg.content} className="text-sm" />
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1 block px-2">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isGenerating && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-accent">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="pt-4 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Ask your AI mentor anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isGenerating}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isGenerating || !input.trim()}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
