export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export interface LogContext {
    service: string;
    executionId?: string;
    userId?: string;
    [key: string]: unknown;
}
export declare class Logger {
    private context;
    constructor(context: LogContext);
    private log;
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    child(additionalContext: Record<string, unknown>): Logger;
}
export declare function createLogger(service: string, context?: Record<string, unknown>): Logger;
//# sourceMappingURL=logger.d.ts.map