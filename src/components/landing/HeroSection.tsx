import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Star } from 'lucide-react';

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center px-6 py-20"
    >
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div 
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark mb-8 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Sparkles className="w-4 h-4 text-star" />
          <span className="text-sm text-foreground/80">Transform your habits into constellations</span>
        </div>

        {/* Main Title */}
        <h1 
          className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight transition-all duration-700 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="text-foreground">Your path to </span>
          <span className="text-gradient">stellar habits</span>
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 transition-all duration-700 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Track habits, earn XP, build streaks, and watch your progress light up the night sky. 
          The gamified habit tracker designed for students who dream big.
        </p>

        {/* CTA Buttons */}
        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Button 
            asChild 
            size="lg" 
            className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full glow"
          >
            <Link to="/signup">
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            size="lg"
            className="border-border/50 bg-card/20 backdrop-blur-sm hover:bg-card/40 text-foreground px-8 py-6 text-lg rounded-full"
          >
            <Link to="/login">
              Log In
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div 
          className={`grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/20 max-w-2xl mx-auto transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-star fill-star" />
              <span className="text-2xl sm:text-3xl font-bold text-foreground">10k+</span>
            </div>
            <p className="text-sm text-muted-foreground">Active Students</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">500k+</span>
            </div>
            <p className="text-sm text-muted-foreground">Habits Completed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">95%</span>
            </div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-border/50 flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
