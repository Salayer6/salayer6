import { useState } from 'react';

type Theme = 'light' | 'dark';

/**
 * A hook to manage the application's theme (light/dark).
 * This version uses a very direct, simplified logic to ensure it works reliably.
 */
export const useTheme = (): [Theme, () => void] => {
  // Initialize state by reading the class from the <html> element.
  // This syncs React's state with the DOM state set by the pre-loading script.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    // Determine the next theme based on the current state.
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // 1. Update the DOM immediately.
    window.document.documentElement.classList.toggle('dark');

    // 2. Update localStorage for persistence.
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
    
    // 3. Update React's state to re-render the UI (e.g., the toggle icon).
    setTheme(newTheme);
  };

  return [theme, toggleTheme];
};
