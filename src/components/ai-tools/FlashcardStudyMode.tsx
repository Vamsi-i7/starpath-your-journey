import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FlipCard } from './FlipCard';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardStudyModeProps {
  flashcards: Flashcard[];
  onExit?: () => void;
}

export function FlashcardStudyMode({ flashcards, onExit }: FlashcardStudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState(flashcards);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [needsReviewCards, setNeedsReviewCards] = useState<Set<number>>(new Set());

  const currentCard = cards[currentIndex];
  const progress = (reviewedCount / cards.length) * 100;

  const shuffleDeck = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setReviewedCount(0);
    setMasteredCards(new Set());
    setNeedsReviewCards(new Set());
  };

  const resetProgress = () => {
    setCurrentIndex(0);
    setReviewedCount(0);
    setMasteredCards(new Set());
    setNeedsReviewCards(new Set());
  };

  const goToNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const markAsGotIt = () => {
    setMasteredCards(prev => new Set(prev).add(currentIndex));
    setNeedsReviewCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentIndex);
      return newSet;
    });
    if (!masteredCards.has(currentIndex) && !needsReviewCards.has(currentIndex)) {
      setReviewedCount(prev => prev + 1);
    }
    goToNext();
  };

  const markAsReview = () => {
    setNeedsReviewCards(prev => new Set(prev).add(currentIndex));
    setMasteredCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentIndex);
      return newSet;
    });
    if (!masteredCards.has(currentIndex) && !needsReviewCards.has(currentIndex)) {
      setReviewedCount(prev => prev + 1);
    }
    goToNext();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === '1') markAsGotIt();
      if (e.key === '2') markAsReview();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Study Mode</h3>
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={shuffleDeck}>
            <Shuffle className="w-4 h-4 mr-2" />
            Shuffle
          </Button>
          <Button variant="outline" size="sm" onClick={resetProgress}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit}>
              Exit Study Mode
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <div className="flex gap-4 text-xs">
            <span className="text-green-500">✓ {masteredCards.size} Mastered</span>
            <span className="text-orange-500">⟳ {needsReviewCards.size} Review</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current card */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <FlipCard
            question={currentCard.question}
            answer={currentCard.answer}
            index={currentIndex}
          />
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex justify-center">
        {masteredCards.has(currentIndex) && (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle className="w-4 h-4" />
            Mastered
          </div>
        )}
        {needsReviewCards.has(currentIndex) && (
          <div className="flex items-center gap-2 text-sm text-orange-500">
            <XCircle className="w-4 h-4" />
            Needs Review
          </div>
        )}
      </div>

      {/* Navigation and action buttons */}
      <div className="flex flex-col gap-4">
        {/* Main actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={markAsReview}
            className="border-orange-500/30 hover:bg-orange-500/10"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Review Again
            <span className="ml-2 text-xs text-muted-foreground">(2)</span>
          </Button>
          <Button
            size="lg"
            onClick={markAsGotIt}
            className="bg-green-500 hover:bg-green-600"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Got It!
            <span className="ml-2 text-xs opacity-70">(1)</span>
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {currentIndex + 1} / {cards.length}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === cards.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Keyboard hints */}
        <p className="text-xs text-center text-muted-foreground">
          Use arrow keys to navigate • Press 1 for "Got It" • Press 2 for "Review"
        </p>
      </div>
    </div>
  );
}
