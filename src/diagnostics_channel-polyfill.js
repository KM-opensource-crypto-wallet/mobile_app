// diagnostics_channel-polyfill.js
// Polyfill for Node.js diagnostics_channel module in React Native

// Store channels and their subscribers
const channels = new Map();
const subscribers = new Map();

class Channel {
    constructor(name) {
        this.name = name;
        this._subscribers = new Set();
    }

    get hasSubscribers() {
        return this._subscribers.size > 0;
    }

    publish(message) {
        if (this._subscribers.size === 0) {
            return false;
        }

        // Call all subscribers with the message
        for (const subscriber of this._subscribers) {
            try {
                subscriber(message, this.name);
            } catch (error) {
                // In Node.js, subscriber errors don't stop other subscribers
                if (__DEV__) {
                    console.error(`Diagnostics channel subscriber error for "${this.name}":`, error);
                }
            }
        }

        return true;
    }

    subscribe(onMessage) {
        if (typeof onMessage !== 'function') {
            throw new TypeError('Subscriber must be a function');
        }

        this._subscribers.add(onMessage);

        // Update global subscribers map
        if (!subscribers.has(this.name)) {
            subscribers.set(this.name, new Set());
        }
        subscribers.get(this.name).add(onMessage);
    }

    unsubscribe(onMessage) {
        if (typeof onMessage !== 'function') {
            return false;
        }

        const wasSubscribed = this._subscribers.delete(onMessage);

        // Update global subscribers map
        if (subscribers.has(this.name)) {
            subscribers.get(this.name).delete(onMessage);
            if (subscribers.get(this.name).size === 0) {
                subscribers.delete(this.name);
            }
        }

        return wasSubscribed;
    }

    bindStore(store, transform) {
        // Mock implementation - in real Node.js this binds AsyncLocalStorage
        return (message, name) => {
            if (typeof transform === 'function') {
                message = transform(message);
            }
            // In React Native, we can't really bind to AsyncLocalStorage
            // so we just pass through
        };
    }
}

class TracingChannel {
    constructor(channels) {
        if (typeof channels === 'string') {
            // Single channel name provided
            const baseName = channels;
            this.start = channel(`${baseName}.start`);
            this.end = channel(`${baseName}.end`);
            this.asyncStart = channel(`${baseName}.asyncStart`);
            this.asyncEnd = channel(`${baseName}.asyncEnd`);
            this.error = channel(`${baseName}.error`);
        } else if (typeof channels === 'object' && channels !== null) {
            // Channel object provided
            this.start = channels.start || null;
            this.end = channels.end || null;
            this.asyncStart = channels.asyncStart || null;
            this.asyncEnd = channels.asyncEnd || null;
            this.error = channels.error || null;
        } else {
            throw new TypeError('Channels must be a string or object');
        }
    }

    get hasSubscribers() {
        return (this.start && this.start.hasSubscribers) ||
            (this.end && this.end.hasSubscribers) ||
            (this.asyncStart && this.asyncStart.hasSubscribers) ||
            (this.asyncEnd && this.asyncEnd.hasSubscribers) ||
            (this.error && this.error.hasSubscribers);
    }

    subscribe(subscribers) {
        if (typeof subscribers !== 'object' || subscribers === null) {
            throw new TypeError('Subscribers must be an object');
        }

        if (subscribers.start && this.start) {
            this.start.subscribe(subscribers.start);
        }
        if (subscribers.end && this.end) {
            this.end.subscribe(subscribers.end);
        }
        if (subscribers.asyncStart && this.asyncStart) {
            this.asyncStart.subscribe(subscribers.asyncStart);
        }
        if (subscribers.asyncEnd && this.asyncEnd) {
            this.asyncEnd.subscribe(subscribers.asyncEnd);
        }
        if (subscribers.error && this.error) {
            this.error.subscribe(subscribers.error);
        }
    }

    unsubscribe(subscribers) {
        if (typeof subscribers !== 'object' || subscribers === null) {
            throw new TypeError('Subscribers must be an object');
        }

        let unsubscribed = false;

        if (subscribers.start && this.start) {
            unsubscribed = this.start.unsubscribe(subscribers.start) || unsubscribed;
        }
        if (subscribers.end && this.end) {
            unsubscribed = this.end.unsubscribe(subscribers.end) || unsubscribed;
        }
        if (subscribers.asyncStart && this.asyncStart) {
            unsubscribed = this.asyncStart.unsubscribe(subscribers.asyncStart) || unsubscribed;
        }
        if (subscribers.asyncEnd && this.asyncEnd) {
            unsubscribed = this.asyncEnd.unsubscribe(subscribers.asyncEnd) || unsubscribed;
        }
        if (subscribers.error && this.error) {
            unsubscribed = this.error.unsubscribe(subscribers.error) || unsubscribed;
        }

        return unsubscribed;
    }

    traceSync(fn, context = {}, thisArg, ...args) {
        if (typeof fn !== 'function') {
            throw new TypeError('Function must be provided');
        }

        if (!this.hasSubscribers) {
            return fn.apply(thisArg, args);
        }

        // Publish start event
        if (this.start && this.start.hasSubscribers) {
            this.start.publish({ ...context, args });
        }

        try {
            const result = fn.apply(thisArg, args);

            // Publish end event
            if (this.end && this.end.hasSubscribers) {
                this.end.publish({ ...context, result });
            }

            return result;
        } catch (error) {
            // Publish error event
            if (this.error && this.error.hasSubscribers) {
                this.error.publish({ ...context, error });
            }

            throw error;
        }
    }

    traceAsync(fn, context = {}, thisArg, ...args) {
        if (typeof fn !== 'function') {
            throw new TypeError('Function must be provided');
        }

        if (!this.hasSubscribers) {
            return fn.apply(thisArg, args);
        }

        // Publish async start event
        if (this.asyncStart && this.asyncStart.hasSubscribers) {
            this.asyncStart.publish({ ...context, args });
        }

        try {
            const result = fn.apply(thisArg, args);

            if (result && typeof result.then === 'function') {
                return result.then(
                    value => {
                        // Publish async end event
                        if (this.asyncEnd && this.asyncEnd.hasSubscribers) {
                            this.asyncEnd.publish({ ...context, result: value });
                        }
                        return value;
                    },
                    error => {
                        // Publish error event
                        if (this.error && this.error.hasSubscribers) {
                            this.error.publish({ ...context, error });
                        }
                        throw error;
                    }
                );
            } else {
                // Not a promise, treat as sync
                if (this.asyncEnd && this.asyncEnd.hasSubscribers) {
                    this.asyncEnd.publish({ ...context, result });
                }
                return result;
            }
        } catch (error) {
            // Publish error event
            if (this.error && this.error.hasSubscribers) {
                this.error.publish({ ...context, error });
            }
            throw error;
        }
    }

    tracePromise(fn, context = {}, thisArg, ...args) {
        // Alias for traceAsync for compatibility
        return this.traceAsync(fn, context, thisArg, ...args);
    }

    traceCallback(fn, position = -1, context = {}, thisArg, ...args) {
        if (typeof fn !== 'function') {
            throw new TypeError('Function must be provided');
        }

        if (!this.hasSubscribers) {
            return fn.apply(thisArg, args);
        }

        // This is a complex implementation in Node.js that wraps callbacks
        // For React Native, we'll provide a simplified version
        if (this.start && this.start.hasSubscribers) {
            this.start.publish({ ...context, args });
        }

        try {
            const result = fn.apply(thisArg, args);
            if (this.end && this.end.hasSubscribers) {
                this.end.publish({ ...context, result });
            }
            return result;
        } catch (error) {
            if (this.error && this.error.hasSubscribers) {
                this.error.publish({ ...context, error });
            }
            throw error;
        }
    }
}

// Main channel function - creates or gets a channel
function channel(name) {
    if (typeof name !== 'string') {
        throw new TypeError('Channel name must be a string');
    }

    if (channels.has(name)) {
        return channels.get(name);
    }

    const newChannel = new Channel(name);
    channels.set(name, newChannel);
    return newChannel;
}

// Check if a channel has subscribers
function hasSubscribers(name) {
    if (typeof name !== 'string') {
        throw new TypeError('Channel name must be a string');
    }

    return subscribers.has(name) && subscribers.get(name).size > 0;
}

// Subscribe to a channel
function subscribe(name, onMessage) {
    if (typeof name !== 'string') {
        throw new TypeError('Channel name must be a string');
    }

    const ch = channel(name);
    ch.subscribe(onMessage);
}

// Unsubscribe from a channel
function unsubscribe(name, onMessage) {
    if (typeof name !== 'string') {
        throw new TypeError('Channel name must be a string');
    }

    if (channels.has(name)) {
        return channels.get(name).unsubscribe(onMessage);
    }

    return false;
}

// Create a tracing channel
function tracingChannel(nameOrChannels) {
    return new TracingChannel(nameOrChannels);
}

// Export the main functions
module.exports = {
    channel,
    hasSubscribers,
    subscribe,
    unsubscribe,
    tracingChannel,
    Channel,
    TracingChannel
};


// Warn in development that this is a polyfill
if (__DEV__) {
    console.warn('Using diagnostics_channel polyfill in React Native - some functionality may be limited');
}
