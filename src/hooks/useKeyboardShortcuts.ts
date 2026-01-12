import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global keyboard shortcuts for better UX
 * Press '?' to see all shortcuts
 */

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'h',
      description: 'Go to Dashboard (Home)',
      action: () => navigate('/dashboard'),
    },
    {
      key: 'g',
      description: 'Go to Goals',
      action: () => navigate('/goals'),
    },
    {
      key: 't',
      description: 'Go to Habits (Tracker)',
      action: () => navigate('/habits'),
    },
    {
      key: 'a',
      description: 'Go to AI Tools',
      action: () => navigate('/ai-tools'),
    },
    {
      key: 'p',
      description: 'Go to Profile',
      action: () => navigate('/profile'),
    },
    {
      key: 's',
      description: 'Go to Settings',
      action: () => navigate('/settings'),
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'New Habit (Ctrl+N)',
      action: () => {
        // Trigger new habit modal
        const event = new CustomEvent('openNewHabitModal');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Command Palette (Ctrl+K)',
      action: () => {
        // Trigger command palette
        const event = new CustomEvent('openCommandPalette');
        window.dispatchEvent(event);
      },
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Show shortcuts help with '?'
    if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const event2 = new CustomEvent('showKeyboardShortcuts');
      window.dispatchEvent(event2);
      return;
    }

    // Check all shortcuts
    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

// Hook to display keyboard shortcuts
export function useShowKeyboardShortcuts() {
  useEffect(() => {
    const handleShow = () => {
      // You can implement a modal or toast here
      console.log('Keyboard Shortcuts:');
      console.log('h - Go to Dashboard');
      console.log('g - Go to Goals');
      console.log('t - Go to Habits');
      console.log('a - Go to AI Tools');
      console.log('p - Go to Profile');
      console.log('s - Go to Settings');
      console.log('Ctrl+N - New Habit');
      console.log('Ctrl+K - Command Palette');
      console.log('? - Show this help');
    };

    window.addEventListener('showKeyboardShortcuts', handleShow);
    return () => window.removeEventListener('showKeyboardShortcuts', handleShow);
  }, []);
}
