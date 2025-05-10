export class Logger {
  private static instance: Logger
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info'

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  public setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level
  }

  public debug(message: string, data?: unknown): void {
    if (['debug'].includes(this.logLevel)) {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  }

  public info(message: string, data?: unknown): void {
    if (['debug', 'info'].includes(this.logLevel)) {
      console.info(`[INFO] ${message}`, data || '')
    }
  }

  public warn(message: string, data?: unknown): void {
    if (['debug', 'info', 'warn'].includes(this.logLevel)) {
      console.warn(`[WARN] ${message}`, data || '')
    }
  }

  public error(message: string, error?: unknown): void {
    if (['debug', 'info', 'warn', 'error'].includes(this.logLevel)) {
      console.error(`[ERROR] ${message}`, error || '')
    }
  }
}

export const logger = Logger.getInstance()
