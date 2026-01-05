import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AppTopbar } from '@/components/app/AppTopbar';
import { useSubscription } from '@/hooks/useSubscription';
import { useAIGenerate } from '@/hooks/useAIGenerate';
import { Lock, FileText, BookOpen, Map, MessageCircle, Loader2, Sparkles, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FileUploadZone } from '@/components/ai-tools/FileUploadZone';

const AIToolsPage = () => {
  const { isPremium, isLoading: subLoading } = useSubscription();
  const { generate, isGenerating } = useAIGenerate();
  const navigate = useNavigate();
  
  const [notesPrompt, setNotesPrompt] = useState('');
  const [notesResult, setNotesResult] = useState('');
  const [notesFileData, setNotesFileData] = useState<string | null>(null);
  const [notesFileName, setNotesFileName] = useState<string | null>(null);
  
  const [flashcardsPrompt, setFlashcardsPrompt] = useState('');
  const [flashcards, setFlashcards] = useState<{ question: string; answer: string }[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [flashcardsFileData, setFlashcardsFileData] = useState<string | null>(null);
  const [flashcardsFileName, setFlashcardsFileName] = useState<string | null>(null);
  
  const [roadmapPrompt, setRoadmapPrompt] = useState('');
  const [roadmapResult, setRoadmapResult] = useState('');
  const [roadmapFileData, setRoadmapFileData] = useState<string | null>(null);
  const [roadmapFileName, setRoadmapFileName] = useState<string | null>(null);
  
  const [mentorMessages, setMentorMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [mentorInput, setMentorInput] = useState('');

  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <AppTopbar title="AI Tools" />
        <div className="p-4 sm:p-6">
          <Card className="max-w-lg mx-auto text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Premium Feature</CardTitle>
              <CardDescription>
                AI Tools are available exclusively to premium subscribers. Unlock notes generator, flashcard creator, learning roadmaps, and AI mentor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/app/subscription')} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleGenerateNotes = async () => {
    if (!notesPrompt.trim() && !notesFileData) return;
    const type = notesFileData ? 'notes_from_file' : 'notes';
    const result = await generate(type, notesPrompt || 'Generate comprehensive notes from this document', undefined, notesFileData || undefined);
    if (result) setNotesResult(result);
  };

  const handleGenerateFlashcards = async () => {
    if (!flashcardsPrompt.trim() && !flashcardsFileData) return;
    const type = flashcardsFileData ? 'flashcards_from_file' : 'flashcards';
    const result = await generate(type, flashcardsPrompt || 'Generate flashcards from this document', undefined, flashcardsFileData || undefined);
    if (result) {
      try {
        const parsed = JSON.parse(result);
        setFlashcards(parsed);
        setFlippedCards(new Set());
      } catch {
        // If parsing fails, try to extract JSON from the response
        const match = result.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            setFlashcards(parsed);
            setFlippedCards(new Set());
          } catch {
            console.error('Failed to parse flashcards');
          }
        }
      }
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!roadmapPrompt.trim() && !roadmapFileData) return;
    const type = roadmapFileData ? 'roadmap_from_file' : 'roadmap';
    const result = await generate(type, roadmapPrompt || 'Create a learning roadmap from this document', undefined, roadmapFileData || undefined);
    if (result) setRoadmapResult(result);
  };

  const handleSendMentor = async () => {
    if (!mentorInput.trim()) return;
    const userMessage = mentorInput;
    setMentorInput('');
    setMentorMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    const context = mentorMessages.map(m => `${m.role}: ${m.content}`).join('\n');
    const result = await generate('mentor', userMessage, context);
    if (result) {
      setMentorMessages(prev => [...prev, { role: 'assistant', content: result }]);
    }
  };

  const toggleCard = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AppTopbar title="AI Tools" />
      
      <div className="p-4 sm:p-6">
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Flashcards</span>
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-2">
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Roadmap</span>
            </TabsTrigger>
            <TabsTrigger value="mentor" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Mentor</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Notes Generator
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    + File Upload
                  </span>
                </CardTitle>
                <CardDescription>Generate comprehensive study notes from text or upload a document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUploadZone
                  onFileContent={(content, fileName) => {
                    setNotesFileData(content);
                    setNotesFileName(fileName);
                  }}
                  isProcessing={isGenerating}
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or enter a topic</span>
                  </div>
                </div>
                <Textarea
                  placeholder="Enter a topic or subject to generate notes (e.g., 'Photosynthesis in plants' or 'World War II causes')"
                  value={notesPrompt}
                  onChange={(e) => setNotesPrompt(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleGenerateNotes} disabled={isGenerating || (!notesPrompt.trim() && !notesFileData)}>
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {notesFileData ? 'Generate Notes from File' : 'Generate Notes'}
                </Button>
                {notesResult && (
                  <div className="mt-4 p-4 bg-muted rounded-lg prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap text-sm">{notesResult}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flashcards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Flashcards Generator
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    + File Upload
                  </span>
                </CardTitle>
                <CardDescription>Create study flashcards from text or upload a document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUploadZone
                  onFileContent={(content, fileName) => {
                    setFlashcardsFileData(content);
                    setFlashcardsFileName(fileName);
                  }}
                  isProcessing={isGenerating}
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or enter a topic</span>
                  </div>
                </div>
                <Textarea
                  placeholder="Enter a topic to generate flashcards (e.g., 'Spanish vocabulary for beginners' or 'JavaScript array methods')"
                  value={flashcardsPrompt}
                  onChange={(e) => setFlashcardsPrompt(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleGenerateFlashcards} disabled={isGenerating || (!flashcardsPrompt.trim() && !flashcardsFileData)}>
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {flashcardsFileData ? 'Generate Flashcards from File' : 'Generate Flashcards'}
                </Button>
                {flashcards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {flashcards.map((card, index) => (
                      <div
                        key={index}
                        onClick={() => toggleCard(index)}
                        className="cursor-pointer p-4 rounded-xl border border-border bg-card hover:bg-card/80 transition-all min-h-[120px] flex items-center justify-center text-center"
                      >
                        <p className="text-sm">
                          {flippedCards.has(index) ? card.answer : card.question}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roadmap">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Learning Roadmap
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    + File Upload
                  </span>
                </CardTitle>
                <CardDescription>Get a personalized learning path from text or upload a document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUploadZone
                  onFileContent={(content, fileName) => {
                    setRoadmapFileData(content);
                    setRoadmapFileName(fileName);
                  }}
                  isProcessing={isGenerating}
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or enter a topic</span>
                  </div>
                </div>
                <Textarea
                  placeholder="Enter a skill or topic you want to learn (e.g., 'Machine Learning from scratch' or 'Becoming a full-stack developer')"
                  value={roadmapPrompt}
                  onChange={(e) => setRoadmapPrompt(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleGenerateRoadmap} disabled={isGenerating || (!roadmapPrompt.trim() && !roadmapFileData)}>
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {roadmapFileData ? 'Generate Roadmap from File' : 'Generate Roadmap'}
                </Button>
                {roadmapResult && (
                  <div className="mt-4 p-4 bg-muted rounded-lg prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap text-sm">{roadmapResult}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentor">
            <Card>
              <CardHeader>
                <CardTitle>AI Mentor</CardTitle>
                <CardDescription>Ask questions and get help with your studies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {mentorMessages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        Ask your AI mentor anything about your studies!
                      </div>
                    )}
                    {mentorMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-8'
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="bg-muted p-3 rounded-lg mr-8">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask a question..."
                      value={mentorInput}
                      onChange={(e) => setMentorInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMentor()}
                    />
                    <Button onClick={handleSendMentor} disabled={isGenerating || !mentorInput.trim()}>
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIToolsPage;
