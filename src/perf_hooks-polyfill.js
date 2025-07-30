// perf_hooks-polyfill.js
// Polyfill for Node.js perf_hooks module in React Native

// Get the start time for relative measurements
const startTime = Date.now();

// Try to use native performance.now() if available, fallback to Date-based timing
const now = (() => {
    if (typeof global.performance !== 'undefined' &&
        typeof global.performance.now === 'function') {
        return () => global.performance.now();
    }
    return () => Date.now() - startTime;
})();

// Performance Entry classes
class PerformanceEntry {
    constructor(name, entryType, startTime, duration) {
        this.name = name;
        this.entryType = entryType;
        this.startTime = startTime;
        this.duration = duration;
    }

    toJSON() {
        return {
            name: this.name,
            entryType: this.entryType,
            startTime: this.startTime,
            duration: this.duration
        };
    }
}

class PerformanceMark extends PerformanceEntry {
    constructor(name, startTime) {
        super(name, 'mark', startTime, 0);
    }
}

class PerformanceMeasure extends PerformanceEntry {
    constructor(name, startTime, duration) {
        super(name, 'measure', startTime, duration);
    }
}

class PerformanceNodeTiming extends PerformanceEntry {
    constructor() {
        const currentTime = now();
        super('node', 'node', 0, 0);
        this.bootstrapComplete = currentTime;
        this.environment = currentTime;
        this.loopExit = -1;
        this.loopStart = currentTime;
        this.nodeStart = currentTime;
        this.v8Start = currentTime;
    }
}

// Main Performance class
class Performance {
    constructor() {
        this._marks = new Map();
        this._measures = [];
        this.nodeTiming = new PerformanceNodeTiming();
        this.timeOrigin = startTime;
    }

    now() {
        return now();
    }

    mark(name, options = {}) {
        if (typeof name !== 'string') {
            throw new TypeError('Performance mark name must be a string');
        }

        const timestamp = typeof options.startTime === 'number' ? options.startTime : this.now();
        const mark = new PerformanceMark(name, timestamp);
        this._marks.set(name, mark);
        return mark;
    }

    measure(name, startMark, endMark) {
        if (typeof name !== 'string') {
            throw new TypeError('Performance measure name must be a string');
        }

        let startTime = 0;
        let endTime = this.now();

        // Handle start mark
        if (typeof startMark === 'string') {
            const mark = this._marks.get(startMark);
            if (!mark) {
                throw new Error(`Performance mark '${startMark}' does not exist`);
            }
            startTime = mark.startTime;
        } else if (typeof startMark === 'number') {
            startTime = startMark;
        }

        // Handle end mark
        if (typeof endMark === 'string') {
            const mark = this._marks.get(endMark);
            if (!mark) {
                throw new Error(`Performance mark '${endMark}' does not exist`);
            }
            endTime = mark.startTime;
        } else if (typeof endMark === 'number') {
            endTime = endMark;
        }

        const duration = endTime - startTime;
        const measure = new PerformanceMeasure(name, startTime, duration);
        this._measures.push(measure);
        return measure;
    }

    clearMarks(name) {
        if (name === undefined) {
            this._marks.clear();
        } else {
            this._marks.delete(name);
        }
    }

    clearMeasures(name) {
        if (name === undefined) {
            this._measures = [];
        } else {
            this._measures = this._measures.filter(measure => measure.name !== name);
        }
    }

    getEntries() {
        const marks = Array.from(this._marks.values());
        return [...marks, ...this._measures].sort((a, b) => a.startTime - b.startTime);
    }

    getEntriesByName(name, type) {
        let entries = this.getEntries().filter(entry => entry.name === name);
        if (type) {
            entries = entries.filter(entry => entry.entryType === type);
        }
        return entries;
    }

    getEntriesByType(type) {
        return this.getEntries().filter(entry => entry.entryType === type);
    }

    // Node.js specific methods
    eventLoopUtilization(util1, util2) {
        // Mock implementation since we can't measure event loop in React Native
        return {
            idle: 0.95,
            active: 0.05,
            utilization: 0.05
        };
    }

    markResourceTiming() {
        // No-op in React Native
    }

    timerify(fn, options = {}) {
        const name = options.histogram?.name || fn.name || 'timerified-function';

        return function timerified(...args) {
            const startMark = `${name}-start-${Math.random()}`;
            const endMark = `${name}-end-${Math.random()}`;

            performance.mark(startMark);

            try {
                const result = fn.apply(this, args);

                // Handle promises
                if (result && typeof result.then === 'function') {
                    return result.then(
                        value => {
                            performance.mark(endMark);
                            performance.measure(name, startMark, endMark);
                            return value;
                        },
                        error => {
                            performance.mark(endMark);
                            performance.measure(name, startMark, endMark);
                            throw error;
                        }
                    );
                } else {
                    performance.mark(endMark);
                    performance.measure(name, startMark, endMark);
                    return result;
                }
            } catch (error) {
                performance.mark(endMark);
                performance.measure(name, startMark, endMark);
                throw error;
            }
        };
    }
}

// PerformanceObserver class
class PerformanceObserver {
    constructor(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        this.callback = callback;
        this.entryTypes = [];
        this.connected = false;
    }

    observe(options) {
        if (!options || (!options.entryTypes && !options.type)) {
            throw new TypeError('Must specify entryTypes or type');
        }

        this.entryTypes = options.entryTypes || [options.type];
        this.connected = true;

        // In a real implementation, this would start observing
        // For React Native, we just warn that it's mocked
        if (__DEV__) {
            console.warn('PerformanceObserver.observe() is mocked in React Native');
        }
    }

    disconnect() {
        this.connected = false;
        this.entryTypes = [];
    }

    takeRecords() {
        return [];
    }

    static get supportedEntryTypes() {
        return ['mark', 'measure', 'node', 'gc', 'function', 'http', 'http2'];
    }
}

// Event loop monitoring (mocked)
class IntervalHistogram {
    constructor() {
        this.min = 0;
        this.max = 0;
        this.mean = 0;
        this.stddev = 0;
    }

    percentile(percentile) {
        return 0;
    }

    reset() {
        // No-op
    }

    get exceeds() {
        return 0;
    }
}

function monitorEventLoopDelay(options = {}) {
    const histogram = new IntervalHistogram();

    return {
        histogram,
        enable() {
            if (__DEV__) {
                console.warn('monitorEventLoopDelay is mocked in React Native');
            }
            return true;
        },
        disable() {
            return true;
        }
    };
}

function createHistogram(options = {}) {
    return new IntervalHistogram();
}

// Create the performance instance
const performance = new Performance();

// Set global performance if it doesn't exist
if (typeof global.performance === 'undefined') {
    global.performance = performance;
}

// Export all the things that packages might need
module.exports = {
    performance,
    PerformanceObserver,
    PerformanceEntry,
    PerformanceMark,
    PerformanceMeasure,
    PerformanceNodeTiming,
    monitorEventLoopDelay,
    createHistogram
};

