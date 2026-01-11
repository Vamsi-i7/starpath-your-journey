import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sun, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Award,
  TrendingDown,
  Activity,
  Eye,
  Flame
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AnalyticsGuideProps {
  open: boolean;
  onClose: () => void;
}

const guideSteps = [
  {
    title: 'Welcome to Analytics! 📊',
    description: 'Track your progress and understand your productivity patterns',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Analytics helps you visualize your journey and see how you're improving over time.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Track Habits</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/20">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm font-medium">Monitor XP</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-sm font-medium">Study Time</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">Goals Achieved</p>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    title: 'Today Tab ☀️',
    description: 'See your real-time progress for today',
    icon: Sun,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Sun className="w-6 h-6 text-blue-500" />
            <h3 className="font-semibold">Today View Shows:</h3>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span><strong>Habits completed</strong> out of total habits</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span><strong>XP earned</strong> from completed habits</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span><strong>Study time</strong> spent today</span>
            </li>
            <li className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span><strong>Goals completed</strong> today</span>
            </li>
          </ul>
        </div>
        
        {/* Interactive Example */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Example: What you'll see
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-500">3/5</p>
              <p className="text-xs text-muted-foreground">Habits Done</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-500">+150</p>
              <p className="text-xs text-muted-foreground">XP Earned</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Complete habits throughout the day and watch your progress update in real-time!
        </p>
      </div>
    ),
  },
  {
    title: 'Week Tab 📅',
    description: 'View your last 7 days performance',
    icon: Calendar,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-6 h-6 text-green-500" />
            <h3 className="font-semibold">Week View Features:</h3>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-green-500 mt-0.5" />
              <span><strong>Daily breakdown chart</strong> - See each day's performance</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-green-500 mt-0.5" />
              <span><strong>Comparison with last week</strong> - Track improvement</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-green-500 mt-0.5" />
              <span><strong>Identify patterns</strong> - Find your most productive days</span>
            </li>
          </ul>
        </div>

        {/* Weekly Comparison Example */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Week-over-Week Comparison
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-green-500/10 rounded border border-green-500/20">
              <span className="text-sm">This Week</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-500">85%</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500">+15%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm text-muted-foreground">Last Week</span>
              <span className="text-sm text-muted-foreground">70%</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-sm flex items-start gap-2">
            <Flame className="w-4 h-4 text-amber-500 mt-0.5" />
            <span><strong>Hot Tip:</strong> Consistency is key! Try to maintain a streak by completing habits every day.</span>
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Month Tab 📈',
    description: 'Track your 30-day trends and weekly summaries',
    icon: TrendingUp,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            <h3 className="font-semibold">Month View Shows:</h3>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5" />
              <span><strong>Daily heatmap</strong> - Visual calendar of your activity</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5" />
              <span><strong>Weekly summaries</strong> - 4 weeks breakdown</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5" />
              <span><strong>Monthly totals</strong> - Overall performance metrics</span>
            </li>
          </ul>
        </div>

        {/* Heatmap Example */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Heatmap Legend
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Less</span>
            <div className="flex gap-1">
              <div className="w-5 h-5 rounded bg-muted border border-border"></div>
              <div className="w-5 h-5 rounded bg-green-500/20 border border-green-500/30"></div>
              <div className="w-5 h-5 rounded bg-green-500/50 border border-green-500/50"></div>
              <div className="w-5 h-5 rounded bg-green-500/70 border border-green-500/70"></div>
              <div className="w-5 h-5 rounded bg-green-500 border border-green-500"></div>
            </div>
            <span className="text-muted-foreground">More</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Darker colors = More habits completed
          </p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <p className="text-sm">
            <strong>📊 Pro Insight:</strong> The heatmap quickly shows you which days you were most active. Look for gaps and try to fill them!
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Year Tab 📊',
    description: 'See the big picture - your entire year at a glance',
    icon: BarChart3,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            <h3 className="font-semibold">Year View Includes:</h3>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-orange-500 mt-0.5" />
              <span><strong>Monthly overview</strong> - All 12 months comparison</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-orange-500 mt-0.5" />
              <span><strong>Quarterly summaries</strong> - Q1, Q2, Q3, Q4 breakdowns</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-orange-500 mt-0.5" />
              <span><strong>Long-term trends</strong> - Spot seasonal patterns</span>
            </li>
          </ul>
        </div>

        {/* Quarterly Breakdown */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Quarterly Performance Example
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Q1 (Jan-Mar)</p>
              <p className="text-lg font-bold text-blue-500">78%</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Q2 (Apr-Jun)</p>
              <p className="text-lg font-bold text-green-500">85%</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Q3 (Jul-Sep)</p>
              <p className="text-lg font-bold text-purple-500">82%</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Q4 (Oct-Dec)</p>
              <p className="text-lg font-bold text-orange-500">90%</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <p className="text-sm">
            <strong>🎯 Big Picture Thinking:</strong> Year view helps you see long-term progress and celebrate how far you've come!
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Start Tracking! 🚀',
    description: 'Complete habits to see your analytics come to life',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg p-6 border border-primary/30 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <h3 className="text-xl font-bold mb-2">You're All Set!</h3>
          <p className="text-muted-foreground mb-4">
            Start completing habits and watch your analytics grow. The more you do, the more insights you'll gain!
          </p>
          <div className="space-y-2 text-sm text-left bg-background/50 rounded-lg p-4">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Quick Action Checklist:
            </p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Complete habits daily for accurate tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Use the session timer to log study time</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Set and complete goals for extra XP</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Check analytics regularly to stay motivated</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Rewatch this guide anytime from <strong>Settings → Help</strong></span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs font-medium">Daily</p>
            <p className="text-[10px] text-muted-foreground">Quick overview</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <Activity className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xs font-medium">Weekly</p>
            <p className="text-[10px] text-muted-foreground">Spot patterns</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <p className="text-xs font-medium">Monthly+</p>
            <p className="text-[10px] text-muted-foreground">Long-term view</p>
          </div>
        </div>
      </div>
    ),
  },
];

export function AnalyticsGuide({ open, onClose }: AnalyticsGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset to first step when guide is opened
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = guideSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / guideSteps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{step.title}</DialogTitle>
              <DialogDescription>{step.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {currentStep + 1} of {guideSteps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="py-4">
          {step.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-1">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary w-6'
                    : index < currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext}>
            {currentStep === guideSteps.length - 1 ? (
              'Get Started'
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Skip Button */}
        {currentStep < guideSteps.length - 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full"
          >
            Skip Guide
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
