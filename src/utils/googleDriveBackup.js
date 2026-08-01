import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {
  GDrive,
  ListQueryBuilder,
} from '@robinbobin/react-native-google-drive-api-wrapper';
import {Platform} from 'react-native';
import crypto from 'react-native-quick-crypto';
import {Buffer} from 'buffer';
import {WEB_GOOGLE_CLIENT_ID} from './wlData';

const IS_IOS = Platform.OS === 'ios';

const BACKUP_FILE_NAME = 'wallet_backup_encrypted.json';

const googleConfigure = {
  scopes: ['https://www.googleapis.com/auth/drive.appfolder'],
  webClientId: WEB_GOOGLE_CLIENT_ID,
};

export const googleDrive = {
  configure: () => GoogleSignin.configure(googleConfigure),
  hasPreviousSignIn: () => GoogleSignin.hasPreviousSignIn(),
  signInSilently: () =>
    new Promise((resolve, reject) => {
      GoogleSignin.signInSilently()
        .then(signInRes => {
          resolve(signInRes);
        })
        .catch(reject);
    }),
  isGoogleSignedIn: () =>
    new Promise((resolve, reject) => {
      try {
        const user = GoogleSignin.getCurrentUser();
        resolve(user);
      } catch (error) {
        reject(error);
      }
    }),
  googleSignIn: () =>
    new Promise((resolve, reject) => {
      GoogleSignin.signIn()
        .then(signInRes => {
          resolve(signInRes);
        })
        .catch(reject);
    }),
  googleSignOut: () =>
    new Promise(async (resolve, reject) => {
      try {
        try {
          await GoogleSignin.revokeAccess();
        } catch {}
        await GoogleSignin.signOut();
        resolve(true);
      } catch (error) {
        reject(error);
      }
    }),
  googleGetUser: () =>
    new Promise(async (resolve, reject) => {
      try {
        const user = await GoogleSignin.getCurrentUser();
        resolve(user);
      } catch (error) {
        reject(error);
      }
    }),
  checkGDrivePermission: () =>
    new Promise(async (resolve, reject) => {
      try {
        const user = await GoogleSignin.getCurrentUser();
        resolve(
          user?.scopes?.includes(
            'https://www.googleapis.com/auth/drive.appfolder',
          ),
        );
      } catch (error) {
        reject(error);
      }
    }),
  addScopePermission: () =>
    new Promise(async resolve => {
      try {
        if (IS_IOS) {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          await GoogleSignin.signIn();
          const user = await GoogleSignin.addScopes({
            scopes: ['https://www.googleapis.com/auth/drive.appfolder'],
          });
          resolve(user);
        } else {
          const isSignedIn = await GoogleSignin.isSignedIn();
          if (isSignedIn) {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
          }
          const user = await GoogleSignin.signIn();
          resolve(user);
        }
      } catch (error) {
        resolve(null);
      }
    }),
  getGoogleDriveInstance: () =>
    new Promise(async (resolve, reject) => {
      try {
        const currentUser = GoogleSignin.getCurrentUser();
        if (!currentUser) {
          // Automatically sign in if user is not signed in
          await GoogleSignin.signIn();
        }
        const tokenRes = await GoogleSignin.getTokens();
        const GD = new GDrive();
        GD.accessToken = tokenRes?.accessToken;
        GD.fetchCoercesTypes = true;
        GD.fetchRejectsOnHttpErrors = true;
        GD.fetchTimeout = 30000; // 30 seconds for file operations
        resolve(GD);
      } catch (error) {
        reject(error);
      }
    }),
  getFileList: parentFolderId =>
    new Promise((resolve, reject) => {
      googleDrive
        .getGoogleDriveInstance()
        .then(GD => {
          GD.files
            .list({
              q: new ListQueryBuilder(
                parentFolderId || 'appDataFolder',
                'in',
                'parents',
              ),
              spaces: 'appDataFolder',
            })
            .then(resolve)
            .catch(reject);
        })
        .catch(reject);
    }),
  createFolder: (parentFolderId, newFolderName) =>
    new Promise((resolve, reject) => {
      googleDrive
        .getGoogleDriveInstance()
        .then(GD => {
          GD.files
            .createIfNotExists(
              {
                q: new ListQueryBuilder()
                  .push('name', '=', newFolderName)
                  .and()
                  .push('mimeType', '=', 'application/vnd.google-apps.folder')
                  .and()
                  .push(parentFolderId, 'in', 'parents'),
                spaces: 'appDataFolder',
              },
              GD.files.newMetadataOnlyUploader().setRequestBody({
                name: newFolderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentFolderId],
              }),
            )
            .then(resolve)
            .catch(reject);
        })
        .catch(error => {
          reject({message: 'GDrive: Instance not created', error});
        });
    }),

  moveToGDrive: (fileBase64, filename, folder_id) =>
    new Promise((resolve, reject) => {
      googleDrive
        .getGoogleDriveInstance()
        .then(async GD => {
          GD.files
            .newMultipartUploader()
            .setData(fileBase64, 'application/json') // Changed to JSON as we are uploading JSON
            .setIsBase64(true) // We might pass raw string/json, but let's check input
            .setRequestBody({
              name: filename,
              parents: [folder_id],
            })
            .execute()
            .then(resolve)
            .catch(error => {
              reject({
                message: 'GDrive: Error while uploading file',
                error,
              });
            });
        })
        .catch(error => {
          reject({message: 'GDrive: Instance not created', error});
        });
    }),

  deleteGDriveFile: fileId =>
    new Promise((resolve, reject) => {
      googleDrive
        .getGoogleDriveInstance()
        .then(GD => {
          GD.files
            .delete(fileId)
            .then(resolve)
            .catch(error => {
              reject({
                message: 'GDrive: Error while deleting file',
                error,
              });
            });
        })
        .catch(error => {
          reject({message: 'GDrive: Instance not created', error});
        });
    }),
  getTextFromGDriveFile: fileId =>
    new Promise((resolve, reject) => {
      googleDrive
        .getGoogleDriveInstance()
        .then(GD => {
          GD.files
            .getText(fileId, {
              spaces: 'appDataFolder',
            })
            .then(resolve)
            .catch(error => {
              reject({
                message: 'GDrive: Error while reading file',
                error,
              });
            });
        })
        .catch(error => {
          reject({message: 'GDrive: Instance not created', error});
        });
    }),
};

// Version prefixes for encrypted payloads
// v1-gcm: key derived from the app-wide WALLET_BACKUP_SECRET only (legacy)
// v2-gcm: key derived from a user-supplied backup password + WALLET_BACKUP_SECRET
const VERSION_V1_GCM = 'v1-gcm:';
const VERSION_V2_GCM = 'v2-gcm:';

export const BACKUP_ERROR_CODES = {
  PASSWORD_REQUIRED: 'BACKUP_PASSWORD_REQUIRED',
  WRONG_PASSWORD: 'BACKUP_WRONG_PASSWORD',
  CORRUPTED: 'BACKUP_CORRUPTED',
  NO_BACKUP: 'BACKUP_NOT_FOUND',
};

const createBackupError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

if (!process.env.WALLET_BACKUP_SECRET) {
  console.error(
    'WALLET_BACKUP_SECRET is not defined! Check your .env file and rebuild the app.',
  );
}

// Key derivation using PBKDF2-SHA256
const deriveKey = (password, salt) => {
  if (!password) {
    throw new Error('Encryption password is not configured');
  }
  const passwordBuffer = Buffer.from(password, 'utf8');
  return crypto.pbkdf2Sync(passwordBuffer, salt, 100000, 32, 'sha256');
};

// The user's backup password is the load-bearing secret; the app secret only
// adds defense in depth. WALLET_BACKUP_SECRET must never change once shipped —
// v2 backups mix it into their key and would become unrecoverable.
const getV2KeyMaterial = userPassword => {
  if (!process.env.WALLET_BACKUP_SECRET) {
    throw new Error(
      'WALLET_BACKUP_SECRET is not configured. Check your .env file and rebuild the app.',
    );
  }
  return `${userPassword}\x00${process.env.WALLET_BACKUP_SECRET}`;
};

// Payload layout (same for v1/v2): [16-byte salt][12-byte nonce][ciphertext][16-byte auth tag]
const parsePayload = (ciphertext, prefix) => {
  const base64Data = ciphertext.slice(prefix.length);
  const rawData = Buffer.from(base64Data, 'base64');

  // Minimum size: 16 (salt) + 12 (nonce) + 1 (min ciphertext) + 16 (auth tag) = 45 bytes
  if (rawData.length < 45) {
    throw createBackupError(
      BACKUP_ERROR_CODES.CORRUPTED,
      'Invalid encrypted data: too short',
    );
  }

  return {
    salt: rawData.subarray(0, 16),
    nonce: rawData.subarray(16, 28),
    authTag: rawData.subarray(rawData.length - 16),
    encrypted: rawData.subarray(28, rawData.length - 16),
  };
};

// Encryption with AES-256-GCM (authenticated encryption)
// Always writes the v2 format keyed by the user's backup password
const encryptData = (data, userPassword) => {
  if (!userPassword) {
    throw createBackupError(
      BACKUP_ERROR_CODES.PASSWORD_REQUIRED,
      'A backup password is required to encrypt the backup.',
    );
  }
  try {
    const jsonString = JSON.stringify(data);
    const salt = crypto.randomBytes(16);
    const nonce = crypto.randomBytes(12); // GCM standard nonce size
    const key = deriveKey(getV2KeyMaterial(userPassword), salt);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    const encrypted = Buffer.concat([
      cipher.update(jsonString, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag(); // 16 bytes

    const payload = Buffer.concat([salt, nonce, encrypted, authTag]);
    return VERSION_V2_GCM + payload.toString('base64');
  } catch (error) {
    console.error('Encryption Failed:', error);
    throw new Error('Failed to encrypt wallet data');
  }
};

// Decryption with AES-256-GCM (authenticated decryption)
// v1 backups decrypt with the app secret (no password), v2 with the user's password
const decryptData = (ciphertext, userPassword) => {
  const isV2 =
    typeof ciphertext === 'string' && ciphertext.startsWith(VERSION_V2_GCM);
  const isV1 =
    typeof ciphertext === 'string' && ciphertext.startsWith(VERSION_V1_GCM);

  if (!isV1 && !isV2) {
    throw createBackupError(
      BACKUP_ERROR_CODES.CORRUPTED,
      'Failed to decrypt wallet backup. Invalid password or corrupted file.',
    );
  }
  if (isV2 && !userPassword) {
    throw createBackupError(
      BACKUP_ERROR_CODES.PASSWORD_REQUIRED,
      'A backup password is required to unlock this backup.',
    );
  }

  try {
    const {salt, nonce, authTag, encrypted} = parsePayload(
      ciphertext,
      isV2 ? VERSION_V2_GCM : VERSION_V1_GCM,
    );

    const key = deriveKey(
      isV2 ? getV2KeyMaterial(userPassword) : process.env.WALLET_BACKUP_SECRET,
      salt,
    );

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(authTag);

    let decrypted;
    try {
      // GCM authentication happens during decryption - throws if tag is invalid
      decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (authError) {
      if (isV2) {
        throw createBackupError(
          BACKUP_ERROR_CODES.WRONG_PASSWORD,
          'Incorrect backup password.',
        );
      }
      throw authError;
    }

    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('Decryption Failed:', error);
    if (error?.code) {
      throw error;
    }
    throw createBackupError(
      BACKUP_ERROR_CODES.CORRUPTED,
      'Failed to decrypt wallet backup. Invalid password or corrupted file.',
    );
  }
};

// Adapter for UI compatibility
export const setDriveAccessToken = () => {
  // No-op as token is fetched internally
};

export const initGoogleDrive = () => {
  googleDrive.configure();
};

export const backupWalletsToDrive = async (payload, userPassword) => {
  if (!userPassword) {
    throw createBackupError(
      BACKUP_ERROR_CODES.PASSWORD_REQUIRED,
      'A backup password is required to encrypt the backup.',
    );
  }
  try {
    let finalWallets = [];
    let masterClientId = payload.masterClientId;

    // 1. Try to fetch existing backup to merge
    try {
      const {encryptedData} = await fetchEncryptedBackup();
      const existingData = decryptData(encryptedData, userPassword);
      if (existingData && Array.isArray(existingData.wallets)) {
        finalWallets = existingData.wallets;
        // Keep existing masterClientId if not provided in new payload (though usually it is)
        if (!masterClientId && existingData.masterClientId) {
          masterClientId = existingData.masterClientId;
        }
      }
    } catch (e) {
      if (e?.code === BACKUP_ERROR_CODES.WRONG_PASSWORD) {
        throw createBackupError(
          BACKUP_ERROR_CODES.WRONG_PASSWORD,
          "This password doesn't match your existing backup. Enter the same password you used before, or delete the existing backup first.",
        );
      }
      const msg = e?.message || e?.json?.error?.message;
      if (
        e?.code !== BACKUP_ERROR_CODES.NO_BACKUP &&
        msg !== 'No backup file found.'
      ) {
        throw e;
      }
    }

    // 2. Merge new wallets: Update existing if found (matched by clientId or name+chain), or add new
    const newWallets = payload.wallets || [];
    newWallets.forEach(newW => {
      const index = finalWallets.findIndex(
        oldW =>
          (oldW.clientId && oldW.clientId === newW.clientId) ||
          (oldW.walletName === newW.walletName &&
            oldW.chain_name === newW.chain_name),
      );

      if (index !== -1) {
        // Update existing wallet with new details (e.g. updated balances, new coins)
        finalWallets[index] = {
          ...finalWallets[index],
          ...newW,
        };
      } else {
        finalWallets.push(newW);
      }
    });

    const mergedData = {
      wallets: finalWallets,
      masterClientId,
      timestamp: new Date().toISOString(),
      version: 2,
    };

    // 3. Encrypt Data
    const encryptedData = encryptData(mergedData, userPassword);
    const fileContent = JSON.stringify({
      data: encryptedData,
      timestamp: new Date().toISOString(),
      version: 2,
    });

    const fileBase64 = Buffer.from(fileContent).toString('base64');

    // 4. Check for existing file ID to delete (clean replacement)
    // We already likely fetched lists in restoreWalletsFromDrive but let's be safe and simple
    const filesList = await googleDrive.getFileList('appDataFolder');
    const files = filesList.files || [];
    const existingFile = files.find(
      f => f.name === BACKUP_FILE_NAME && !f.trashed,
    );

    if (existingFile) {
      await googleDrive.deleteGDriveFile(existingFile.id);
    }

    // 5. Upload
    await googleDrive.moveToGDrive(
      fileBase64,
      BACKUP_FILE_NAME,
      'appDataFolder',
    );
    return true;
  } catch (error) {
    console.error('Drive Backup Failed:', error);
    throw error?.json?.error || error;
  }
};

// Downloads the encrypted backup file without decrypting it, so callers can
// check needsPassword and prompt the user before attempting decryption
export const fetchEncryptedBackup = async () => {
  try {
    const filesList = await googleDrive.getFileList('appDataFolder');
    const files = filesList.files || [];
    const existingFile = files.find(
      f => f.name === BACKUP_FILE_NAME && !f.trashed,
    );

    if (!existingFile) {
      throw createBackupError(
        BACKUP_ERROR_CODES.NO_BACKUP,
        'No backup file found.',
      );
    }

    const content = await googleDrive.getTextFromGDriveFile(existingFile.id);
    // Content is string.

    let parsedContent;
    if (typeof content === 'object') {
      parsedContent = content;
    } else {
      parsedContent = JSON.parse(content);
    }

    if (!parsedContent || !parsedContent.data) {
      throw createBackupError(
        BACKUP_ERROR_CODES.CORRUPTED,
        'Invalid backup file format.',
      );
    }

    return {
      encryptedData: parsedContent.data,
      needsPassword:
        typeof parsedContent.data === 'string' &&
        parsedContent.data.startsWith(VERSION_V2_GCM),
    };
  } catch (error) {
    console.error('Fetch Backup Failed:', error);
    throw error?.json?.error || error;
  }
};

export const decryptBackup = (encryptedData, userPassword) =>
  decryptData(encryptedData, userPassword);

export const restoreWalletsFromDrive = async userPassword => {
  try {
    const {encryptedData} = await fetchEncryptedBackup();
    return decryptData(encryptedData, userPassword);
  } catch (error) {
    console.error('Restore Failed:', error);
    throw error?.json?.error || error;
  }
};

export const deleteWalletBackup = async () => {
  try {
    const filesList = await googleDrive.getFileList('appDataFolder');
    const files = filesList.files || [];
    const existingFile = files.find(
      f => f.name === BACKUP_FILE_NAME && !f.trashed,
    );

    if (!existingFile) {
      throw new Error('No backup file found to delete.');
    }

    await googleDrive.deleteGDriveFile(existingFile.id);
    return true;
  } catch (error) {
    console.error('Delete Backup Failed:', error);
    throw error?.json?.error || error;
  }
};

export default googleDrive;
