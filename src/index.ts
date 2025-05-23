type KeepAliveOptions = {
  inactivityLimit: number;
  apiFn: ()=> Promise<void>;
  name?: string | undefined;
}

export class Hibernot{
  //Private stuff
  private getCounter = 0;
  private lastAPIHit = Date.now();
  private inactivityTimer: NodeJS.Timeout | null  = null;
  private options: KeepAliveOptions;

  constructor(options:KeepAliveOptions){
    if(typeof options.inactivityLimit !== 'number' || options.inactivityLimit <= 0){
      throw new Error('InactivityLimit must be a positive number');
    }
    if(typeof options.apiFn !== 'function'){
      throw new Error('apiFn provided is not a function');
    }

    this.options = options;
    this.resetInactivityTimer();
  }
  public middleware(){
  return (req: any, res: any, next: any) => {
    this.resetInactivityTimer();
    next();
  }
}

public apiHit(){
  this.getCounter++;
  this.lastAPIHit = Date.now();
  this.resetInactivityTimer();
}

private resetInactivityTimer(){
  if(this.inactivityTimer){
    clearTimeout(this.inactivityTimer);
  }
}
public getStats() {
    return {
      getCounter: this.getCounter,
      lastAPIhit: this.lastAPIHit,
      name: this.options.name || 'Unnamed',
    };
  }

  // Stop the timer for cleanup
  public stop() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}



