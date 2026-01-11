import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Book,
  Lightbulb,
  Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Correction {
  userText: string;
  corrected: string;
  feedback: string;
  alternativePhrases: string[];
}

interface VocabularyItem {
  word: string;
  meaning: string;
  example: string;
}

interface LanguageMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  corrections?: Correction[];
  vocabulary?: VocabularyItem[];
  timestamp: Date;
}

interface LanguagePracticeProps {
  messages: LanguageMessage[];
  onSendMessage: (message: string, language: string) => void;
  isLoading: boolean;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LANGUAGES = [
  { code: 'spanish', name: 'Spanish', flag: '🇪🇸' },
  { code: 'french', name: 'French', flag: '🇫🇷' },
  { code: 'german', name: 'German', flag: '🇩🇪' },
  { code: 'italian', name: 'Italian', flag: '🇮🇹' },
  { code: 'portuguese', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'japanese', name: 'Japanese', flag: '🇯🇵' },
  { code: 'korean', name: 'Korean', flag: '🇰🇷' },
  { code: 'chinese', name: 'Chinese', flag: '🇨🇳' },
  { code: 'hindi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'arabic', name: 'Arabic', flag: '🇸🇦' },
];

const CONVERSATION_STARTERS = [
  "Introduce yourself",
  "Order food at a restaurant",
  "Ask for directions",
  "Talk about your hobbies",
  "Describe your family",
  "Make a phone call",
];

export function LanguagePractice({ 
  messages, 
  onSendMessage, 
  isLoading, 
  selectedLanguage,
  onLanguageChange 
}: LanguagePracticeProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), selectedLanguage);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedLang = LANGUAGES.find(l => l.code === selectedLanguage);

  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <Card className="border-violet-500/20 bg-violet-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedLang?.flag}</span>
              <div>
                <p className="font-semibold">Practice {selectedLang?.name}</p>
                <p className="text-xs text-muted-foreground">
                  Type in {selectedLang?.name} to practice
                </p>
              </div>
            </div>
            <Select value={selectedLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Starters */}
      {messages.length === 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Conversation Starters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CONVERSATION_STARTERS.map((starter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onSendMessage(starter, selectedLanguage)}
                  className="text-xs"
                >
                  {starter}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Area */}
      <Card className="border-2">
        <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start practicing {selectedLang?.name}!</p>
                <p className="text-sm">Type a message or choose a topic above</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bot className="w-5 h-5" />
                <span className="animate-pulse">Thinking...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type in ${selectedLang?.name}...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-violet-500 to-purple-500"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: LanguageMessage }) {
  const isUser = message.role === 'user';
  const [showVocab, setShowVocab] = useState(false);

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-primary" : "bg-violet-500"
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 space-y-2", isUser && "text-right")}>
        <div className={cn(
          "inline-block p-3 rounded-2xl max-w-[85%]",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-muted rounded-tl-sm"
        )}>
          <p className="text-sm">{message.content}</p>
        </div>

        {/* Corrections */}
        {message.corrections && message.corrections.length > 0 && (
          <div className="space-y-2">
            {message.corrections.map((correction, index) => (
              <Card key={index} className={cn(
                "border-l-4",
                correction.userText === correction.corrected 
                  ? "border-l-green-500 bg-green-500/5" 
                  : "border-l-yellow-500 bg-yellow-500/5"
              )}>
                <CardContent className="p-3 text-left">
                  <div className="flex items-start gap-2">
                    {correction.userText === correction.corrected ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{correction.feedback}</p>
                      {correction.userText !== correction.corrected && (
                        <div className="mt-1">
                          <span className="line-through text-red-500/70">{correction.userText}</span>
                          <span className="mx-2">→</span>
                          <span className="text-green-600 font-medium">{correction.corrected}</span>
                        </div>
                      )}
                      {correction.alternativePhrases.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {correction.alternativePhrases.map((phrase, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {phrase}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Vocabulary */}
        {message.vocabulary && message.vocabulary.length > 0 && (
          <div className="text-left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVocab(!showVocab)}
              className="gap-1 text-xs"
            >
              <Book className="w-3 h-3" />
              {showVocab ? 'Hide' : 'Show'} Vocabulary ({message.vocabulary.length})
            </Button>
            {showVocab && (
              <div className="mt-2 space-y-2">
                {message.vocabulary.map((vocab, index) => (
                  <Card key={index} className="border-blue-500/20 bg-blue-500/5">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-blue-600">{vocab.word}</p>
                          <p className="text-sm text-muted-foreground">{vocab.meaning}</p>
                          <p className="text-xs italic mt-1">"{vocab.example}"</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={cn("text-xs text-muted-foreground", isUser && "text-right")}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default LanguagePractice;
