import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Lightbulb,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrammarIssue {
  line: number;
  text: string;
  suggestion: string;
  type: 'grammar' | 'spelling' | 'punctuation' | 'style';
}

interface EssayFeedback {
  overallScore: number;
  grammar: {
    score: number;
    issues: GrammarIssue[];
  };
  structure: {
    score: number;
    feedback: string;
  };
  clarity: {
    score: number;
    feedback: string;
  };
  tone: string;
  suggestions: string[];
  strengths: string[];
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
}

interface EssayCheckerProps {
  feedback: EssayFeedback;
  originalText: string;
}

export function EssayChecker({ feedback, originalText }: EssayCheckerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIssue, setSelectedIssue] = useState<GrammarIssue | null>(null);

  // Safety check for feedback data
  if (!feedback) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <p className="text-muted-foreground">No feedback available. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure all required fields have defaults
  const safeGrammar = feedback.grammar || { score: 0, issues: [] };
  const safeStructure = feedback.structure || { score: 0, feedback: '' };
  const safeClarity = feedback.clarity || { score: 0, feedback: '' };
  const safeSuggestions = feedback.suggestions || [];
  const safeStrengths = feedback.strengths || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-rose-500';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'grammar':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'spelling':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'punctuation':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'style':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'grammar':
        return 'border-red-500/30 bg-red-500/5';
      case 'spelling':
        return 'border-orange-500/30 bg-orange-500/5';
      case 'punctuation':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'style':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className={cn("border-2 overflow-hidden")}>
        <div className={cn("h-2 bg-gradient-to-r", getScoreBgColor(feedback.overallScore || 0))} />
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-5xl font-bold", getScoreColor(feedback.overallScore || 0))}>
                  {feedback.overallScore || 0}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="w-3 h-3" />
                {feedback.tone || 'N/A'}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {feedback.wordCount || 0} words • {feedback.sentenceCount || 0} sentences • {feedback.paragraphCount || 0} paragraphs
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className={cn("text-2xl font-bold", getScoreColor(safeGrammar.score))}>
                {safeGrammar.score}
              </p>
              <p className="text-xs text-muted-foreground">Grammar</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className={cn("text-2xl font-bold", getScoreColor(safeStructure.score))}>
                {safeStructure.score}
              </p>
              <p className="text-xs text-muted-foreground">Structure</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className={cn("text-2xl font-bold", getScoreColor(safeClarity.score))}>
                {safeClarity.score}
              </p>
              <p className="text-xs text-muted-foreground">Clarity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feedback Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">
            Issues ({safeGrammar.issues.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="text">Annotated Text</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Strengths */}
          <Card className="border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {safeStrengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Structure & Clarity */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={safeStructure.score} className="h-2 mb-3" />
                <p className="text-sm text-muted-foreground">{safeStructure.feedback}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Clarity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={safeClarity.score} className="h-2 mb-3" />
                <p className="text-sm text-muted-foreground">{safeClarity.feedback}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grammar & Style Issues</CardTitle>
              <CardDescription>Click on an issue to see the suggestion</CardDescription>
            </CardHeader>
            <CardContent>
              {safeGrammar.issues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No issues found! Great job!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {safeGrammar.issues.map((issue, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all",
                          getIssueColor(issue.type),
                          selectedIssue === issue && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedIssue(selectedIssue === issue ? null : issue)}
                      >
                        <div className="flex items-start gap-3">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {issue.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Line {issue.line}
                              </span>
                            </div>
                            <p className="text-sm line-through text-red-500/70 mb-1">
                              {issue.text}
                            </p>
                            {selectedIssue === issue && (
                              <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                                <p className="text-sm text-green-600 font-medium">
                                  Suggestion: {issue.suggestion}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {safeSuggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-white text-sm font-bold shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-sm">{suggestion}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Essay</CardTitle>
              <CardDescription>Issues are highlighted in the text</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <AnnotatedText text={originalText} issues={safeGrammar.issues} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Annotated Text Component
function AnnotatedText({ text, issues }: { text: string; issues: GrammarIssue[] }) {
  // Safety check for text
  if (!text || typeof text !== 'string') {
    return <p className="text-muted-foreground">No text to display</p>;
  }
  
  // Create a map of issues by their text for highlighting
  const issueMap = new Map<string, GrammarIssue>();
  issues.forEach(issue => {
    issueMap.set(issue.text.toLowerCase(), issue);
  });

  // Split text into paragraphs
  const paragraphs = text.split('\n\n');

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, pIndex) => (
        <p key={pIndex} className="leading-relaxed">
          {paragraph.split('\n').map((line, lIndex) => {
            // Check if any issue text is in this line
            let hasIssue = false;
            let highlightedLine = line;
            
            issues.forEach(issue => {
              if (line.toLowerCase().includes(issue.text.toLowerCase())) {
                hasIssue = true;
              }
            });

            return (
              <span key={lIndex}>
                {hasIssue ? (
                  <span className="bg-red-500/20 border-b-2 border-red-500 px-1 rounded">
                    {line}
                  </span>
                ) : (
                  line
                )}
                {lIndex < paragraph.split('\n').length - 1 && <br />}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

export default EssayChecker;
