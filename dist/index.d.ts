export declare class HibernotError extends Error {
    constructor(message: string);
}
type HibernotConfig = {
    inactivityLimit: number;
    keepAliveFn: () => Promise<void>;
    instanceName?: string;
    maxRetryAttempts?: number;
};
/**
 * Hibernot
 *
 * Main class that manages inactivity detection and keep-alive logic.
 *
 * Usage: Instantiate with a config object, then use the middleware() in your Express app.
 *
 * This class is designed to help keep your service "warm" by calling a keep-alive function
 * after a period of inactivity, with optional retry logic.
 */
export declare class Hibernot {
    private activityCount;
    private lastActivityTimestamp;
    private inactivityTimeout;
    private config;
    /**
     * Constructor
     * Validates and sets up configuration, then starts the inactivity timer.
     *
     * @param config - HibernotConfig object (see type above)
     */
    constructor(config: HibernotConfig);
    /**
     * Express-style middleware generator.
     *
     * Use this in your Express app to automatically register activity on each request.
     * Example: app.use(hibernotInstance.middleware());
     */
    middleware(): (req: any, res: any, next: () => void) => void;
    /**
     * Registers an activity (e.g., API hit).
     * Increments the activity counter, updates the last activity timestamp, and resets the inactivity timer.
     * Call this manually if not using the middleware.
     */
    registerActivity(): void;
    /**
     * Starts (or restarts) the inactivity timer.
     * Call this if you want to manually restart the inactivity detection logic.
     */
    start(): void;
    /**
     * Resets the activity counter to zero.
     * Useful for monitoring or testing purposes.
     */
    resetActivityCount(): void;
    /**
     * (Private) Resets the inactivity timer.
     * If the timer expires, checks if inactivityLimitMs has passed since last activity.
     * If so, logs a message, calls keepAliveFn (with retries), and registers a new activity.
     * Always resets the timer at the end (recursively).
     *
     * Dev note: If you want to change the inactivity logic, modify this method.
     */
    private resetInactivityTimeout;
    /**
     * (Private) Executes keepAliveFn, retrying up to maxRetryAttempts times if it fails.
     * Waits 1 second between retries.
     * Throws the last error if all retries fail.
     *
     * Dev note: To change retry logic or backoff, edit this method.
     */
    private executeKeepAliveWithRetries;
    /**
     * Returns statistics about the Hibernot instance:
     * - activityCount: number of registered activities (API hits)
     * - lastActivityTimestamp: timestamp of last activity
     * - instanceName: instance name (or 'Unnamed' if not set)
     *
     * Dev note: Extend this if you want to expose more metrics.
     */
    getStats(): {
        activityCount: number;
        lastActivityTimestamp: number;
        instanceName: string;
    };
    /**
     * Stops the inactivity timer, preventing further keepAliveFn calls.
     * Call this if you want to disable inactivity detection (e.g., during shutdown).
     */
    stop(): void;
}
export {};
