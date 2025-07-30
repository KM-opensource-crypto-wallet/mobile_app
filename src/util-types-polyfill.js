// util-types-polyfill.js
// Polyfill for Node.js util/types module in React Native

// Type checking utilities
function isArrayBuffer(value) {
    return value instanceof ArrayBuffer;
}

function isUint8Array(value) {
    return value instanceof Uint8Array;
}

function isUint8ClampedArray(value) {
    return value instanceof Uint8ClampedArray;
}

function isUint16Array(value) {
    return value instanceof Uint16Array;
}

function isUint32Array(value) {
    return value instanceof Uint32Array;
}

function isInt8Array(value) {
    return value instanceof Int8Array;
}

function isInt16Array(value) {
    return value instanceof Int16Array;
}

function isInt32Array(value) {
    return value instanceof Int32Array;
}

function isFloat32Array(value) {
    return value instanceof Float32Array;
}

function isFloat64Array(value) {
    return value instanceof Float64Array;
}

function isBigInt64Array(value) {
    return typeof BigInt64Array !== 'undefined' && value instanceof BigInt64Array;
}

function isBigUint64Array(value) {
    return typeof BigUint64Array !== 'undefined' && value instanceof BigUint64Array;
}

function isTypedArray(value) {
    return isUint8Array(value) ||
        isUint8ClampedArray(value) ||
        isUint16Array(value) ||
        isUint32Array(value) ||
        isInt8Array(value) ||
        isInt16Array(value) ||
        isInt32Array(value) ||
        isFloat32Array(value) ||
        isFloat64Array(value) ||
        isBigInt64Array(value) ||
        isBigUint64Array(value);
}

function isArrayBufferView(value) {
    return ArrayBuffer.isView(value);
}

function isSharedArrayBuffer(value) {
    return typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer;
}

function isDataView(value) {
    return value instanceof DataView;
}

function isDate(value) {
    return value instanceof Date;
}

function isArgumentsObject(value) {
    return Object.prototype.toString.call(value) === '[object Arguments]';
}

function isBigIntObject(value) {
    return typeof value === 'object' &&
        value !== null &&
        typeof value.valueOf === 'function' &&
        typeof value.valueOf() === 'bigint';
}

function isBooleanObject(value) {
    return typeof value === 'object' &&
        value !== null &&
        value instanceof Boolean;
}

function isNumberObject(value) {
    return typeof value === 'object' &&
        value !== null &&
        value instanceof Number;
}

function isStringObject(value) {
    return typeof value === 'object' &&
        value !== null &&
        value instanceof String;
}

function isSymbolObject(value) {
    return typeof value === 'object' &&
        value !== null &&
        typeof value.valueOf === 'function' &&
        typeof value.valueOf() === 'symbol';
}

function isNativeError(value) {
    return value instanceof Error ||
        value instanceof EvalError ||
        value instanceof RangeError ||
        value instanceof ReferenceError ||
        value instanceof SyntaxError ||
        value instanceof TypeError ||
        value instanceof URIError;
}

function isRegExp(value) {
    return value instanceof RegExp;
}

function isGeneratorFunction(value) {
    if (typeof value !== 'function') return false;
    const constructor = value.constructor;
    if (!constructor) return false;
    if (constructor.name === 'GeneratorFunction' ||
        constructor.displayName === 'GeneratorFunction') return true;
    return false;
}

function isGeneratorObject(value) {
    return typeof value === 'object' &&
        value !== null &&
        typeof value.next === 'function' &&
        typeof value.throw === 'function' &&
        typeof value.return === 'function';
}

function isAsyncFunction(value) {
    if (typeof value !== 'function') return false;
    const constructor = value.constructor;
    if (!constructor) return false;
    if (constructor.name === 'AsyncFunction' ||
        constructor.displayName === 'AsyncFunction') return true;
    return false;
}

function isAsyncGeneratorFunction(value) {
    if (typeof value !== 'function') return false;
    const constructor = value.constructor;
    if (!constructor) return false;
    if (constructor.name === 'AsyncGeneratorFunction' ||
        constructor.displayName === 'AsyncGeneratorFunction') return true;
    return false;
}

function isAsyncGeneratorObject(value) {
    return typeof value === 'object' &&
        value !== null &&
        typeof value.next === 'function' &&
        typeof value.throw === 'function' &&
        typeof value.return === 'function';
}

function isPromise(value) {
    return value instanceof Promise;
}

function isMap(value) {
    return value instanceof Map;
}

function isSet(value) {
    return value instanceof Set;
}

function isWeakMap(value) {
    return value instanceof WeakMap;
}

function isWeakSet(value) {
    return value instanceof WeakSet;
}

function isMapIterator(value) {
    return typeof value === 'object' &&
        value !== null &&
        typeof value.next === 'function' &&
        value[Symbol.toStringTag] === 'Map Iterator';
}

function isSetIterator(value) {
    return typeof value === 'object' &&
        value !== null &&
        typeof value.next === 'function' &&
        value[Symbol.toStringTag] === 'Set Iterator';
}

// Web API checks (may not be available in all React Native environments)
function isWebAssemblyCompiledModule(value) {
    return typeof WebAssembly !== 'undefined' &&
        typeof WebAssembly.Module !== 'undefined' &&
        value instanceof WebAssembly.Module;
}

// Proxy detection (basic implementation)
function isProxy(value) {
    // There's no reliable way to detect if something is a Proxy in JavaScript
    // This is a limitation that exists even in Node.js
    return false;
}

// External/Boxed primitive detection
function isExternal(value) {
    // External values don't exist in React Native like they do in Node.js
    return false;
}

function isBoxedPrimitive(value) {
    return isNumberObject(value) ||
        isStringObject(value) ||
        isBooleanObject(value) ||
        isBigIntObject(value) ||
        isSymbolObject(value);
}

// Module detection (not applicable in React Native)
function isModuleNamespaceObject(value) {
    return false;
}

// Key iterator detection
function isKeyObject(value) {
    // KeyObject is a Node.js crypto-specific object
    return false;
}

function isCryptoKey(value) {
    // CryptoKey is a Web Crypto API object
    return typeof CryptoKey !== 'undefined' && value instanceof CryptoKey;
}

// Export all the type checking functions
module.exports = {
    // Typed Arrays
    isArrayBuffer,
    isUint8Array,
    isUint8ClampedArray,
    isUint16Array,
    isUint32Array,
    isInt8Array,
    isInt16Array,
    isInt32Array,
    isFloat32Array,
    isFloat64Array,
    isBigInt64Array,
    isBigUint64Array,
    isTypedArray,
    isArrayBufferView,
    isSharedArrayBuffer,
    isDataView,

    // Basic types
    isDate,
    isArgumentsObject,
    isBigIntObject,
    isBooleanObject,
    isNumberObject,
    isStringObject,
    isSymbolObject,
    isNativeError,
    isRegExp,

    // Functions
    isGeneratorFunction,
    isGeneratorObject,
    isAsyncFunction,
    isAsyncGeneratorFunction,
    isAsyncGeneratorObject,

    // Promises and Collections
    isPromise,
    isMap,
    isSet,
    isWeakMap,
    isWeakSet,
    isMapIterator,
    isSetIterator,

    // Advanced
    isWebAssemblyCompiledModule,
    isProxy,
    isExternal,
    isBoxedPrimitive,
    isModuleNamespaceObject,
    isKeyObject,
    isCryptoKey
};

