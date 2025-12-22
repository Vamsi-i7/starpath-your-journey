import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Star, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Create Your Habits',
    description: 'Define the habits you want to build. Set daily or weekly goals and customize each habit with icons and colors.',
    icon: CheckCircle2,
  },
  {
    number: '02',
    title: 'Track & Complete',
    description: 'Check off habits as you complete them. Watch your streaks grow and earn XP for every completion.',
    icon: Star,
  },
  {
    number: '03',
    title: 'Level Up',
    description: 'Accumulate XP to level up. Your progress creates beautiful constellations that visualize your journey.',
    icon: TrendingUp,
  },
];

export function HowItWorksSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-foreground">How </span>
            <span className="text-gradient">StarPath</span>
            <span className="text-foreground"> Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps and begin your journey to better habits.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50 hidden lg:block" />

          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                } transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Number Badge (center on desktop) */}
                <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent items-center justify-center text-primary-foreground font-bold text-xl z-10 glow transition-transform duration-300 hover:scale-110">
                  {step.number}
                </div>

                {/* Content Card */}
                <div className={`flex-1 ${index % 2 === 1 ? 'lg:pr-24' : 'lg:pl-24'}`}>
                  <div className="group p-6 sm:p-8 rounded-2xl glass-dark border border-border/20 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 cursor-default">
                    {/* Mobile: Number + Icon row */}
                    <div className="flex items-center gap-4 mb-4 lg:hidden">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold glow transition-transform duration-300 group-hover:scale-110">
                        {step.number}
                      </div>
                      <step.icon className="w-8 h-8 shrink-0 text-primary transition-all duration-300 group-hover:text-accent group-hover:scale-110" />
                    </div>
                    
                    {/* Desktop: Just icon */}
                    <div className="hidden lg:block mb-4">
                      <step.icon className="w-8 h-8 text-primary transition-all duration-300 group-hover:text-accent group-hover:scale-110" />
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 sm:mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Spacer for the other side */}
                <div className="flex-1 hidden lg:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
