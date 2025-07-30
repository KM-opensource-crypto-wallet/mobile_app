// async_hooks-polyfill.js
class AsyncHook {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
        return this;
    }

    disable() {
        this.enabled = false;
        return this;
    }
}

class AsyncResource {
    constructor(type, options) {
        this.type = type;
        this.triggerAsyncId = (options && options.triggerAsyncId) || 0;
        this.requireManualDestroy = (options && options.requireManualDestroy) || false;
    }

    static bind(fn, type) {
        return fn;
    }

    bind(fn) {
        return fn;
    }

    runInAsyncScope(fn, thisArg, ...args) {
        return fn.apply(thisArg, args);
    }

    emitBefore() {}
    emitAfter() {}
    emitDestroy() {}
    asyncId() {
        return 1;
    }
    triggerAsyncId() {
        return 0;
    }
}

// Mock functions
const createHook = (callbacks) => new AsyncHook(callbacks);
const executionAsyncId = () => 1;
const triggerAsyncId = () => 0;
const executionAsyncResource = () => null;

module.exports = {
    createHook,
    executionAsyncId,
    triggerAsyncId,
    executionAsyncResource,
    AsyncResource,
    AsyncHook
};

