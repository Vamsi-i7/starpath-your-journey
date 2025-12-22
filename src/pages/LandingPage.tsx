import { ParallaxBackground } from '@/components/landing/ParallaxBackground';
import { FloatingStars } from '@/components/landing/FloatingStars';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CTASection } from '@/components/landing/CTASection';
import { Sparkles } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden dark">
      <ParallaxBackground />
      <FloatingStars />
      <LandingNavbar />
      
      <main className="relative z-10">
        <HeroSection />
        
        <div id="features">
          <FeaturesSection />
        </div>
        
        <div id="how-it-works">
          <HowItWorksSection />
        </div>
        
        <CTASection />
        
        {/* Footer */}
        <footer className="relative py-12 px-6 border-t border-border/20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                StarPath
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2025 StarPath. Built for students who dream big.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
