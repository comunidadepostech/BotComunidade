export default interface ILoggerService {
    /**
     * Log a generic message.
     *
     * @param message The message to log
     * @param meta Optional metadata object
     */
    log(message: string, meta?: object): void;

    /**
     * Log an informational message.
     *
     * @param message The message to log
     * @param meta Optional metadata object
     */
    info(message: string, meta?: object): void;

    /**
     * Log an error message.
     *
     * @param message The message to log
     * @param meta Optional metadata object
     */
    error(message: string, meta?: object): void;

    /**
     * Log a warning message.
     *
     * @param message The message to log
     * @param meta Optional metadata object
     */
    warn(message: string, meta?: object): void;

    /**
     * Log an HTTP-related message.
     *
     * @param message The message to log
     * @param meta Optional metadata object
     */
    http(message: string, meta?: object): void;
}
