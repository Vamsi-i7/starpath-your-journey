import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Target, 
  Trophy, 
  ChevronRight, 
  ChevronLeft,
  Star,
  Zap
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to StarPath!',
    description: 'Your journey to building better habits starts here. Let us show you how everything works.',
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    details: [
      'Track daily habits and complete them consistently',
      'Earn XP and level up your profile',
      'Complete goals and unlock achievements',
      'Join a community of habit builders',
    ],
  },
  {
    title: 'Experience Points (XP)',
    description: 'XP is your progress currency. Earn it through daily actions and watch your level grow!',
    icon: <Zap className="w-12 h-12 text-xp" />,
    details: [
      'Complete habits: +50 XP each',
      'Finish daily challenges: +50-100 XP',
      'Unlock achievements: +100-500 XP',
      'Complete goals: Bonus XP rewards',
    ],
  },
  {
    title: 'Goals & Planning',
    description: 'Set meaningful goals and break them into achievable tasks.',
    icon: <Target className="w-12 h-12 text-primary" />,
    details: [
      'Create short-term and long-term goals',
      'Break goals into sub-tasks',
      'Track progress automatically',
      'Use templates for common scenarios',
    ],
  },
  {
    title: 'Achievements & Rewards',
    description: 'Unlock achievements as you progress and show off your dedication!',
    icon: <Trophy className="w-12 h-12 text-xp" />,
    details: [
      'Earn badges for milestones',
      'Unlock rare achievements for big goals',
      'Complete daily challenges for bonuses',
      'Build your constellation of stars',
    ],
  },
];

const STORAGE_KEY = 'starpath_tutorial_completed';

interface WelcomeTutorialProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function WelcomeTutorial({ forceShow = false, onComplete }: WelcomeTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }

    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      // Small delay to let the dashboard load first
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {TUTORIAL_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-primary w-6' 
                    : index < currentStep 
                      ? 'bg-primary/50' 
                      : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-primary/10">
                {step.icon}
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {step.title}
            </h2>
            <p className="text-muted-foreground">
              {step.description}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            {step.details.map((detail, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Star className="w-4 h-4 text-xp shrink-0" />
                <span className="text-sm text-foreground">{detail}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Skip Tutorial
            </Button>

            <Button onClick={handleNext} className="gap-1">
              {isLastStep ? (
                "Let's Go!"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manually trigger tutorial
export function useTutorial() {
  const resetTutorial = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasSeen = () => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  };

  return { resetTutorial, hasSeen };
}
