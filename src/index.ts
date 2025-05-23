// Custom error class for Hibernot-specific errors.
// Use this for all errors thrown by the Hibernot library, so consumers can distinguish them from other errors.
export class HibernotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HibernotError';
  }
}

// Type definition for the configuration object required by Hibernot.
// - inactivityLimitMs: Time in milliseconds to wait before triggering keepAliveFn after inactivity.
// - keepAliveFn: An async function to be called when inactivityLimitMs is reached.
// - instanceName: Optional identifier for logging/debugging.
// - maxRetryAttempts: Optional number of times to retry keepAliveFn on failure.
type HibernotConfig = {
  inactivityLimit: number; // ms
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
export class Hibernot {
  // Tracks the number of times registerActivity() has been called (i.e., API hits).
  private activityCount = 1;
  // Stores the timestamp (ms since epoch) of the last activity.
  private lastActivityTimestamp = Date.now();
  // Holds the reference to the current inactivity timer (Node.js Timeout object).
  private inactivityTimeout: NodeJS.Timeout | null = null;
  // Stores the configuration options for this instance.
  private config: HibernotConfig;

  /**
   * Constructor
   * Validates and sets up configuration, then starts the inactivity timer.
   * 
   * @param config - HibernotConfig object (see type above)
   */
  constructor(config: HibernotConfig) {
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
    this.config = {
      ...config,
      maxRetryAttempts: config.maxRetryAttempts !== undefined ? config.maxRetryAttempts : 3,
    };
    // Start the inactivity timer.
    this.start();
  }

  /**
   * Express-style middleware generator.
   * 
   * Use this in your Express app to automatically register activity on each request.
   * Example: app.use(hibernotInstance.middleware());
   */
  public middleware() {
    return (req: any, res: any, next: () => void) => {
      this.registerActivity();
      next();
    };
  }

  /**
   * Registers an activity (e.g., API hit).
   * Increments the activity counter, updates the last activity timestamp, and resets the inactivity timer.
   * Call this manually if not using the middleware.
   */
  public registerActivity() {
    this.activityCount++;
    this.lastActivityTimestamp = Date.now();
    this.resetInactivityTimeout();
  }

  /**
   * Starts (or restarts) the inactivity timer.
   * Call this if you want to manually restart the inactivity detection logic.
   */
  public start() {
    this.resetInactivityTimeout();
  }

  /**
   * Resets the activity counter to zero.
   * Useful for monitoring or testing purposes.
   */
  public resetActivityCount() {
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
  private async resetInactivityTimeout() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    this.inactivityTimeout = setTimeout(async () => {
      try {
        const msSinceLastActivity = Date.now() - this.lastActivityTimestamp;
        if (msSinceLastActivity >= this.config.inactivityLimit) {
          console.log(
            `[${this.config.instanceName || 'Hibernot'}] No activity for ${
              this.config.inactivityLimit / 1000
            } seconds. Executing keepAliveFn...`
          );
          await this.executeKeepAliveWithRetries();
          // After keepAliveFn, register a new activity to reset the inactivity window.
          this.registerActivity();
        }
      } catch (err) {
        // Log error if keepAliveFn fails after all retries.
        console.error(`[${this.config.instanceName || 'Hibernot'}] Keep-alive function failed after retries:`, err);
      } finally {
        // Always reset the timer for the next inactivity window.
        this.resetInactivityTimeout();
      }
    }, this.config.inactivityLimit);
  }

  /**
   * (Private) Executes keepAliveFn, retrying up to maxRetryAttempts times if it fails.
   * Waits 1 second between retries.
   * Throws the last error if all retries fail.
   * 
   * Dev note: To change retry logic or backoff, edit this method.
   */
  private async executeKeepAliveWithRetries() {
    let lastError: Error | null = null;
    const maxAttempts = this.config.maxRetryAttempts ?? 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.config.keepAliveFn();
        return; // Success, exit function.
      } catch (err) {
        lastError = err as Error;
        console.warn(
          `[${this.config.instanceName || 'Hibernot'}] Keep-alive attempt ${attempt} failed:`,
          err
        );
        // Wait 1 second before next retry, unless this was the last attempt.
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    // All retries failed, throw the last error.
    throw lastError || new HibernotError('keepAliveFn failed after all retries');
  }

  /**
   * Returns statistics about the Hibernot instance:
   * - activityCount: number of registered activities (API hits)
   * - lastActivityTimestamp: timestamp of last activity
   * - instanceName: instance name (or 'Unnamed' if not set)
   * 
   * Dev note: Extend this if you want to expose more metrics.
   */
  public getStats() {
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
  public stop() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }
}
