import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizGeneratorProps {
  questions: QuizQuestion[];
  topic: string;
  onRetake: () => void;
  onNewQuiz: () => void;
}

export function QuizGenerator({ questions, topic, onRetake, onNewQuiz }: QuizGeneratorProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions?.length || 0).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const [timerActive, setTimerActive] = useState(true);

  // Safety check for empty questions array
  if (!questions || questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <p className="text-muted-foreground mb-4">No quiz questions were generated. Please try again.</p>
          <Button onClick={onNewQuiz}>Generate New Quiz</Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // Safety check for current question
  if (!currentQuestion) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <p className="text-muted-foreground mb-4">Error loading question. Please try again.</p>
          <Button onClick={onNewQuiz}>Generate New Quiz</Button>
        </CardContent>
      </Card>
    );
  }

  // Timer effect
  useEffect(() => {
    if (!timerActive || quizCompleted || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, currentQuestionIndex, quizCompleted, showResult]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(30);
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
    setShowResult(true);
    setTimerActive(false);
  };

  const handleNextQuestion = () => {
    // Save current answer if not saved
    if (selectedAnswer !== null && answers[currentQuestionIndex] === null) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedAnswer;
      setAnswers(newAnswers);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimerActive(true);
    } else {
      setQuizCompleted(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index]?.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100)
    };
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers(new Array(questions.length).fill(null));
    setShowResult(false);
    setQuizCompleted(false);
    setTimerActive(true);
    setTimeLeft(30);
    onRetake();
  };

  if (quizCompleted) {
    const score = calculateScore();
    return <QuizResults score={score} questions={questions} answers={answers} onRetake={handleRetake} onNewQuiz={onNewQuiz} topic={topic} />;
  }

  return (
    <div className="space-y-6">
      {/* Progress and Timer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          timeLeft <= 10 ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
        )}>
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{timeLeft}s</span>
        </div>
      </div>

      {/* Question Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showCorrectness = showResult;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isSelected && !showResult && "border-primary bg-primary/10",
                  showCorrectness && isCorrect && "border-green-500 bg-green-500/10",
                  showCorrectness && isSelected && !isCorrect && "border-red-500 bg-red-500/10",
                  !showCorrectness && !isSelected && "border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    isSelected && !showResult && "bg-primary text-primary-foreground",
                    showCorrectness && isCorrect && "bg-green-500 text-white",
                    showCorrectness && isSelected && !isCorrect && "bg-red-500 text-white",
                    !isSelected && !showCorrectness && "bg-muted"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                  {showCorrectness && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {showCorrectness && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Explanation (shown after answer) */}
      {showResult && currentQuestion.explanation && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <p className="text-sm">
              <span className="font-semibold text-blue-600">Explanation: </span>
              {currentQuestion.explanation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {!showResult ? (
          <Button 
            onClick={handleSubmitAnswer} 
            disabled={selectedAnswer === null}
            className="bg-gradient-to-r from-green-500 to-emerald-500"
          >
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} className="bg-gradient-to-r from-green-500 to-emerald-500">
            {currentQuestionIndex < questions.length - 1 ? (
              <>
                Next Question
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                See Results
                <Trophy className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Quiz Results Component
interface QuizResultsProps {
  score: { correct: number; total: number; percentage: number };
  questions: QuizQuestion[];
  answers: (number | null)[];
  onRetake: () => void;
  onNewQuiz: () => void;
  topic: string;
}

function QuizResults({ score, questions, answers, onRetake, onNewQuiz, topic }: QuizResultsProps) {
  const getGrade = () => {
    if (score.percentage >= 90) return { grade: 'A', color: 'text-green-500', message: 'Excellent! 🎉' };
    if (score.percentage >= 80) return { grade: 'B', color: 'text-blue-500', message: 'Great job! 👏' };
    if (score.percentage >= 70) return { grade: 'C', color: 'text-yellow-500', message: 'Good effort! 💪' };
    if (score.percentage >= 60) return { grade: 'D', color: 'text-orange-500', message: 'Keep practicing! 📚' };
    return { grade: 'F', color: 'text-red-500', message: 'Need more study! 📖' };
  };

  const gradeInfo = getGrade();

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardContent className="p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-muted-foreground mb-6">Topic: {topic}</p>
          
          <div className="flex items-center justify-center gap-8 mb-6">
            <div>
              <p className={cn("text-6xl font-bold", gradeInfo.color)}>{score.percentage}%</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div>
              <p className="text-4xl font-bold">{score.correct}/{score.total}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div>
              <p className={cn("text-4xl font-bold", gradeInfo.color)}>{gradeInfo.grade}</p>
              <p className="text-sm text-muted-foreground">Grade</p>
            </div>
          </div>
          
          <Badge className={cn("text-lg px-4 py-1", gradeInfo.color.replace('text-', 'bg-').replace('500', '500/20'))}>
            {gradeInfo.message}
          </Badge>
        </CardContent>
      </Card>

      {/* Review Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Review Your Answers</CardTitle>
          <CardDescription>See which questions you got right or wrong</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.correctAnswer;
            
            return (
              <div 
                key={index}
                className={cn(
                  "p-4 rounded-lg border-2",
                  isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    isCorrect ? "bg-green-500" : "bg-red-500"
                  )}>
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <XCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-2">{q.question}</p>
                    <div className="text-sm space-y-1">
                      <p className="text-green-600">
                        ✓ Correct: {q.options[q.correctAnswer]}
                      </p>
                      {!isCorrect && userAnswer !== null && (
                        <p className="text-red-600">
                          ✗ Your answer: {q.options[userAnswer]}
                        </p>
                      )}
                      {userAnswer === null && (
                        <p className="text-muted-foreground">No answer selected</p>
                      )}
                    </div>
                    {q.explanation && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onRetake} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button onClick={onNewQuiz} className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500">
          Generate New Quiz
        </Button>
      </div>
    </div>
  );
}

export { QuizResults };
