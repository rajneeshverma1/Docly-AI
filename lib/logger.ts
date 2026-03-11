/**
 * Minimal structured logger.
 * Wraps console with level prefixes and JSON-safe serialisation.
 * Replace with Pino/Winston in production.
 */

type Level = 'info' | 'warn' | 'error' | 'debug';

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(meta ?? {}),
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') log('debug', msg, meta);
  },
};

// Dev note 6: incremental maintenance update on 2026-03-01.

// Dev note 16: incremental maintenance update on 2026-03-11.

// Dev note 26: incremental maintenance update on 2026-03-21.

// Dev note 6: incremental maintenance update on 2026-03-01.

// Dev note 16: incremental maintenance update on 2026-03-11.
