// Mobile `security/vaultCrypto` adapter on react-native-quick-crypto.
//
// The shared vault core (dok-wallet-blockchain-networks/security/vaultCore.js)
// imports this by alias; the web app supplies its own WebCrypto file with the
// same exports. Contract:
//   randomBytes(n)                                  -> Uint8Array
//   pbkdf2(password, salt, iterations, keyLen)       -> Promise<Uint8Array>  (HMAC-SHA256)
//   hkdf(ikm, salt, info, keyLen)                    -> Promise<Uint8Array>  (SHA-256; info: string | bytes)
//   aesGcmEncrypt(key, iv, plaintext, aad)           -> Promise<Uint8Array>  ct || 16-byte tag
//   aesGcmDecrypt(key, iv, ctWithTag, aad)           -> Promise<Uint8Array>  throws VaultCryptoError(auth_failed)
// All byte arguments are Uint8Array; `password`, `aad` and `info` are strings.
// Everything is async because WebCrypto has no sync path and the two adapters
// must be drop-in for each other.
import crypto from 'react-native-quick-crypto';
import {Buffer} from 'buffer';
import {
  VAULT_CRYPTO_ERROR_CODES,
  VaultCryptoError,
} from 'dok-wallet-blockchain-networks/security/errors';
import {
  concatBytes,
  toUint8,
  utf8Encode,
} from 'dok-wallet-blockchain-networks/security/bytes';

const DIGEST = 'sha256';
const TAG_BYTES = 16;

const toBuffer = bytes => Buffer.from(toUint8(bytes));

export const randomBytes = n => toUint8(crypto.randomBytes(n));

// Callback form, never pbkdf2Sync: quick-crypto runs it on a native thread so
// 600k iterations do not block the JS thread (same as utils/hideWallet.js).
export const pbkdf2 = (password, salt, iterations, keyLen) =>
  new Promise((resolve, reject) => {
    crypto.pbkdf2(
      toBuffer(utf8Encode(password)),
      toBuffer(salt),
      iterations,
      keyLen,
      DIGEST,
      (err, derived) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(toUint8(derived));
      },
    );
  });

export const hkdf = (ikm, salt, info, keyLen) =>
  new Promise((resolve, reject) => {
    crypto.hkdf(
      DIGEST,
      toBuffer(ikm),
      toBuffer(salt),
      toBuffer(typeof info === 'string' ? utf8Encode(info) : info),
      keyLen,
      (err, derived) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(toUint8(derived));
      },
    );
  });

export const aesGcmEncrypt = async (key, iv, plaintext, aad) => {
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    toBuffer(key),
    toBuffer(iv),
  );
  cipher.setAAD(toBuffer(utf8Encode(aad)));
  const ct = Buffer.concat([
    cipher.update(toBuffer(plaintext)),
    cipher.final(),
  ]);
  return concatBytes(ct, cipher.getAuthTag());
};

export const aesGcmDecrypt = async (key, iv, ctWithTag, aad) => {
  const all = toBuffer(ctWithTag);
  // Exactly TAG_BYTES = empty plaintext, which GCM authenticates fine (and
  // which the WebCrypto adapter already accepts).
  if (all.length < TAG_BYTES) {
    throw new VaultCryptoError(
      VAULT_CRYPTO_ERROR_CODES.AUTH_FAILED,
      'Ciphertext too short',
    );
  }
  const ct = all.subarray(0, all.length - TAG_BYTES);
  const tag = all.subarray(all.length - TAG_BYTES);
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      toBuffer(key),
      toBuffer(iv),
    );
    decipher.setAAD(toBuffer(utf8Encode(aad)));
    decipher.setAuthTag(tag);
    return toUint8(Buffer.concat([decipher.update(ct), decipher.final()]));
  } catch (error) {
    // Node/quick-crypto report a bad tag as a generic "Unsupported state or
    // unable to authenticate data" error; the vault core only needs the code.
    throw new VaultCryptoError(
      VAULT_CRYPTO_ERROR_CODES.AUTH_FAILED,
      'AES-GCM authentication failed',
      error,
    );
  }
};
