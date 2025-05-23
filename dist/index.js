"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hibernot = exports.HibernotError = void 0;
// Custom error class for Hibernot-specific errors.
// Use this for all errors thrown by the Hibernot library, so consumers can distinguish them from other errors.
class HibernotError extends Error {
    constructor(message) {
        super(message);
        this.name = 'HibernotError';
    }
}
exports.HibernotError = HibernotError;
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
class Hibernot {
    /**
     * Constructor
     * Validates and sets up configuration, then starts the inactivity timer.
     *
     * @param config - HibernotConfig object (see type above)
     */
    constructor(config) {
        // Tracks the number of times registerActivity() has been called (i.e., API hits).
        this.activityCount = 1;
        // Stores the timestamp (ms since epoch) of the last activity.
        this.lastActivityTimestamp = Date.now();
        // Holds the reference to the current inactivity timer (Node.js Timeout object).
        this.inactivityTimeout = null;
        // Validate inactivityLimitMs: must be a positive number.
        if (typeof config.inactivityLimit !== 'number' || config.inactivityLimit <= 0) {
            throw new HibernotError('inactivityLimit must be a positive number');
        }
        // Validate keepAliveFn: must be a function.
        if (!config.keepAliveFn || typeof config.keepAliveFn !== 'function') {
            throw new HibernotError('keepAliveFn must be a valid async function');
        }
        // Validate maxRetryAttempts: if provided, must be a non-negative number.
        if (config.maxRetryAttempts !== undefined && (typeof config.maxRetryAttempts !== 'number' || config.maxRetryAttempts < 0)) {
            throw new HibernotError('maxRetryAttempts must be a non-negative number');
        }
        // Set config, providing a default for maxRetryAttempts if not specified.
        this.config = Object.assign(Object.assign({}, config), { maxRetryAttempts: config.maxRetryAttempts !== undefined ? config.maxRetryAttempts : 3 });
        // Start the inactivity timer.
        this.start();
    }
    /**
     * Express-style middleware generator.
     *
     * Use this in your Express app to automatically register activity on each request.
     * Example: app.use(hibernotInstance.middleware());
     */
    middleware() {
        return (req, res, next) => {
            this.registerActivity();
            next();
        };
    }
    /**
     * Registers an activity (e.g., API hit).
     * Increments the activity counter, updates the last activity timestamp, and resets the inactivity timer.
     * Call this manually if not using the middleware.
     */
    registerActivity() {
        this.activityCount++;
        this.lastActivityTimestamp = Date.now();
        this.resetInactivityTimeout();
    }
    /**
     * Starts (or restarts) the inactivity timer.
     * Call this if you want to manually restart the inactivity detection logic.
     */
    start() {
        this.resetInactivityTimeout();
    }
    /**
     * Resets the activity counter to zero.
     * Useful for monitoring or testing purposes.
     */
    resetActivityCount() {
        this.activityCount = 0;
    }
    /**
     * (Private) Resets the inactivity timer.
     * If the timer expires, checks if inactivityLimitMs has passed since last activity.
     * If so, logs a message, calls keepAliveFn (with retries), and registers a new activity.
     * Always resets the timer at the end (recursively).
     *
     * Dev note: If you want to change the inactivity logic, modify this method.
     */
    resetInactivityTimeout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.inactivityTimeout) {
                clearTimeout(this.inactivityTimeout);
            }
            this.inactivityTimeout = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    const msSinceLastActivity = Date.now() - this.lastActivityTimestamp;
                    if (msSinceLastActivity >= this.config.inactivityLimit) {
                        console.log(`[${this.config.instanceName || 'Hibernot'}] No activity for ${this.config.inactivityLimit / 1000} seconds. Executing keepAliveFn...`);
                        yield this.executeKeepAliveWithRetries();
                        // After keepAliveFn, register a new activity to reset the inactivity window.
                        this.registerActivity();
                    }
                }
                catch (err) {
                    // Log error if keepAliveFn fails after all retries.
                    console.error(`[${this.config.instanceName || 'Hibernot'}] Keep-alive function failed after retries:`, err);
                }
                finally {
                    // Always reset the timer for the next inactivity window.
                    this.resetInactivityTimeout();
                }
            }), this.config.inactivityLimit);
        });
    }
    /**
     * (Private) Executes keepAliveFn, retrying up to maxRetryAttempts times if it fails.
     * Waits 1 second between retries.
     * Throws the last error if all retries fail.
     *
     * Dev note: To change retry logic or backoff, edit this method.
     */
    executeKeepAliveWithRetries() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let lastError = null;
            const maxAttempts = (_a = this.config.maxRetryAttempts) !== null && _a !== void 0 ? _a : 3;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    yield this.config.keepAliveFn();
                    return; // Success, exit function.
                }
                catch (err) {
                    lastError = err;
                    console.warn(`[${this.config.instanceName || 'Hibernot'}] Keep-alive attempt ${attempt} failed:`, err);
                    // Wait 1 second before next retry, unless this was the last attempt.
                    if (attempt < maxAttempts) {
                        yield new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
            // All retries failed, throw the last error.
            throw lastError || new HibernotError('keepAliveFn failed after all retries');
        });
    }
    /**
     * Returns statistics about the Hibernot instance:
     * - activityCount: number of registered activities (API hits)
     * - lastActivityTimestamp: timestamp of last activity
     * - instanceName: instance name (or 'Unnamed' if not set)
     *
     * Dev note: Extend this if you want to expose more metrics.
     */
    getStats() {
        return {
            activityCount: this.activityCount,
            lastActivityTimestamp: this.lastActivityTimestamp,
            instanceName: this.config.instanceName || 'Unnamed',
        };
    }
    /**
     * Stops the inactivity timer, preventing further keepAliveFn calls.
     * Call this if you want to disable inactivity detection (e.g., during shutdown).
     */
    stop() {
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }
    }
}
exports.Hibernot = Hibernot;
