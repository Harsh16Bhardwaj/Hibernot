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
        this.getCounter = 0;
        this.lastAPIhit = Date.now();
        this.inactivityTimer = null;
        // Validate options
        if (options.inactivityLimit <= 0) {
            throw new Error('inactivityLimit must be a positive number');
        }
        if (!options.keepAliveFn || typeof options.keepAliveFn !== 'function') {
            throw new Error('keepAliveFn must be a valid function');
        }
        this.options = options;
        this.resetInactivityTimer();
    }
    // Middleware to track API hits automatically
    middleware() {
        return (req, res, next) => {
            this.apiHit();
            next();
        };
    }
    apiHit() {
        this.getCounter++;
        this.lastAPIhit = Date.now();
        this.resetInactivityTimer();
    }
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        this.inactivityTimer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const timeSinceLastHit = Date.now() - this.lastAPIhit;
                if (timeSinceLastHit >= this.options.inactivityLimit) {
                    console.log(`No API hit for ${this.options.inactivityLimit / 1000} seconds. Executing keepAliveFn...`);
                    yield this.options.keepAliveFn();
                    this.lastAPIhit = Date.now(); // Update after keepAliveFn
                }
            }
            catch (err) {
                console.error('Keep-alive function failed:', err);
            }
            finally {
                // Restart timer
                this.resetInactivityTimer();
            }
        }), this.options.inactivityLimit);
    }
    getStats() {
        return {
            getCounter: this.getCounter,
            lastAPIhit: this.lastAPIhit,
        };
    }
    stop() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }
}
exports.Hibernot = Hibernot;
