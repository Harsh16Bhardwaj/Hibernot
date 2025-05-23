type KeepAliveOptions = {
    inactivityLimit: number;
    keepAliveFn: () => Promise<void>;
};
export declare class Hibernot {
    private getCounter;
    private lastAPIhit;
    private inactivityTimer;
    private options;
    constructor(options: KeepAliveOptions);
    middleware(): (req: any, res: any, next: () => void) => void;
    apiHit(): void;
    private resetInactivityTimer;
    getStats(): {
        getCounter: number;
        lastAPIhit: number;
    };
    stop(): void;
}
export {};
