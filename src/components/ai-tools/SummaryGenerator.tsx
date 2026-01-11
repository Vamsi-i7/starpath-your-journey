import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  FileText, 
  Copy, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  ListChecks
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SummaryResult {
  summary: {
    short: string;
    medium: string;
    long: string;
  };
  keyPoints: string[];
  originalWordCount: number;
  summaryWordCount: {
    short: number;
    medium: number;
    long: number;
  };
}

interface SummaryGeneratorProps {
  result: SummaryResult;
  originalText: string;
}

export function SummaryGenerator({ result, originalText }: SummaryGeneratorProps) {
  const [activeLength, setActiveLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [compareMode, setCompareMode] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);

  // Safety check for result data
  if (!result || !result.summary) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <p className="text-muted-foreground">No summary available. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const currentSummary = result.summary[activeLength] || '';
  const currentWordCount = result.summaryWordCount?.[activeLength] || 0;
  const reductionPercentage = result.originalWordCount ? Math.round((1 - currentWordCount / result.originalWordCount) * 100) : 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getLengthDescription = (length: string) => {
    switch (length) {
      case 'short': return '1-2 sentences';
      case 'medium': return '1 paragraph';
      case 'long': return 'Detailed';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-teal-500/20 bg-teal-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-teal-600">{result.originalWordCount}</p>
            <p className="text-xs text-muted-foreground">Original Words</p>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-600">{currentWordCount}</p>
            <p className="text-xs text-muted-foreground">Summary Words</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="w-5 h-5 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{reductionPercentage}%</p>
            </div>
            <p className="text-xs text-muted-foreground">Reduction</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{result.keyPoints.length}</p>
            <p className="text-xs text-muted-foreground">Key Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Length Selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Summary</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant={compareMode ? "default" : "outline"} 
                size="sm"
                onClick={() => setCompareMode(!compareMode)}
              >
                Compare
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(currentSummary)}
                className="gap-1"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Length Tabs */}
          <Tabs value={activeLength} onValueChange={(v) => setActiveLength(v as any)} className="mb-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="short" className="gap-1">
                <span>Short</span>
                <Badge variant="outline" className="text-xs ml-1">{result.summaryWordCount.short}w</Badge>
              </TabsTrigger>
              <TabsTrigger value="medium" className="gap-1">
                <span>Medium</span>
                <Badge variant="outline" className="text-xs ml-1">{result.summaryWordCount.medium}w</Badge>
              </TabsTrigger>
              <TabsTrigger value="long" className="gap-1">
                <span>Long</span>
                <Badge variant="outline" className="text-xs ml-1">{result.summaryWordCount.long}w</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Compare Mode or Regular View */}
          {compareMode ? (
            <div className="space-y-4">
              {/* Split Position Slider */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Original</span>
                <Slider
                  value={[splitPosition]}
                  onValueChange={([v]) => setSplitPosition(v)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground">Summary</span>
              </div>

              {/* Split View */}
              <div className="grid grid-cols-2 gap-4 h-[300px]">
                <Card className="border-muted overflow-hidden" style={{ width: `${splitPosition * 2}%`, maxWidth: '100%' }}>
                  <CardHeader className="py-2 px-3 bg-muted/50">
                    <CardTitle className="text-xs">Original ({result.originalWordCount} words)</CardTitle>
                  </CardHeader>
                  <ScrollArea className="h-[250px]">
                    <CardContent className="p-3 text-sm">
                      {originalText}
                    </CardContent>
                  </ScrollArea>
                </Card>
                <Card className="border-teal-500/30 overflow-hidden" style={{ width: `${(100 - splitPosition) * 2}%`, maxWidth: '100%' }}>
                  <CardHeader className="py-2 px-3 bg-teal-500/10">
                    <CardTitle className="text-xs text-teal-600">Summary ({currentWordCount} words)</CardTitle>
                  </CardHeader>
                  <ScrollArea className="h-[250px]">
                    <CardContent className="p-3 text-sm">
                      {currentSummary}
                    </CardContent>
                  </ScrollArea>
                </Card>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-gradient-to-br from-teal-500/5 to-cyan-500/5 border border-teal-500/20">
              <p className="text-sm text-muted-foreground mb-2">{getLengthDescription(activeLength)}</p>
              <p className="leading-relaxed">{currentSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card className="border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-purple-500" />
            Key Points
          </CardTitle>
          <CardDescription>Main takeaways from the text</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.keyPoints.map((point, index) => (
              <li 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-bold shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm flex-1">{point}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0"
                  onClick={() => copyToClipboard(point)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Copy All Key Points */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => copyToClipboard(result.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n'))}
          className="gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy All Key Points
        </Button>
      </div>
    </div>
  );
}

export default SummaryGenerator;
