// import {
//   Client,
//   Conversation,
//   listMessages,
//   ReplyCodec,
//   sendMessage,
// } from '@xmtp/react-native-sdk';
import { IS_SANDBOX } from 'dok-wallet-blockchain-networks/config/config';
// import { ContentTypeCustomReplyCodec } from './xmtpContentReplyType';

export const XMTP = {
    client: null,
    initializeClient: async ({ wallet, address }) => {
        // if (this.client?.address !== address) {
        //     this.client = await Client.create(wallet, {
        //         env: IS_SANDBOX ? 'dev' : 'production',
        //         codecs: [new ReplyCodec(), new ContentTypeCustomReplyCodec()],
        //     });
        // }
        return null;
    },
    getClient: () => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // return this.client;
        return null;
    },
    getConversations: async () => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // const conversations = await this.client.conversations.list();
        // await this.client.contacts.refreshConsentList();
        // return await XMTP.formatConversation(conversations);
        return null;
    },
    checkAccountExists: async ({ address }) => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // return await this.client.canMessage(address);
        return null;
    },
    getMessages: async ({ topic, limit = 20, before = null, after = null }) => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // const messages = await listMessages(
        //     this.client,
        //     topic,
        //     limit,
        //     before,
        //     after,
        // );
        // return XMTP.formatMessage(messages);
        return null;
    },
    newConversation: async ({ address }) => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // return await this.client.conversations.newConversation(address);
        return null;
    },
    getConversation: ({ topic, peerAddress, createdAt, version }) => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // return new Conversation(this.client, {
        //     topic,
        //     peerAddress,
        //     createdAt,
        //     version,
        // });
        return null;
    },
    blockConversation: async ({ peerAddress }) => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // return await this.client?.contacts.deny([peerAddress]);
        return null;
    },
    unBlockConversation: async ({ peerAddress }) => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // return await this.client?.contacts.allow([peerAddress]);
        return null;
    },
    unSubscribeStream: () => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // this.client.conversations.cancelStreamAllMessages();
        // this.client.conversations.cancelStream();
        return null;
    },
    sendMessage: async ({ clientAddress, topic, message }) => {
        // if (!this.client) {
        //     console.warn('Please initialize client first');
        //     return;
        // }
        // return await sendMessage(this.client, topic, message);
        return null;
    },
    formatMessage: messages => {
        // const tempMesssages = Array.isArray(messages) ? messages : [];
        // const finalMessages = [];
        // for (let i = 0; i < tempMesssages.length; i++) {
        //     const msg = tempMesssages[i];
        //     if (msg.contentTypeId === 'xmtp.org/text:1.0') {
        //         finalMessages.push({
        //             _id: msg.id,
        //             text: msg.content(),
        //             createdAt: new Date(msg?.sent).toISOString(),
        //             user: {
        //                 _id: msg?.senderAddress,
        //             },
        //         });
        //     } else if (msg.contentTypeId === 'xmtp.org/reply:1.0') {
        //         const reply = msg.content();
        //         finalMessages.push({
        //             _id: msg.id,
        //             text: reply.content.text,
        //             reference: reply.reference,
        //             createdAt: new Date(msg?.sent).toISOString(),
        //             user: {
        //                 _id: msg?.senderAddress,
        //             },
        //         });
        //     } else if (msg.contentTypeId === 'com.dok.wallet/customReply:1.1') {
        //         const customReply = msg.content();
        //         finalMessages.push({
        //             _id: msg.id,
        //             text: customReply.message,
        //             reference: customReply.repliedMessageId,
        //             repliedMessage: customReply.repliedMessage,
        //             repliedUserId: customReply.senderAddress,
        //             createdAt: new Date(msg?.sent).toISOString(),
        //             user: {
        //                 _id: msg?.senderAddress,
        //             },
        //         });
        //     }
        // }
        // return finalMessages;
        return null;
    },
    formatConversation: async conversations => {
        // const tempConversations = Array.isArray(conversations) ? conversations : [];

        // const consents = await Promise.all(
        //     tempConversations.map(item => item.consentState()),
        // );
        // return tempConversations.map((conv, index) => ({
        //     topic: conv.topic,
        //     peerAddress: conv.peerAddress,
        //     createdAt: new Date(conv.createdAt).toISOString(),
        //     version: conv.version,
        //     clientAddress: conv?.client?.address,
        //     consentState: consents[index],
        // }));
        return null;
    },
};
