// Hermes does not implement TypedArraySpeciesCreate: `subarray`, `slice`,
// `map` and `filter` on a Uint8Array subclass return a plain Uint8Array.
// That breaks the `buffer` package (Buffer.subarray(...).toString('hex')
// returns "0,0,0"). The app used to work around it twice, in the same way:
//   1. `import '@exodus/patch-broken-hermes-typed-arrays'` in index.js, and
//   2. `replace_file/buffer/index.js`, a copy of `buffer` 6.0.3 with an IIFE
//      that overrode TypedArray.prototype.subarray, copied over
//      node_modules/buffer by `script.sh` in postinstall.
// Both rebuilt EVERY subclass with `new this.constructor(buffer, byteOffset,
// length)`. Classes whose constructor does not take (buffer, offset, length)
// are then silently corrupted: @polkadot's `Raw extends Uint8Array` takes
// (registry, value) and turned every slice into the ASCII digits of its byte
// offset, so Polkadot fee decoding failed with "Unable to create Enum via
// index 50" (0x32 = "2"). Per spec those classes declare
// `Symbol.species = Uint8Array` and expect a plain Uint8Array back, which is
// what Hermes natively returns; Hermes has no Symbol.species so a patch
// cannot see that declaration.
//
// This shim is now the ONLY typed-array patch in the app (a guard test,
// noGlobalTypedArrayPatch.test.js, keeps it that way). It fixes only what
// needs fixing: instances of the `buffer` package's Buffer are rebuilt via
// their constructor; every other TypedArray subclass keeps the native
// plain-Uint8Array result. Detection and safeguards follow the exodus patch.
//
// Written in plain ES5-style var/function so it runs before any polyfill.

var TypedArray = Object.getPrototypeOf(Uint8Array);

// The `buffer` package sets these on its constructor; child classes that
// inherit from Buffer are excluded on purpose (hasOwn check).
export function isFerossBuffer(instance) {
  var ctor = instance && instance.constructor;
  return !!(
    instance &&
    instance._isBuffer === true &&
    ctor &&
    ctor.name === 'Buffer' &&
    Object.prototype.hasOwnProperty.call(ctor, 'TYPED_ARRAY_SUPPORT') &&
    ctor.TYPED_ARRAY_SUPPORT === true
  );
}

// Probes the engine the same way the original patch does. `broken` means a
// Uint8Array subclass loses its class on subarray/map/filter/slice.
export function detectBrokenTypedArrays() {
  var called = 0;
  var ok = true;

  var TestArray = function () {
    called++;
    var buf = new (Function.prototype.bind.apply(
      Uint8Array,
      [null].concat(Array.prototype.slice.call(arguments)),
    ))();
    Object.setPrototypeOf(buf, TestArray.prototype);
    return buf;
  };
  Object.setPrototypeOf(TestArray.prototype, Uint8Array.prototype);
  Object.setPrototypeOf(TestArray, Uint8Array);

  var arr = new TestArray(1);
  ok = ok && called === 1;
  if (arr.subarray(0).constructor !== TestArray) {
    ok = false;
  }
  ok = ok && called === 2;
  if (
    arr.map(function () {
      return 1;
    }).constructor !== TestArray
  ) {
    ok = false;
  }
  ok = ok && called === 3;
  if (
    arr.filter(function () {
      return true;
    }).constructor !== TestArray
  ) {
    ok = false;
  }
  ok = ok && called === 4;
  if (arr.slice(0).constructor !== TestArray) {
    ok = false;
  }
  ok = ok && called === 5;

  var broken = !ok;
  // Only patch the one known shape of brokenness: constructor called exactly
  // once (for `new`), no Symbol.species, no resizable ArrayBuffers.
  var shouldPatch =
    broken && called === 1 && !Symbol.species && !ArrayBuffer.prototype.resize;
  return {broken: broken, shouldPatch: shouldPatch};
}

// Builds the replacement methods from the engine's originals. Exported so the
// behaviour can be unit-tested on an engine that is not broken.
export function createPatchedMethods(original) {
  var subarray = original.subarray;
  var map = original.map;
  var filter = original.filter;
  var slice = original.slice;

  var rebuildForBuffer = function (instance, typed) {
    // Non-Buffer subclasses (e.g. @polkadot Raw) keep the plain result.
    if (
      !isFerossBuffer(instance) ||
      typed.constructor === instance.constructor
    ) {
      return typed;
    }
    var Ctor = instance.constructor;
    return new Ctor(typed.buffer, typed.byteOffset, typed.length);
  };

  return {
    subarray: function () {
      return rebuildForBuffer(this, subarray.apply(this, arguments));
    },
    map: function () {
      return rebuildForBuffer(this, map.apply(this, arguments));
    },
    filter: function () {
      return rebuildForBuffer(this, filter.apply(this, arguments));
    },
    slice: function () {
      return rebuildForBuffer(this, slice.apply(this, arguments));
    },
  };
}

var installed = false;

// Installs the patch when the engine needs it. Returns true when installed.
export function installHermesTypedArrayPatch(options) {
  var force = !!(options && options.force);
  if (installed) {
    return true;
  }
  var state = detectBrokenTypedArrays();
  if (!state.broken && !force) {
    return false;
  }
  if (!state.shouldPatch && !force) {
    // Unknown shape of brokenness (e.g. an engine that gained Symbol.species
    // or resizable ArrayBuffers). Leaving Buffer unpatched degrades some
    // hex/string conversions; throwing here would crash the wallet at boot.
    if (typeof console !== 'undefined') {
      console.warn(
        '[hermesTypedArrays] TypedArray support looks broken in an unexpected way; not patching',
      );
    }
    return false;
  }
  var proto = TypedArray.prototype;
  var patched = createPatchedMethods({
    subarray: proto.subarray,
    map: proto.map,
    filter: proto.filter,
    slice: proto.slice,
  });
  proto.subarray = patched.subarray;
  proto.map = patched.map;
  proto.filter = patched.filter;
  proto.slice = patched.slice;
  installed = true;
  return true;
}

installHermesTypedArrayPatch();
