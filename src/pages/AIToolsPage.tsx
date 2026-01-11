import { useState } from 'react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  BookOpen, 
  Map, 
  Sparkles, 
  ArrowRight,
  Upload,
  Loader2,
  ChevronLeft,
  Wand2,
  Brain,
  FileCheck,
  Calculator,
  Network,
  MessageCircle
} from 'lucide-react';
import { useAIGenerate } from '@/hooks/useAIGenerate';
import { useCredits } from '@/hooks/useCredits';
import { CreditDisplay } from '@/components/ai-tools/CreditDisplay';
import { MarkdownRenderer } from '@/components/ai-tools/MarkdownRenderer';
import { NotesViewer } from '@/components/ai-tools/NotesViewer';
import { FlipCard } from '@/components/ai-tools/FlipCard';
import { FlashcardStudyMode } from '@/components/ai-tools/FlashcardStudyMode';
import { RoadmapGraph } from '@/components/ai-tools/RoadmapGraph';
import { SaveButton } from '@/components/ai-tools/SaveButton';
import { CopyButton } from '@/components/ai-tools/CopyButton';
import { ExportMenu } from '@/components/ai-tools/ExportMenu';
import { CharacterCount } from '@/components/ai-tools/CharacterCount';
import { LoadingProgress } from '@/components/ai-tools/LoadingProgress';
import { FileUploadZone } from '@/components/ai-tools/FileUploadZone';
import { AIUsageTerms, AILimitationsBanner, useAITermsAcceptance } from '@/components/ai-tools/AIUsageTerms';
import { QuizGenerator } from '@/components/ai-tools/QuizGenerator';
import { EssayChecker } from '@/components/ai-tools/EssayChecker';
import { MathSolver } from '@/components/ai-tools/MathSolver';
import { MindMapCreator } from '@/components/ai-tools/MindMapCreator';
import { SummaryGenerator } from '@/components/ai-tools/SummaryGenerator';
import { LanguagePractice } from '@/components/ai-tools/LanguagePractice';
import { toast } from 'sonner';

type ToolType = 'notes' | 'flashcards' | 'roadmap' | 'quiz' | 'essay' | 'math' | 'mindmap' | 'summary' | 'language' | null;

const TOOLS = [
  {
    id: 'notes',
    name: 'Notes Generator',
    description: 'Transform any topic into comprehensive, well-structured notes',
    icon: FileText,
    gradient: 'from-blue-500 to-cyan-500',
    cost: 5,
    placeholder: 'Enter a topic (e.g., "Photosynthesis in plants", "World War II causes")',
    emoji: '📝',
  },
  {
    id: 'flashcards',
    name: 'Flashcard Creator',
    description: 'Generate interactive flashcards for effective studying',
    icon: BookOpen,
    gradient: 'from-purple-500 to-pink-500',
    cost: 10,
    placeholder: 'Enter a topic (e.g., "Spanish vocabulary", "JavaScript array methods")',
    emoji: '🎴',
  },
  {
    id: 'roadmap',
    name: 'Learning Roadmap',
    description: 'Build a complete learning path with milestones and goals',
    icon: Map,
    gradient: 'from-orange-500 to-red-500',
    cost: 15,
    placeholder: 'Enter a skill (e.g., "Machine Learning", "Full-stack development")',
    emoji: '🗺️',
  },
  {
    id: 'quiz',
    name: 'Quiz Generator',
    description: 'Create interactive quizzes to test your knowledge',
    icon: Brain,
    gradient: 'from-green-500 to-emerald-500',
    cost: 10,
    placeholder: 'Enter a topic (e.g., "World History", "Python basics", "Biology")',
    emoji: '🎯',
  },
  {
    id: 'essay',
    name: 'Essay Checker',
    description: 'Get detailed feedback on grammar, structure, and clarity',
    icon: FileCheck,
    gradient: 'from-indigo-500 to-purple-500',
    cost: 15,
    placeholder: 'Paste your essay here for analysis...',
    emoji: '📊',
  },
  {
    id: 'math',
    name: 'Math Problem Solver',
    description: 'Solve math problems with step-by-step explanations',
    icon: Calculator,
    gradient: 'from-yellow-500 to-amber-500',
    cost: 5,
    placeholder: 'Enter a math problem (e.g., "2x + 5 = 15", "integrate x^2 dx")',
    emoji: '🧮',
  },
  {
    id: 'mindmap',
    name: 'Mind Map Creator',
    description: 'Generate visual mind maps for any topic',
    icon: Network,
    gradient: 'from-pink-500 to-rose-500',
    cost: 10,
    placeholder: 'Enter a topic to create a mind map (e.g., "Climate Change", "Marketing Strategy")',
    emoji: '🎨',
  },
  {
    id: 'summary',
    name: 'Summary Generator',
    description: 'Summarize long texts into key points',
    icon: FileText,
    gradient: 'from-teal-500 to-cyan-500',
    cost: 5,
    placeholder: 'Paste the text you want to summarize...',
    emoji: '📖',
  },
  {
    id: 'language',
    name: 'Language Practice',
    description: 'Practice any language with AI conversation',
    icon: MessageCircle,
    gradient: 'from-violet-500 to-purple-500',
    cost: 5,
    placeholder: 'Type a message in your target language...',
    emoji: '🗣️',
  },
];

export default function NewAIToolsPage() {
  const { generate, isGenerating } = useAIGenerate();
  const { deductCredits, getCost } = useCredits();
  const { showTerms, requireTermsAcceptance, handleAccept, handleDecline } = useAITermsAcceptance();
  
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [prompt, setPrompt] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Results for existing tools
  const [notesResult, setNotesResult] = useState('');
  const [flashcards, setFlashcards] = useState<{ question: string; answer: string }[]>([]);
  const [roadmapResult, setRoadmapResult] = useState('');
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [showRoadmapGraph, setShowRoadmapGraph] = useState(false);
  
  // Results for new tools
  const [quizResult, setQuizResult] = useState<any>(null);
  const [essayResult, setEssayResult] = useState<any>(null);
  const [mathResult, setMathResult] = useState<any>(null);
  const [mindmapResult, setMindmapResult] = useState('');
  const [summaryResult, setSummaryResult] = useState<any>(null);
  const [languageMessages, setLanguageMessages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('spanish');

  const handleToolSelect = (toolId: ToolType) => {
    setSelectedTool(toolId);
    setPrompt('');
    setFileData(null);
    setFileName(null);
    // Clear previous results
    setNotesResult('');
    setFlashcards([]);
    setRoadmapResult('');
    setQuizResult(null);
    setEssayResult(null);
    setMathResult(null);
    setMindmapResult('');
    setSummaryResult(null);
    // Don't clear language messages to maintain conversation
  };

  const performGeneration = async () => {
    if (!selectedTool || (!prompt.trim() && !fileData)) {
      toast.error('Please enter a prompt or upload a file');
      return;
    }

    // Deduct credits
    if (!await deductCredits(selectedTool as any, `Generated ${selectedTool}`)) {
      return;
    }

    const result = await generate(
      fileData ? `${selectedTool}_from_file` as any : selectedTool as any,
      prompt,
      selectedTool === 'language' ? selectedLanguage : undefined,
      fileData || undefined
    );

    if (result) {
      if (selectedTool === 'notes') {
        setNotesResult(result);
      } else if (selectedTool === 'flashcards') {
        try {
          const parsed = JSON.parse(result);
          setFlashcards(parsed.flashcards || parsed);
        } catch {
          toast.error('Failed to parse flashcards');
        }
      } else if (selectedTool === 'roadmap') {
        setRoadmapResult(result);
      } else if (selectedTool === 'quiz') {
        try {
          const parsed = JSON.parse(result);
          setQuizResult(parsed);
        } catch {
          toast.error('Failed to parse quiz data');
        }
      } else if (selectedTool === 'essay') {
        try {
          const parsed = JSON.parse(result);
          setEssayResult(parsed);
        } catch {
          toast.error('Failed to parse essay feedback');
        }
      } else if (selectedTool === 'math') {
        try {
          const parsed = JSON.parse(result);
          setMathResult(parsed);
        } catch {
          toast.error('Failed to parse math solution');
        }
      } else if (selectedTool === 'mindmap') {
        setMindmapResult(result);
      } else if (selectedTool === 'summary') {
        try {
          const parsed = JSON.parse(result);
          setSummaryResult(parsed);
        } catch {
          toast.error('Failed to parse summary');
        }
      } else if (selectedTool === 'language') {
        try {
          const parsed = JSON.parse(result);
          const newMessage = {
            id: Date.now().toString(),
            role: 'assistant' as const,
            content: parsed.aiResponse,
            corrections: parsed.corrections,
            vocabulary: parsed.vocabulary,
            timestamp: new Date(),
          };
          setLanguageMessages(prev => [...prev, newMessage]);
        } catch {
          // If not JSON, treat as plain text response
          const newMessage = {
            id: Date.now().toString(),
            role: 'assistant' as const,
            content: result,
            timestamp: new Date(),
          };
          setLanguageMessages(prev => [...prev, newMessage]);
        }
      }
    }
  };

  const handleLanguageSend = async (message: string, language: string) => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
    };
    setLanguageMessages(prev => [...prev, userMessage]);
    
    // Deduct credits
    if (!await deductCredits('language' as any, `Language practice`)) {
      return;
    }

    const result = await generate(
      'language' as any,
      message,
      language,
      undefined
    );

    if (result) {
      try {
        const parsed = JSON.parse(result);
        const newMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: parsed.aiResponse,
          corrections: parsed.corrections,
          vocabulary: parsed.vocabulary,
          timestamp: new Date(),
        };
        setLanguageMessages(prev => [...prev, newMessage]);
      } catch {
        // If not JSON, treat as plain text response
        const newMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: result,
          timestamp: new Date(),
        };
        setLanguageMessages(prev => [...prev, newMessage]);
      }
    }
  };

  // Wrap generation with terms acceptance check
  const handleGenerate = () => {
    requireTermsAcceptance(performGeneration);
  };

  const handleFileUpload = (data: string, name: string) => {
    setFileData(data);
    setFileName(name);
    toast.success(`File uploaded: ${name}`);
  };

  const handleBack = () => {
    setSelectedTool(null);
    setPrompt('');
    setFileData(null);
    setFileName(null);
  };

  const currentTool = TOOLS.find(t => t.id === selectedTool);
  const hasResult = notesResult || flashcards.length > 0 || roadmapResult || quizResult || essayResult || mathResult || mindmapResult || summaryResult || (selectedTool === 'language' && languageMessages.length > 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5">
      <AppTopbar title="AI Tools" />

      {/* AI Terms Dialog */}
      <AIUsageTerms 
        open={showTerms} 
        onAccept={handleAccept} 
        onDecline={handleDecline} 
      />

      <div className="p-4 sm:p-6 pb-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* AI Limitations Banner */}
          <AILimitationsBanner />
          
          {/* Credit Display */}
          <CreditDisplay showDetails={true} toolType={selectedTool || undefined} />

          {!selectedTool ? (
            /* Tool Selection Dashboard */
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-8 h-8 text-purple-500" />
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    AI-Powered Tools
                  </h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Choose a tool to get started with AI-powered content generation
                </p>
              </div>

              {/* Tool Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  
                  return (
                    <Card
                      key={tool.id}
                      className="group relative overflow-hidden border-2 hover:border-transparent transition-all duration-300 hover:shadow-2xl cursor-pointer"
                      onClick={() => handleToolSelect(tool.id as ToolType)}
                    >
                      {/* Gradient Border on Hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} />
                      <div className="absolute inset-[2px] bg-background rounded-lg -z-10" />

                      <CardHeader className="space-y-4">
                        {/* Icon */}
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>

                        {/* Title */}
                        <div>
                          <CardTitle className="text-xl mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all">
                            {tool.name}
                          </CardTitle>
                          <CardDescription>{tool.description}</CardDescription>
                        </div>

                        {/* Cost Badge */}
                        <Badge className={`bg-gradient-to-r ${tool.gradient} text-white border-0 w-fit`}>
                          {tool.cost} credits
                        </Badge>
                      </CardHeader>

                      <CardContent>
                        <Button 
                          className={`w-full group-hover:bg-gradient-to-r ${tool.gradient} group-hover:text-white transition-all`}
                          variant="outline"
                        >
                          Start Creating
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
                <Card className="text-center p-6 border-purple-500/20 bg-purple-500/5">
                  <div className="text-3xl mb-2">⚡</div>
                  <h3 className="font-semibold mb-1">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">Generate content in seconds</p>
                </Card>
                <Card className="text-center p-6 border-blue-500/20 bg-blue-500/5">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-semibold mb-1">Highly Accurate</h3>
                  <p className="text-sm text-muted-foreground">Powered by advanced AI</p>
                </Card>
                <Card className="text-center p-6 border-cyan-500/20 bg-cyan-500/5">
                  <div className="text-3xl mb-2">💾</div>
                  <h3 className="font-semibold mb-1">Save & Export</h3>
                  <p className="text-sm text-muted-foreground">Keep your creations forever</p>
                </Card>
              </div>
            </div>
          ) : (
            /* Tool Interface */
            <div className="space-y-6">
              {/* Back Button & Tool Header */}
              <Card className="p-4 border-primary/20">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTool?.gradient} flex items-center justify-center shadow-lg`}>
                        <currentTool.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{currentTool?.name}</h2>
                        <p className="text-sm text-muted-foreground">{currentTool?.description}</p>
                      </div>
                    </div>
                  </div>
                  <Badge className={`bg-gradient-to-r ${currentTool?.gradient} text-white border-0`}>
                    {currentTool?.cost} credits
                  </Badge>
                </div>
              </Card>

              {/* Input Card */}
              <Card className={`border-2 bg-card`} style={{
                borderImage: `linear-gradient(to right, var(--tw-gradient-stops)) 1`,
                borderImageSlice: 1,
              }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Create Your Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Prompt Input */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder={currentTool?.placeholder}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      maxLength={5000}
                      className="resize-none"
                    />
                    <CharacterCount current={prompt} max={5000} />
                  </div>

                  {/* File Upload - Supports images and PDFs for multimodal AI */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Or upload an image/PDF to analyze:</p>
                    <FileUploadZone
                      onFileContent={handleFileUpload}
                      isProcessing={isGenerating}
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"
                    />
                    {fileName && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>📎 {fileName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFileData(null);
                            setFileName(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <div className={`p-1 rounded-xl bg-gradient-to-r ${currentTool?.gradient}`}>
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || (!prompt.trim() && !fileData)}
                      className="w-full h-12 text-lg bg-background hover:bg-transparent hover:text-white transition-all"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate {currentTool?.name?.split(' ')[0] || 'Content'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Loading State */}
              {isGenerating && <LoadingProgress message={`Creating your ${selectedTool}...`} />}

              {/* Results */}
              {hasResult && !isGenerating && selectedTool !== 'language' && (
                <Card className="border-2 border-primary/20">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{currentTool?.emoji}</span>
                        Generated {currentTool?.name}
                      </CardTitle>
                      <CardDescription>Created just now</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedTool === 'notes' && (
                        <>
                          <SaveButton content={notesResult} rawContent={notesResult} toolType="notes" defaultTitle="My Notes" />
                          <CopyButton content={notesResult} />
                          <ExportMenu content={notesResult} title="Notes" type="notes" />
                        </>
                      )}
                      {selectedTool === 'flashcards' && !isStudyMode && (
                        <>
                          <Button variant="default" size="sm" onClick={() => setIsStudyMode(true)}>
                            <BookOpen className="w-4 h-4 mr-2" />
                            Study Mode
                          </Button>
                          <SaveButton content={flashcards} rawContent={JSON.stringify(flashcards, null, 2)} toolType="flashcards" defaultTitle="My Flashcards" />
                          <CopyButton content={JSON.stringify(flashcards, null, 2)} />
                          <ExportMenu content={JSON.stringify(flashcards, null, 2)} title="Flashcards" type="flashcards" />
                        </>
                      )}
                      {selectedTool === 'roadmap' && (
                        <>
                          <Button
                            variant={showRoadmapGraph ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowRoadmapGraph(!showRoadmapGraph)}
                          >
                            <Map className="w-4 h-4 mr-2" />
                            {showRoadmapGraph ? 'Show Text' : 'Show Graph'}
                          </Button>
                          <SaveButton content={roadmapResult} rawContent={roadmapResult} toolType="roadmap" defaultTitle="My Roadmap" />
                          <CopyButton content={roadmapResult} />
                          <ExportMenu content={roadmapResult} title="Roadmap" type="roadmap" />
                        </>
                      )}
                      {selectedTool === 'mindmap' && (
                        <>
                          <SaveButton content={mindmapResult} rawContent={mindmapResult} toolType="mindmap" defaultTitle="My Mind Map" />
                          <CopyButton content={mindmapResult} />
                          <ExportMenu content={mindmapResult} title="Mind Map" type="mindmap" />
                        </>
                      )}
                      {selectedTool === 'summary' && summaryResult && (
                        <>
                          <CopyButton content={summaryResult.summary?.medium || ''} />
                        </>
                      )}
                      {selectedTool === 'math' && mathResult && (
                        <>
                          <CopyButton content={`${mathResult.problem}\nAnswer: ${mathResult.finalAnswer}`} />
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedTool === 'notes' && <NotesViewer content={notesResult} />}
                    {selectedTool === 'flashcards' && !isStudyMode && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {flashcards.map((card, index) => (
                          <FlipCard key={index} question={card.question} answer={card.answer} index={index} />
                        ))}
                      </div>
                    )}
                    {selectedTool === 'flashcards' && isStudyMode && (
                      <FlashcardStudyMode flashcards={flashcards} onExit={() => setIsStudyMode(false)} />
                    )}
                    {selectedTool === 'roadmap' && (
                      showRoadmapGraph ? (
                        <RoadmapGraph content={roadmapResult} />
                      ) : (
                        <MarkdownRenderer content={roadmapResult} />
                      )
                    )}
                    {selectedTool === 'quiz' && quizResult && (
                      <QuizGenerator 
                        questions={quizResult.questions || []} 
                        topic={prompt}
                        onRetake={() => {}}
                        onNewQuiz={() => setQuizResult(null)}
                      />
                    )}
                    {selectedTool === 'essay' && essayResult && (
                      <EssayChecker feedback={essayResult} originalText={prompt} />
                    )}
                    {selectedTool === 'math' && mathResult && (
                      <MathSolver solution={mathResult} />
                    )}
                    {selectedTool === 'mindmap' && mindmapResult && (
                      <MindMapCreator content={mindmapResult} topic={prompt} />
                    )}
                    {selectedTool === 'summary' && summaryResult && (
                      <SummaryGenerator result={summaryResult} originalText={prompt} />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Language Practice - Special handling with chat interface */}
              {selectedTool === 'language' && (
                <LanguagePractice
                  messages={languageMessages}
                  onSendMessage={handleLanguageSend}
                  isLoading={isGenerating}
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
