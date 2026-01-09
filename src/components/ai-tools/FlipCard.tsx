import { motion } from 'framer-motion';
import { useState } from 'react';

interface FlipCardProps {
  question: string;
  answer: string;
  index: number;
}

export function FlipCard({ question, answer, index }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      className="relative h-48 cursor-pointer perspective"
      onClick={() => setIsFlipped(!isFlipped)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        {/* Front of card (Question) */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6 flex flex-col items-center justify-center text-center shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-xs font-semibold text-primary mb-2">QUESTION</div>
          <p className="text-sm sm:text-base font-medium">{question}</p>
          <div className="absolute bottom-4 text-xs text-muted-foreground">
            Click to flip
          </div>
        </div>

        {/* Back of card (Answer) */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-6 flex flex-col items-center justify-center text-center shadow-lg"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="text-xs font-semibold text-accent mb-2">ANSWER</div>
          <p className="text-sm sm:text-base">{answer}</p>
          <div className="absolute bottom-4 text-xs text-muted-foreground">
            Click to flip back
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
