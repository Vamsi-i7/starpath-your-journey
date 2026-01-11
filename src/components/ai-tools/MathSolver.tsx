import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MathStep {
  step: number;
  description: string;
  equation: string;
  explanation: string;
}

interface MathSolution {
  problem: string;
  steps: MathStep[];
  finalAnswer: string;
  verification: string;
}

interface MathSolverProps {
  solution: MathSolution;
}

export function MathSolver({ solution }: MathSolverProps) {
  // Safety check for solution data
  if (!solution || !solution.problem) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <p className="text-muted-foreground">No solution available. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const copyFullSolution = () => {
    const fullText = `Problem: ${solution.problem}\n\n${solution.steps.map(s => 
      `Step ${s.step}: ${s.description}\n${s.equation}\n${s.explanation}`
    ).join('\n\n')}\n\nFinal Answer: ${solution.finalAnswer}\n\nVerification: ${solution.verification}`;
    copyToClipboard(fullText);
  };

  return (
    <div className="space-y-6">
      {/* Problem Statement */}
      <Card className="border-2 border-yellow-500/30 bg-yellow-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            📐 Problem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-mono font-semibold">{solution.problem}</p>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Step-by-Step Solution</h3>
          <Button variant="outline" size="sm" onClick={copyFullSolution} className="gap-2">
            <Copy className="w-4 h-4" />
            Copy All
          </Button>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-500 to-amber-500" />

          {solution.steps.map((step, index) => (
            <div key={step.step} className="relative pl-16 pb-8 last:pb-0">
              {/* Step number circle */}
              <div className={cn(
                "absolute left-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                "bg-gradient-to-br from-yellow-500 to-amber-500 text-white shadow-lg"
              )}>
                {step.step}
              </div>

              {/* Arrow between steps */}
              {index < solution.steps.length - 1 && (
                <div className="absolute left-[18px] bottom-2">
                  <ArrowDown className="w-6 h-6 text-yellow-500/50" />
                </div>
              )}

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4 space-y-3">
                  {/* Description */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-primary">{step.description}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(step.equation)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Equation */}
                  <div className="p-3 rounded-lg bg-muted/50 font-mono text-lg text-center">
                    {step.equation}
                  </div>

                  {/* Explanation */}
                  <p className="text-sm text-muted-foreground italic">
                    💡 {step.explanation}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Final Answer */}
      <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-green-500 mb-2">Final Answer</Badge>
              <p className="text-3xl font-mono font-bold text-green-600">
                {solution.finalAnswer}
              </p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Verification */}
      {solution.verification && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                ✓ Verification
              </Badge>
            </div>
            <p className="font-mono text-sm">{solution.verification}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MathSolver;
