import { useEffect, useRef, useState } from 'react';
import { 
  Target, 
  Flame, 
  Trophy, 
  Users, 
  BarChart3, 
  Sparkles,
  Heart,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Smart Habit Tracking',
    description: 'Create and track daily or weekly habits with beautiful visual progress indicators.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Flame,
    title: 'Streak System',
    description: 'Build momentum with streak tracking. The longer you go, the brighter your stars shine.',
    color: 'text-streak',
    bgColor: 'bg-streak/10',
  },
  {
    icon: Zap,
    title: 'XP & Leveling',
    description: 'Earn experience points for completing habits and level up your productivity.',
    color: 'text-xp',
    bgColor: 'bg-xp/10',
  },
  {
    icon: Heart,
    title: 'Lives System',
    description: 'Maintain your progress with hearts. Build streaks to earn extra protection.',
    color: 'text-heart',
    bgColor: 'bg-heart/10',
  },
  {
    icon: Sparkles,
    title: 'Constellation View',
    description: 'Watch your habits form constellations in a beautiful interactive star map.',
    color: 'text-star',
    bgColor: 'bg-star/10',
  },
  {
    icon: BarChart3,
    title: 'Detailed Analytics',
    description: 'Visualize your progress with charts showing completion rates, streaks, and more.',
    color: 'text-accent-foreground',
    bgColor: 'bg-accent/10',
  },
  {
    icon: Users,
    title: 'Social Features',
    description: 'Connect with friends, join study groups, and share your achievements.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Trophy,
    title: 'Goals & Planning',
    description: 'Set long-term goals, break them into tasks, and track your progress over time.',
    color: 'text-level',
    bgColor: 'bg-level/10',
  },
];

export function FeaturesSection() {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleItems(prev => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.2 }
    );

    const cards = sectionRef.current?.querySelectorAll('.feature-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-foreground">Everything you need to </span>
            <span className="text-gradient">succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            StarPath combines powerful habit tracking with gamification to keep you motivated on your journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              data-index={index}
              className={`feature-card group p-6 rounded-2xl glass-dark border border-border/20 hover:border-primary/30 transition-all duration-500 ${
                visibleItems.includes(index) 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
