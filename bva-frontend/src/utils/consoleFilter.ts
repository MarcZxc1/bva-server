/**
 * Console Filter Utility
 * Filters out harmless third-party errors (Google Play, analytics, etc.)
 * that clutter the console during development
 */

// List of error patterns to filter out (harmless third-party errors)
const FILTERED_PATTERNS = [
  'play.google.com',
  'ERR_BLOCKED_BY_CLIENT',
  'Self-XSS',
  'net::ERR_BLOCKED_BY_CLIENT',
  'google-analytics',
  'googletagmanager',
  'doubleclick',
];

/**
 * Check if an error message should be filtered
 */
function shouldFilterError(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return FILTERED_PATTERNS.some(pattern => 
    lowerMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Initialize console filtering
 * Call this in your main.tsx or App.tsx
 */
export function initConsoleFilter() {
  // Only filter in development
  if (import.meta.env.PROD) {
    return;
  }

  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;

  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilterError(message)) {
      originalError.apply(console, args);
    }
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldFilterError(message)) {
      originalWarn.apply(console, args);
    }
  };

  console.log('%c🔇 Console filter active - Harmless third-party errors are hidden', 
    'color: #10b981; font-weight: bold;');
}

