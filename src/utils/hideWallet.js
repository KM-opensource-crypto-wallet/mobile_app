import crypto from 'react-native-quick-crypto';
import {Buffer} from 'buffer';

export const SECRET_CODE_MIN_LENGTH = 5;
export const SECRET_CODE_MAX_LENGTH = 50;
export const SECRET_CODE_REGEX = /^[A-Za-z0-9@_-]{5,50}$/;
export const SECRET_CODE_ITERATIONS = 100000;
const SALT_BYTES = 16;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export const normalizeSecretCode = code => (code || '').trim().toLowerCase();

export const isSecretCodeFormatValid = code =>
  SECRET_CODE_REGEX.test(normalizeSecretCode(code));

// Wallet names are plainly visible in the app - a code that IS another
// wallet's name would be trivially guessable, and typing that name in the
// Wallets search box would accidentally reveal the hidden wallet.
export const secretCodeMatchesWalletName = (code, walletNames = []) => {
  const normalizedCode = normalizeSecretCode(code);
  if (!normalizedCode) {
    return false;
  }
  return walletNames.some(name => normalizeSecretCode(name) === normalizedCode);
};

export const generateSecretCodeSalt = () =>
  crypto.randomBytes(SALT_BYTES).toString('hex');

const pbkdf2Async = (passwordBuffer, saltBuffer, iterations, keylen, digest) =>
  new Promise((resolve, reject) => {
    crypto.pbkdf2(
      passwordBuffer,
      saltBuffer,
      iterations,
      keylen,
      digest,
      (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(derivedKey);
      },
    );
  });

export const hashSecretCode = async (
  code,
  salt,
  iterations = SECRET_CODE_ITERATIONS,
) => {
  const normalized = normalizeSecretCode(code);
  const passwordBuffer = Buffer.from(normalized, 'utf8');
  const saltBuffer = Buffer.from(salt, 'hex');
  const derivedKey = await pbkdf2Async(
    passwordBuffer,
    saltBuffer,
    iterations,
    KEY_LENGTH,
    DIGEST,
  );
  return derivedKey.toString('hex');
};

export const verifySecretCode = async (
  code,
  salt,
  iterations,
  expectedHash,
) => {
  if (!salt || !iterations || !expectedHash) {
    return false;
  }
  const computedHash = await hashSecretCode(code, salt, iterations);
  const computedBuffer = Buffer.from(computedHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  if (computedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
};
