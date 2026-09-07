/**
 * Guard: src/shims/hermesTypedArrays.js must be the only code that touches
 * TypedArray.prototype. Two earlier global patches (the exodus package and a
 * modified copy of `buffer` copied in by a postinstall script) rebuilt every
 * Uint8Array subclass through its constructor and silently corrupted
 * @polkadot codec slices. This test fails loudly if either comes back.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

describe('no global TypedArray patch outside the shim', () => {
  it('node_modules/buffer is the stock package, not the replace_file copy', () => {
    const source = read('node_modules/buffer/index.js');
    expect(source).not.toMatch(/TypedArray\.prototype\.subarray/);
    expect(source).not.toMatch(/Object\.getPrototypeOf\(Uint8Array\)/);
  });

  it('postinstall no longer copies files over node_modules', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts.postinstall).not.toMatch(/script\.sh|replace_file/);
    expect(fs.existsSync(path.join(root, 'script.sh'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'replace_file'))).toBe(false);
  });

  it('the exodus typed-array patch is neither a dependency nor imported', () => {
    const pkg = JSON.parse(read('package.json'));
    const deps = {...pkg.dependencies, ...pkg.devDependencies};
    expect(deps['@exodus/patch-broken-hermes-typed-arrays']).toBeUndefined();
    expect(read('index.js')).not.toMatch(/patch-broken-hermes-typed-arrays/);
    expect(read('index.js')).toMatch(/src\/shims\/hermesTypedArrays/);
  });
});
