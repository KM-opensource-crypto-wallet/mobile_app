/**
 * The Buffer-only Hermes TypedArray shim must rebuild `buffer`-package
 * Buffers through their constructor, but leave every other Uint8Array
 * subclass (notably @polkadot's Raw) with the engine's plain result.
 */
import {TypeRegistry} from '@polkadot/types';
import {
  createPatchedMethods,
  detectBrokenTypedArrays,
  installHermesTypedArrayPatch,
  isFerossBuffer,
} from './hermesTypedArrays';

const TypedArray = Object.getPrototypeOf(Uint8Array);
const originals = {
  subarray: TypedArray.prototype.subarray,
  map: TypedArray.prototype.map,
  filter: TypedArray.prototype.filter,
  slice: TypedArray.prototype.slice,
};

// Mimics the `buffer` package: a Uint8Array subclass flagged with _isBuffer
// and TYPED_ARRAY_SUPPORT whose constructor takes (buffer, offset, length).
class FakeBuffer extends Uint8Array {
  constructor(...args) {
    super(...args);
    this._isBuffer = true;
  }
}
FakeBuffer.TYPED_ARRAY_SUPPORT = true;
Object.defineProperty(FakeBuffer, 'name', {value: 'Buffer'});

// Mimics @polkadot's Raw: constructor is (registry, value), and a number
// value is encoded as its ASCII digits.
class FakeRaw extends Uint8Array {
  constructor(registry, value) {
    super(
      typeof value === 'number'
        ? Uint8Array.from(String(value), c => c.charCodeAt(0))
        : value,
    );
    this.registry = registry;
  }
  static get [Symbol.species]() {
    return Uint8Array;
  }
}

// Node's native methods honour Symbol.species and return a plain Uint8Array
// for both classes, exactly like Hermes does natively.
const nativeLike = {
  subarray: originals.subarray,
  map: originals.map,
  filter: originals.filter,
  slice: originals.slice,
};

describe('hermesTypedArrays shim', () => {
  it('recognises only the buffer package Buffer shape', () => {
    expect(isFerossBuffer(new FakeBuffer(2))).toBe(true);
    expect(isFerossBuffer(new FakeRaw({}, new Uint8Array([1])))).toBe(false);
    expect(isFerossBuffer(new Uint8Array(2))).toBe(false);
    class ChildBuffer extends FakeBuffer {}
    expect(isFerossBuffer(new ChildBuffer(2))).toBe(false);
  });

  it('rebuilds Buffer results through the Buffer constructor', () => {
    const patched = createPatchedMethods(nativeLike);
    const buf = new FakeBuffer([1, 2, 3, 4]);
    const sub = patched.subarray.call(buf, 1, 3);
    expect(sub).toBeInstanceOf(FakeBuffer);
    expect(Array.from(sub)).toEqual([2, 3]);
    // subarray shares memory with the source
    sub[0] = 9;
    expect(buf[1]).toBe(9);
    expect(patched.slice.call(buf, 2)).toBeInstanceOf(FakeBuffer);
    expect(patched.map.call(buf, x => x + 1)).toBeInstanceOf(FakeBuffer);
    expect(patched.filter.call(buf, x => x > 3)).toBeInstanceOf(FakeBuffer);
  });

  it('leaves non-Buffer subclasses with the plain Uint8Array result', () => {
    const patched = createPatchedMethods(nativeLike);
    const raw = new FakeRaw({}, new Uint8Array([1, 2, 3, 4, 5]));
    const sub = patched.subarray.call(raw, 2);
    expect(sub.constructor).toBe(Uint8Array);
    expect(Array.from(sub)).toEqual([3, 4, 5]);
    expect(Array.from(patched.slice.call(raw, 3))).toEqual([4, 5]);
    expect(Array.from(patched.map.call(raw, x => x * 2))).toEqual([
      2, 4, 6, 8, 10,
    ]);
  });

  it('does not install on an engine whose TypedArrays are not broken', () => {
    expect(detectBrokenTypedArrays().broken).toBe(false);
    expect(TypedArray.prototype.subarray).toBe(originals.subarray);
  });

  describe('force-installed on the real prototype', () => {
    beforeAll(() => {
      installHermesTypedArrayPatch({force: true});
    });

    afterAll(() => {
      Object.assign(TypedArray.prototype, originals);
    });

    it('decodes the Polkadot fee response that failed on device', () => {
      const registry = new TypeRegistry();
      registry.register({Weight: 'WeightV2'});
      const bytes = registry.createType(
        'Bytes',
        '0xe2f2e06e85d300121c8800000000000000000000000000',
      );
      const info = registry.createType('RuntimeDispatchInfo', bytes);
      expect(info.class.toString()).toBe('Normal');
      expect(info.partialFee.toString()).toBe('8920082');

      const versions = registry.createType(
        'Vec<u32>',
        registry.createType('Bytes', '0x0c0e0000000f00000010000000'),
      );
      expect(versions.toJSON()).toEqual([14, 15, 16]);

      const hash =
        '0xcb9935755269d4608b6cee04b39bb1f3af9602aa41b1d25526f5ee4e601941c7';
      expect(
        registry
          .createType('BlockHash', registry.createType('H256', hash))
          .toHex(),
      ).toBe(hash);
    });

    it('still gives Buffers back their own class', () => {
      const buf = new FakeBuffer([7, 8, 9]);
      expect(buf.subarray(1)).toBeInstanceOf(FakeBuffer);
      expect(Array.from(buf.subarray(1))).toEqual([8, 9]);
    });
  });
});
