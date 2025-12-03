// import {JSContentCodec} from '@xmtp/react-native-sdk';

const ContentTypeCustomReply = {
    authorityId: 'com.dok.wallet',
    typeId: 'customReply',
    versionMajor: 1,
    versionMinor: 1,
};

class CustomReply {
    constructor(repliedMessage, repliedMessageId, message, senderAddress) {
        this.repliedMessage = repliedMessage;
        this.repliedMessageId = repliedMessageId;
        this.message = message;
        this.senderAddress = senderAddress;
    }
}

class ContentTypeCustomReplyCodec {
    get contentType() {
        return ContentTypeCustomReply;
    }

    encode(decoded) {
        return {
            type: ContentTypeCustomReply,
            parameters: {
                repliedMessage: decoded.repliedMessage,
                repliedMessageId: decoded.repliedMessageId,
                message: decoded.message,
                senderAddress: decoded.senderAddress,
            },
            content: new Uint8Array(),
        };
    }

    decode(encoded) {
        const repliedMessage = encoded.parameters.repliedMessage;
        const repliedMessageId = encoded.parameters.repliedMessageId;
        const message = encoded.parameters.message;
        const senderAddress = encoded.parameters.senderAddress;

        return new CustomReply(
            repliedMessage,
            repliedMessageId,
            message,
            senderAddress,
        );
    }

    fallback(content) {
        return 'ContentTypeCustomReply is not supported';
    }

    shouldPush() {
        return true;
    }
}

export { ContentTypeCustomReplyCodec, CustomReply, ContentTypeCustomReply };
