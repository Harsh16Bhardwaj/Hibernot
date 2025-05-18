type KeepAliveOptions = {
    interval: number;
    inactivityLimit: number;
    keepAliveFn: () => Promise<void>;
};
export declare class Hibernot {
    private getCounter;
    private lastAPIhit;
    private inactivityTimer;
    private options;
    constructor(options: KeepAliveOptions);
    apiHit(): void;
    private resetInactivityTimer;
    getStats(): {
        getCounter: number;
        lastAPIhit: number;
    };
}
export {};
