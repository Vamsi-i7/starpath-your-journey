import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Menu, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function LandingNavbar() {
  const { theme, toggleTheme } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'py-3 glass-dark' 
          : 'py-4 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span 
            className="text-xl font-bold text-foreground"
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
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass-dark border-t border-border/20 p-6 space-y-4">
          <a 
            href="#features" 
            className="block text-foreground py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="block text-foreground py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            How it Works
          </a>
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                toggleTheme();
              }}
              className="w-full border-border/50 gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full border-border/50">
                Log In
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
