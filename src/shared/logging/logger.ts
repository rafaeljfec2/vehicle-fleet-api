type LogLevel = 'info' | 'error' | 'warn';

function write(level: LogLevel, message: string, meta?: unknown): void {
  const payload =
    meta === undefined
      ? { level, message, at: new Date().toISOString() }
      : { level, message, at: new Date().toISOString(), meta };
  const line = `${JSON.stringify(payload)}\n`;
  if (level === 'error') {
    process.stderr.write(line);
    return;
  }
  process.stderr.write(line);
}

export const logger = {
  info(message: string, meta?: unknown): void {
    write('info', message, meta);
  },
  warn(message: string, meta?: unknown): void {
    write('warn', message, meta);
  },
  error(message: string, meta?: unknown): void {
    write('error', message, meta);
  },
};
