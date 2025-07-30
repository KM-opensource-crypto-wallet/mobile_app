// worker_threads-polyfill.js
class Worker {
    constructor(filename, options = {}) {
        this.filename = filename;
        this.options = options;
        this.terminated = false;
        this.listeners = new Map();

        // Simulate async initialization
        setTimeout(() => {
            this.emit('online');
        }, 0);
    }

    postMessage(data) {
        // In a real implementation, this would send to worker
        // For mock, we'll just echo back or ignore
        setTimeout(() => {
            this.emit('message', { data: `Echo: ${JSON.stringify(data)}` });
        }, 0);
    }

    terminate() {
        this.terminated = true;
        this.emit('exit', 0);
        return Promise.resolve(0);
    }

    on(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(listener);
    }

    off(event, listener) {
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(listener => {
                try {
                    listener(...args);
                } catch (error) {
                    console.error('Worker event listener error:', error);
                }
            });
        }
    }
}

class MessageChannel {
    constructor() {
        this.port1 = new MessagePort();
        this.port2 = new MessagePort();

        // Connect ports
        this.port1._otherPort = this.port2;
        this.port2._otherPort = this.port1;
    }
}

class MessagePort {
    constructor() {
        this.listeners = new Map();
        this._otherPort = null;
    }

    postMessage(data) {
        if (this._otherPort) {
            setTimeout(() => {
                this._otherPort.emit('message', { data });
            }, 0);
        }
    }

    on(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(listener);
    }

    off(event, listener) {
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(listener => {
                try {
                    listener(...args);
                } catch (error) {
                    console.error('MessagePort event listener error:', error);
                }
            });
        }
    }

    start() {
        // No-op in polyfill
    }

    close() {
        this.listeners.clear();
    }
}

// Mock worker thread globals
const isMainThread = true;
const parentPort = null;
const workerData = null;
const threadId = 0;

// Export everything
module.exports = {
    Worker,
    isMainThread,
    parentPort,
    workerData,
    threadId,
    MessageChannel,
    MessagePort
};

