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
exports.Hibernot = void 0;
class Hibernot {
    constructor(options) {
        this.getCounter = 0; // Fixed: removed static
        this.lastAPIhit = Date.now();
        this.inactivityTimer = null;
        this.options = options;
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.options.keepAliveFn();
                console.log('Hibernot initialisation successful');
            }
            catch (err) {
                console.error('Hibernot initialisation failed:', err);
            }
        }), this.options.interval);
        this.resetInactivityTimer();
    }
    apiHit() {
        this.getCounter++;
        this.lastAPIhit = Date.now();
        this.resetInactivityTimer();
    }
    resetInactivityTimer() {
        if (this.inactivityTimer)
            clearTimeout(this.inactivityTimer);
        this.inactivityTimer = setTimeout(() => {
            console.log('No API hit for', this.options.inactivityLimit / 1000, 'seconds. Self-hitting the API...');
            this.options.keepAliveFn();
        }, this.options.inactivityLimit);
    }
    getStats() {
        return {
            getCounter: this.getCounter,
            lastAPIhit: this.lastAPIhit
        };
    }
}
exports.Hibernot = Hibernot;
