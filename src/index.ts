type KeepAliveOptions = {
  interval: number,
  inactivityLimit: number, // ms
  keepAliveFn: () => Promise<void>
};

export class Hibernot {
  private static getCounter = 0;
  private lastAPIhit = Date.now();
  private inactivityTimer: NodeJS.Timeout | null = null;
  private options: KeepAliveOptions;

  constructor(options: KeepAliveOptions) {
    this.options = options;
    setInterval(async () => {
      try {
        await this.options.keepAliveFn();
        console.log('Hibernot initisalisation successful');
      } catch (err) {
        console.error('Hibernot initialisation failed:', err);
      }
    }, this.options.interval);
    this.resetInactivityTimer();
  }

  public apiHit() {
    this.getCounter++;
    this.lastAPIhit = Date.now();
    this.resetInactivityTimer();
  }

  private resetInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      console.log('No API hit for', this.options.inactivityLimit / 1000, 'seconds. Self-hitting the API...');
      this.options.keepAliveFn();
    }, this.options.inactivityLimit);
  }

  public getStats() {
    return {
      getCounter: this.getCounter,
      lastAPIhit: this.lastAPIhit
    };
  }
}
