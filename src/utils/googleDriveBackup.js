import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {
  GDrive,
  ListQueryBuilder,
} from '@robinbobin/react-native-google-drive-api-wrapper';
import {Platform} from 'react-native';
import crypto from 'react-native-quick-crypto';
import {Buffer} from 'buffer';
import {IOS_GOOGLE_CLIENT_ID, WEB_GOOGLE_CLIENT_ID} from './wlData';

const IS_IOS = Platform.OS === 'ios';

const BACKUP_FILE_NAME = 'wallet_backup_encrypted.json';

const googleConfigure = {
  scopes: ['https://www.googleapis.com/auth/drive.appfolder'],
  iosClientId: IOS_GOOGLE_CLIENT_ID,
  webClientId: WEB_GOOGLE_CLIENT_ID,
  forceCodeForRefreshToken: true,
};

export const googleDrive = {
  configure: () => GoogleSignin.configure(googleConfigure),

  isGoogleSignedIn: () => GoogleSignin.getCurrentUser(),
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
        await GoogleSignin.revokeAccess();
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
    new Promise((resolve, reject) => {
      GoogleSignin.getTokens()
        .then(tokenRes => {
          const GD = new GDrive();
          GD.accessToken = tokenRes?.accessToken;
          GD.fetchCoercesTypes = true;
          GD.fetchRejectsOnHttpErrors = true;
          GD.fetchTimeout = 30000; // 30 seconds for file operations
          resolve(GD);
        })
        .catch(reject);
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

// OpenSSL-compatible key derivation (EVP_BytesToKey with MD5)
// This matches CryptoJS's passphrase-based AES behavior for backward compatibility
const evpBytesToKey = (password, salt) => {
  const keyLen = 32; // AES-256
  const ivLen = 16; // CBC IV
  const parts = [];
  let prev = Buffer.alloc(0);
  while (Buffer.concat(parts).length < keyLen + ivLen) {
    const hash = crypto.createHash('md5');
    hash.update(prev);
    hash.update(Buffer.from(password, 'utf8'));
    if (salt) {
      hash.update(salt);
    }
    prev = hash.digest();
    parts.push(prev);
  }
  const combined = Buffer.concat(parts);
  return {
    key: combined.subarray(0, keyLen),
    iv: combined.subarray(keyLen, keyLen + ivLen),
  };
};

// Encryption (OpenSSL format compatible with CryptoJS)
const encryptData = data => {
  try {
    const jsonString = JSON.stringify(data);
    const salt = crypto.randomBytes(8);
    const {key, iv} = evpBytesToKey(process.env.WALLET_BACKUP_SECRET, salt);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(jsonString, 'utf8'),
      cipher.final(),
    ]);
    // OpenSSL format: "Salted__" + 8-byte salt + ciphertext
    const result = Buffer.concat([
      Buffer.from('Salted__', 'ascii'),
      salt,
      encrypted,
    ]);
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption Failed:', error);
    throw new Error('Failed to encrypt wallet data');
  }
};

// Decryption (OpenSSL format compatible with CryptoJS)
const decryptData = ciphertext => {
  try {
    const rawData = Buffer.from(ciphertext, 'base64');
    // OpenSSL format: first 8 bytes = "Salted__", next 8 bytes = salt, rest = ciphertext
    const salt = rawData.subarray(8, 16);
    const encrypted = rawData.subarray(16);
    const {key, iv} = evpBytesToKey(process.env.WALLET_BACKUP_SECRET, salt);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('Decryption Failed:', error);
    throw new Error(
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

export const backupWalletsToDrive = async payload => {
  try {
    let finalWallets = [];
    let masterClientId = payload.masterClientId;

    // 1. Try to fetch existing backup to merge
    try {
      const existingData = await restoreWalletsFromDrive();
      if (existingData && Array.isArray(existingData.wallets)) {
        finalWallets = existingData.wallets;
        // Keep existing masterClientId if not provided in new payload (though usually it is)
        if (!masterClientId && existingData.masterClientId) {
          masterClientId = existingData.masterClientId;
        }
      }
    } catch (e) {
      const msg = e?.message || e?.json?.error?.message;
      if (msg !== 'No backup file found.') {
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
      version: 1,
    };

    // 3. Encrypt Data
    const encryptedData = encryptData(mergedData);
    const fileContent = JSON.stringify({
      data: encryptedData,
      timestamp: new Date().toISOString(),
      version: 1,
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
    console.error('Backup Failed:', error);
    throw error?.json?.error || error;
  }
};

export const restoreWalletsFromDrive = async () => {
  try {
    const filesList = await googleDrive.getFileList('appDataFolder');
    const files = filesList.files || [];
    const existingFile = files.find(
      f => f.name === BACKUP_FILE_NAME && !f.trashed,
    );

    if (!existingFile) {
      throw new Error('No backup file found.');
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
      throw new Error('Invalid backup file format.');
    }

    return decryptData(parsedContent.data);
  } catch (error) {
    throw error?.json?.error || error;
  }
};

export default googleDrive;
