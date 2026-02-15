import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Keyboard shortcuts hook
 *
 * Shortcuts:
 * - n: New item (when not in input field)
 * - s: Open scanner (when not in input field)
 * - h: Go home
 * - i: View all items
 * - d: Open dashboard
 * - Escape: Clear focus from inputs
 * - ?: Show help (displays shortcuts in console for now)
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Skip if user is typing in an input/textarea
      const target = e.target;
      const isTyping = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable;

      // Handle Escape key (works even in inputs)
      if (e.key === 'Escape') {
        if (document.activeElement) {
          document.activeElement.blur();
        }
        return;
      }

      // Skip other shortcuts if typing
      if (isTyping) {
        return;
      }

      // Prevent default for our shortcuts
      const shortcuts = ['n', 's', 'h', 'i', 'd', '?'];
      if (shortcuts.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          // New item
          navigate('/add');
          break;
        case 's':
          // Scanner
          navigate('/scan');
          break;
        case 'h':
          // Home
          navigate('/');
          break;
        case 'i':
          // Items list
          navigate('/items');
          break;
        case 'd':
          // Dashboard
          navigate('/dashboard');
          break;
        case '?':
          // Show help
          console.log(`
📦 Sortr Keyboard Shortcuts:

Navigation:
  h - Go to Home
  i - View all Items
  d - Open Dashboard

Actions:
  n - Create New item
  s - Open Scanner

General:
  Esc - Clear focus from input fields
  ? - Show this help message
          `);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, location]);
}
