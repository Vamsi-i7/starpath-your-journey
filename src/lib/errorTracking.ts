/**
 * Centralized Error Tracking System
 * Integrates with Sentry or can be used standalone
 */

interface ErrorContext {
  userId?: string;
  username?: string;
  route?: string;
  action?: string;
  component?: string;
  additionalData?: Record<string, any>;
}

interface ErrorReport {
  error: Error;
  context: ErrorContext;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private isInitialized = false;
  private sentryEnabled = false;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 50;

  private constructor() {
    this.initializeErrorHandlers();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Initialize Sentry or other error tracking service
   */
  initialize(config?: { dsn?: string; environment?: string }) {
    if (this.isInitialized) return;

    const sentryDsn = config?.dsn || import.meta.env.VITE_SENTRY_DSN;
    const environment = config?.environment || import.meta.env.MODE;

    if (sentryDsn && typeof window !== 'undefined') {
      // Initialize Sentry
      import('@sentry/react').then((Sentry) => {
        Sentry.init({
          dsn: sentryDsn,
          environment,
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
            }),
          ],
          // Performance Monitoring
          tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
          // Session Replay
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
          // Don't send errors in development
          enabled: environment === 'production',
          beforeSend(event, hint) {
            // Filter out non-error issues
            if (event.level === 'info' || event.level === 'debug') {
              return null;
            }
            return event;
          },
        });
        
        this.sentryEnabled = true;
        console.info('[ErrorTracker] Sentry initialized in', environment, 'mode');
      }).catch((error) => {
        console.warn('[ErrorTracker] Failed to initialize Sentry:', error);
        this.sentryEnabled = false;
      });
    }

    this.isInitialized = true;
  }

  /**
   * Set up global error handlers
   */
  private initializeErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        {
          action: 'unhandledRejection',
          additionalData: { reason: event.reason },
        },
        'high'
      );
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.captureError(
        event.error || new Error(event.message),
        {
          action: 'globalError',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
        'high'
      );
    });
  }

  /**
   * Capture and log an error
   */
  captureError(
    error: Error | unknown,
    context: ErrorContext = {},
    severity: ErrorReport['severity'] = 'medium'
  ): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const report: ErrorReport = {
      error: errorObj,
      context: {
        ...context,
        route: window.location.pathname,
      },
      timestamp: new Date().toISOString(),
      severity,
    };

    // Add to queue
    this.errorQueue.push(report);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group(`[ErrorTracker] ${severity.toUpperCase()}`);
      console.error('Error:', errorObj.message);
      console.log('Stack:', errorObj.stack);
      console.log('Context:', context);
      console.groupEnd();
    }

    // Send to Sentry if enabled
    if (this.sentryEnabled) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(errorObj, {
          level: severity as any,
          contexts: { custom: context },
          tags: {
            component: context.component,
            action: context.action,
            route: context.route,
          },
        });
      });
    }

    // Log to Supabase for analytics (optional)
    this.logToDatabase(report);
  }

  /**
   * Capture a message (not an error)
   */
  captureMessage(
    message: string,
    context: ErrorContext = {},
    level: 'info' | 'warning' | 'error' = 'info'
  ): void {
    if (import.meta.env.DEV) {
      console.log(`[ErrorTracker] ${level.toUpperCase()}: ${message}`, context);
    }

    if (this.sentryEnabled) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureMessage(message, {
          level: level as any,
          contexts: { custom: context },
        });
      });
    }
  }

  /**
   * Log error to database for tracking
   */
  private async logToDatabase(report: ErrorReport): Promise<void> {
    // Only log critical errors to database to avoid spam
    if (report.severity !== 'critical' && !import.meta.env.DEV) {
      return;
    }

    try {
      // You can enable this to log to Supabase
      // const { error } = await supabase.from('error_logs').insert({
      //   error_message: report.error.message,
      //   error_stack: report.error.stack,
      //   context: report.context,
      //   severity: report.severity,
      //   user_id: report.context.userId,
      //   timestamp: report.timestamp,
      // });
      // if (error) console.error('Failed to log error to database:', error);
    } catch (e) {
      // Silently fail - don't want error logging to cause more errors
      console.error('Error logging failed:', e);
    }
  }

  /**
   * Set user context for error reports
   */
  setUser(user: { id: string; username?: string; email?: string }): void {
    if (this.sentryEnabled) {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser({ 
          id: user.id, 
          username: user.username, 
          email: user.email 
        });
      });
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    if (this.sentryEnabled) {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser(null);
      });
    }
  }

  /**
   * Get recent errors (for debugging)
   */
  getRecentErrors(count = 10): ErrorReport[] {
    return this.errorQueue.slice(-count);
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();

// Convenience functions
export const captureError = (
  error: Error | unknown,
  context?: ErrorContext,
  severity?: ErrorReport['severity']
) => errorTracker.captureError(error, context, severity);

export const captureMessage = (
  message: string,
  context?: ErrorContext,
  level?: 'info' | 'warning' | 'error'
) => errorTracker.captureMessage(message, context, level);

export const setUser = (user: { id: string; username?: string; email?: string }) =>
  errorTracker.setUser(user);

export const clearUser = () => errorTracker.clearUser();

// Initialize on import
errorTracker.initialize();
