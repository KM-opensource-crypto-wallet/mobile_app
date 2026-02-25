import {Client, PublicIdentity, ReplyCodec} from '@xmtp/react-native-sdk';
import {IS_SANDBOX} from 'dok-wallet-blockchain-networks/config/config';
import {ContentTypeCustomReplyCodec} from './xmtpContentReplyType';
import crypto from 'react-native-quick-crypto';
import SensitiveInfo from 'react-native-sensitive-info';
import {Buffer} from 'buffer';
import RNFS from 'react-native-fs';

const XMTP_DB_KEY_STORAGE = 'xmtp_db_encryption_key';
const KEYCHAIN_SERVICE = 'com.dokwallet.xmtp';
const XMTP_ENV = IS_SANDBOX ? 'dev' : 'production';

const getOrCreateDbEncryptionKey = async () => {
  try {
    const stored = await SensitiveInfo.getItem(XMTP_DB_KEY_STORAGE, {
      keychainService: KEYCHAIN_SERVICE,
    });
    if (stored) {
      return Buffer.from(stored, 'hex');
    }
  } catch (e) {
    const msg = e?.message ?? '';
    if (msg.includes('not found')) {
      // Android throws when the key doesn't exist yet — treat as a cache miss
    } else {
      console.warn('XMTP: failed to read encryption key from storage', e);
      throw e;
    }
  }
  const key = crypto.randomBytes(32);
  try {
    await SensitiveInfo.setItem(XMTP_DB_KEY_STORAGE, key.toString('hex'), {
      keychainService: KEYCHAIN_SERVICE,
      accessControl: 'none',
    });
  } catch (e) {
    console.warn('XMTP: failed to persist encryption key', e);
  }
  return key;
};

const clearXmtpDatabase = async () => {
  try {
    const items = await RNFS.readDir(RNFS.DocumentDirectoryPath);
    await Promise.all(
      items
        .filter(
          f =>
            f.name.endsWith('.db3') ||
            f.name.endsWith('.db3-shm') ||
            f.name.endsWith('.db3-wal'),
        )
        .map(f => RNFS.unlink(f.path)),
    );
  } catch (e) {
    console.warn('XMTP: failed to delete database files', e);
  }
  try {
    await SensitiveInfo.deleteItem(XMTP_DB_KEY_STORAGE, {
      keychainService: KEYCHAIN_SERVICE,
    });
  } catch (e) {
    console.warn('XMTP: failed to delete stored key', e);
  }
};

export const XMTP = {
  client: null,

  initializeClient: async ({wallet, address}) => {
    try {
      const signer = {
        getIdentifier: async () =>
          new PublicIdentity(wallet.address, 'ETHEREUM'),
        getChainId: () => undefined,
        getBlockNumber: () => undefined,
        signerType: () => 'EOA',
        signMessage: async message => {
          const sig = await wallet.signMessage(message);
          return {signature: Buffer.from(sig.replace('0x', ''), 'hex')};
        },
      };
      if (XMTP.client?.publicIdentity?.identifier !== address?.toLowerCase()) {
        const createClient = async () => {
          const dbEncryptionKey = await getOrCreateDbEncryptionKey();
          return Client.create(signer, {
            env: XMTP_ENV,
            dbEncryptionKey,
            codecs: [new ReplyCodec(), new ContentTypeCustomReplyCodec()],
          });
        };
        try {
          XMTP.client = await createClient();
        } catch (storageError) {
          if (
            storageError?.message?.includes('PRAGMA key') ||
            storageError?.message?.includes('Storage error')
          ) {
            console.warn(
              'XMTP: stale database detected, clearing and retrying',
            );
            await clearXmtpDatabase();
            XMTP.client = await createClient();
          } else {
            throw storageError;
          }
        }
      }
      return XMTP.client;
    } catch (error) {
      console.log('XMTP initializeClient error:', error);
      return null;
    }
  },

  getClient: () => XMTP.client,

  getConversations: async () => {
    try {
      if (!XMTP.client) {
        console.warn('XMTP: Please initialize client first');
        return [];
      }
      await XMTP.client.conversations.sync();
      const conversations = await XMTP.client.conversations.list(
        {lastMessage: true, consentState: true},
        undefined,
        ['allowed', 'unknown'],
      );
      return XMTP.formatConversation(conversations);
    } catch (error) {
      console.log('XMTP getConversations error:', error);
      return [];
    }
  },

  // Static call — no initialized client needed
  checkAccountExists: async ({address}) => {
    try {
      const result = await Client.canMessage(XMTP_ENV, [
        new PublicIdentity(address, 'ETHEREUM'),
      ]);
      return result[address.toLowerCase()] ?? false;
    } catch (error) {
      console.log('XMTP checkAccountExists error:', error);
      return false;
    }
  },

  getMessages: async ({topic, limit = 20, before = null, after = null}) => {
    try {
      if (!XMTP.client) {
        console.warn('XMTP: Please initialize client first');
        return [];
      }
      const conversation =
        await XMTP.client.conversations.findConversationByTopic(topic);
      if (!conversation) {
        return [];
      }
      const messages = await conversation.messages({
        limit,
        ...(before && {beforeNs: new Date(before).getTime() * 1_000_000}),
        ...(after && {afterNs: new Date(after).getTime() * 1_000_000}),
      });
      return XMTP.formatMessage(messages);
    } catch (error) {
      console.log('XMTP getMessages error:', error);
      return [];
    }
  },

  newConversation: async ({address}) => {
    try {
      if (!XMTP.client) {
        console.warn('XMTP: Please initialize client first');
        return null;
      }
      return await XMTP.client.conversations.findOrCreateDmWithIdentity(
        new PublicIdentity(address, 'ETHEREUM'),
      );
    } catch (error) {
      console.log('XMTP newConversation error:', error);
      return null;
    }
  },

  getConversation: async ({topic}) => {
    try {
      if (!XMTP.client) {
        console.warn('XMTP: Please initialize client first');
        return null;
      }
      let conv = await XMTP.client.conversations.findConversationByTopic(topic);
      if (!conv) {
        // Conversation not in local DB yet — sync from network and retry once
        await XMTP.client.conversations.sync();
        conv = await XMTP.client.conversations.findConversationByTopic(topic);
      }
      return conv ?? null;
    } catch (error) {
      console.log('XMTP getConversation error:', error);
      return null;
    }
  },

  blockConversation: async ({peerInboxId, topic}) => {
    try {
      if (!XMTP.client) {
        console.warn('XMTP: Please initialize client first');
        return;
      }
      if (!peerInboxId) {
        return;
      }
      const conv = await XMTP.getConversation({topic});
      if (!conv) {
        console.warn('XMTP: Conversation not found for topic', topic);
        return;
      }
      await conv.updateConsent('denied'); // 'allowed' | 'denied';
    } catch (error) {
      console.log('XMTP blockConversation error:', error);
    }
  },

  unBlockConversation: async ({peerInboxId, topic}) => {
    try {
      if (!XMTP.client) {
        console.warn('XMTP: Please initialize client first');
        return;
      }
      if (!peerInboxId) {
        return;
      }
      const conv = await XMTP.getConversation({topic});
      if (!conv) {
        console.warn('XMTP: Conversation not found for topic', topic);
        return;
      }
      await conv.updateConsent('allowed'); // 'allowed' | 'denied'
    } catch (error) {
      console.log('XMTP unBlockConversation error:', error);
    }
  },

  unSubscribeStream: () => {
    if (!XMTP.client) {
      return;
    }
    XMTP.client.conversations.cancelStreamAllMessages();
    XMTP.client.conversations.cancelStream();
  },

  streamConversationMessages: async ({topic, onMessage}) => {
    try {
      if (!XMTP.client) {
        console.warn('XMTP: Please initialize client first');
        return;
      }
      const conversation =
        await XMTP.client.conversations.findConversationByTopic(topic);
      if (!conversation) {
        return;
      }
      await conversation.streamMessages(message => {
        const formatted = XMTP.formatMessage([message]);
        if (formatted.length > 0) {
          onMessage(formatted[0]);
        }
      });
    } catch (error) {
      console.log('XMTP streamConversationMessages error:', error);
    }
  },

  cancelConversationStream: async ({topic}) => {
    try {
      if (!XMTP.client) {
        return;
      }
      const conversation =
        await XMTP.client.conversations.findConversationByTopic(topic);
      conversation?.cancelStream();
    } catch (error) {
      console.log('XMTP cancelConversationStream error:', error);
    }
  },

  sendMessage: async ({topic, message}) => {
    try {
      if (!XMTP.client) {
        console.warn('XMTP: Please initialize client first');
        return null;
      }
      const conversation =
        await XMTP.client.conversations.findConversationByTopic(topic);
      if (!conversation) {
        return null;
      }
      return await conversation.send(message);
    } catch (error) {
      console.log('XMTP sendMessage error:', error);
      return null;
    }
  },

  sendReply: async ({topic, replyData}) => {
    try {
      if (!XMTP.client) {
        console.warn('XMTP: Please initialize client first');
        return null;
      }
      const conversation =
        await XMTP.client.conversations.findConversationByTopic(topic);
      if (!conversation) {
        return null;
      }
      return await conversation.send({
        reply: {
          reference: replyData.repliedMessageId || '',
          content: {text: replyData.message},
        },
      });
    } catch (error) {
      console.log('XMTP sendReply error:', error);
      return null;
    }
  },

  formatMessage: messages => {
    const tempMessages = Array.isArray(messages) ? messages : [];
    const finalMessages = [];
    for (const msg of tempMessages) {
      // sentNs is nanoseconds in v5 — convert to ms for Date
      const sentNs =
        typeof msg.sentNs === 'bigint' ? Number(msg.sentNs) : msg.sentNs;
      const createdAt = new Date(sentNs / 1_000_000).toISOString();
      const user = {_id: msg.senderInboxId};
      const safeStr = v => (typeof v === 'string' ? v : '');
      if (msg.contentTypeId === 'xmtp.org/text:1.0') {
        finalMessages.push({
          _id: msg.id,
          text: safeStr(msg.content()),
          createdAt,
          user,
        });
      } else if (msg.contentTypeId === 'xmtp.org/reply:1.0') {
        const reply = msg.content();
        finalMessages.push({
          _id: msg.id,
          text: safeStr(reply?.content?.text),
          reference: reply?.reference,
          createdAt,
          user,
        });
      } else if (msg.contentTypeId === 'com.dok.wallet/customReply:1.1') {
        try {
          const customReply = msg.content();
          finalMessages.push({
            _id: msg.id,
            text: safeStr(customReply?.message),
            reference: customReply?.repliedMessageId,
            repliedMessage: safeStr(customReply?.repliedMessage),
            repliedUserId: customReply?.senderAddress,
            createdAt,
            user,
          });
        } catch (e) {
          try {
            const encodedJSON = msg.nativeContent?.encoded;
            const encoded = encodedJSON ? JSON.parse(encodedJSON) : null;
            if (encoded?.parameters) {
              finalMessages.push({
                _id: msg.id,
                text: safeStr(encoded.parameters.message),
                reference: encoded.parameters.repliedMessageId,
                repliedMessage: safeStr(encoded.parameters.repliedMessage),
                repliedUserId: encoded.parameters.senderAddress,
                createdAt,
                user,
              });
            }
          } catch (innerErr) {
            console.warn(
              'XMTP: failed to decode custom reply message',
              msg.id,
              innerErr,
            );
          }
        }
      }
    }
    return finalMessages;
  },

  formatConversation: async conversations => {
    const tempConversations = Array.isArray(conversations) ? conversations : [];
    return Promise.all(
      tempConversations.map(async conv => {
        const peerInboxId = conv.peerInboxId
          ? await conv.peerInboxId()
          : undefined;
        let peerAddress;
        if (peerInboxId && XMTP.client) {
          try {
            const inboxStates = await XMTP.client.inboxStates(true, [
              peerInboxId,
            ]);
            peerAddress = inboxStates?.[0]?.identities?.[0]?.identifier;
          } catch (e) {
            console.warn('XMTP: failed to resolve peer address', e);
          }
        }

        return {
          topic: conv.topic,
          peerInboxId,
          peerAddress,
          createdAt: new Date(conv.createdAt).toISOString(),
          version: conv.version,
          clientAddress: XMTP.client?.publicIdentity?.identifier,
          consentState: conv.state,
        };
      }),
    );
  },
};
