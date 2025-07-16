// polyfills/web-streams.js
import {
    ReadableStream,
    WritableStream,
    TransformStream,
    ReadableStreamDefaultReader,
    ReadableStreamBYOBReader,
    ReadableStreamDefaultController,
    ReadableByteStreamController,
    WritableStreamDefaultWriter,
    WritableStreamDefaultController,
    TransformStreamDefaultController,
    ByteLengthQueuingStrategy,
    CountQueuingStrategy,
} from 'web-streams-polyfill';

// Make sure they're available globally
if (typeof global !== 'undefined') {
    global.ReadableStream = global.ReadableStream || ReadableStream;
    global.WritableStream = global.WritableStream || WritableStream;
    global.TransformStream = global.TransformStream || TransformStream;
}

// Export for module systems
export {
    ReadableStream,
    WritableStream,
    TransformStream,
    ReadableStreamDefaultReader,
    ReadableStreamBYOBReader,
    ReadableStreamDefaultController,
    ReadableByteStreamController,
    WritableStreamDefaultWriter,
    WritableStreamDefaultController,
    TransformStreamDefaultController,
    ByteLengthQueuingStrategy,
    CountQueuingStrategy,
};

module.exports = {
    ReadableStream,
    WritableStream,
    TransformStream,
    ReadableStreamDefaultReader,
    ReadableStreamBYOBReader,
    ReadableStreamDefaultController,
    ReadableByteStreamController,
    WritableStreamDefaultWriter,
    WritableStreamDefaultController,
    TransformStreamDefaultController,
    ByteLengthQueuingStrategy,
    CountQueuingStrategy,
};
