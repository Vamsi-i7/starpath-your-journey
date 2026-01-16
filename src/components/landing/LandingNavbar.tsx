import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import clawzerLogo from '@/assets/clawzer-logo.png';

export function LandingNavbar() {
  const { theme, setTheme, resolvedColorMode } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Quick toggle between light/dark themes
  const toggleTheme = () => {
    if (resolvedColorMode === 'dark') {
      setTheme('aurora-light');
    } else {
      setTheme('cosmic-focus');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on scroll
  useEffect(() => {
    if (isMobileMenuOpen) {
      const handleScroll = () => setIsMobileMenuOpen(false);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled ? "py-3 bg-background/80 backdrop-blur-xl border-b border-border/20" : "py-4 bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={clawzerLogo} 
              alt="StarPath" 
              className="h-8 sm:h-10 w-auto rounded-xl group-hover:scale-105 transition-transform"
            />
            <span 
              className="text-lg sm:text-xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              StarPath
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground hover:bg-card/30"
              title={resolvedColorMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {resolvedColorMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" className="text-foreground hover:bg-card/30">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-foreground z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div 
        className={cn(
          "md:hidden fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-background border-l border-border/30 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6 pt-20">
          <nav className="space-y-1">
            <a 
              href="#features" 
              className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How it Works
            </a>
          </nav>

          <div className="mt-6 pt-6 border-t border-border/30 space-y-4">
            {/* Theme Toggle */}
            <Button 
              variant="outline" 
              onClick={toggleTheme}
              className="w-full gap-2"
            >
              {resolvedColorMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {resolvedColorMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>

          <div className="mt-auto space-y-3">
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
              <Button variant="outline" className="w-full">
                Log In
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
