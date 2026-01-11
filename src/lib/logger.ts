/**
 * Production-safe logging utility
 * Removes console.log in production, keeps console.error
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  includeTimestamp: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true',
      minLevel: import.meta.env.PROD ? 'error' : 'debug',
      includeTimestamp: import.meta.env.DEV,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled && level !== 'error') {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): any[] {
    if (!this.config.includeTimestamp) {
      return [message, ...args];
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return [prefix, message, ...args];
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', message, error, ...args));
      
      // In production, also send to error tracker
      if (import.meta.env.PROD && error) {
        import('./errorTracking').then(({ captureError }) => {
          captureError(error, { component: 'Logger', additionalData: { message, args } });
        });
      }
    }
  }

  // Group logging for complex operations
  group(label: string): void {
    if (this.shouldLog('debug')) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog('debug')) {
      console.groupEnd();
    }
  }

  // Table logging for data structures
  table(data: any): void {
    if (this.shouldLog('debug')) {
      console.table(data);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  error: (message: string, error?: Error | unknown, ...args: any[]) => logger.error(message, error, ...args),
  group: (label: string) => logger.group(label),
  groupEnd: () => logger.groupEnd(),
  table: (data: any) => logger.table(data),
};

export default logger;
