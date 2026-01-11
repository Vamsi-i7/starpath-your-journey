import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Rocket } from 'lucide-react';

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div 
          className={`relative p-12 md:p-16 rounded-3xl overflow-hidden transition-all duration-700 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{
            background: 'linear-gradient(135deg, hsl(250 85% 60% / 0.2) 0%, hsl(280 80% 65% / 0.2) 50%, hsl(320 75% 60% / 0.2) 100%)',
          }}
        >
          {/* Glow effects */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/30 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent/30 rounded-full blur-[80px]" />
          
          {/* Glass border */}
          <div className="absolute inset-0 rounded-3xl border border-border/30" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-6">
              <Rocket className="w-8 h-8 text-primary" />
            </div>

            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-foreground">Ready to start your </span>
              <span className="text-gradient">journey?</span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of students who are already building better habits and achieving their goals with StarPath.
            </p>

            <Button 
              asChild 
              size="lg" 
              className="group bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full glow"
            >
              <Link to="/signup">
                <span className="flex items-center gap-2">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>

            <p className="text-sm text-muted-foreground mt-4">
              Free forever • No credit card required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
