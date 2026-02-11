/**
 * Structured logging for API routes.
 *
 * Outputs JSON logs in production (for Vercel log drain / Sentry),
 * human-readable logs in development.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('debate.created', { debateId, topic, userId });
 *   logger.error('debate.score.failed', { debateId, error: err.message });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  event: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

const isProd = process.env.NODE_ENV === 'production';

function formatLog(entry: LogEntry): string {
  if (isProd) {
    // Structured JSON for log aggregation
    return JSON.stringify(entry);
  }
  // Human-readable for development
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `[${entry.level.toUpperCase()}] ${entry.event}${dataStr}`;
}

function log(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
  };

  const message = formatLog(entry);

  switch (level) {
    case 'error':
      console.error(message);
      break;
    case 'warn':
      console.warn(message);
      break;
    case 'debug':
      if (!isProd) console.debug(message);
      break;
    default:
      console.log(message);
  }
}

type LogFn = (event: string, data?: Record<string, unknown>) => void;

interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  scope: (prefix: string) => { debug: LogFn; info: LogFn; warn: LogFn; error: LogFn };
}

export const logger: Logger = {
  debug: (event, data) => log('debug', event, data),
  info: (event, data) => log('info', event, data),
  warn: (event, data) => log('warn', event, data),
  error: (event, data) => log('error', event, data),

  /**
   * Create a scoped logger with a prefix.
   * Useful for per-route or per-module logging.
   *
   *   const log = logger.scope('debate');
   *   log.info('created', { debateId }); // → debate.created
   */
  scope: (prefix: string) => ({
    debug: (event: string, data?: Record<string, unknown>) => log('debug', `${prefix}.${event}`, data),
    info: (event: string, data?: Record<string, unknown>) => log('info', `${prefix}.${event}`, data),
    warn: (event: string, data?: Record<string, unknown>) => log('warn', `${prefix}.${event}`, data),
    error: (event: string, data?: Record<string, unknown>) => log('error', `${prefix}.${event}`, data),
  }),
};
