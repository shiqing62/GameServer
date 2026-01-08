const Message = require('../../../generated/javascript/game/message/message').Message;

class MessageBuilder {

    static warp(payloadType, payloadOffset, builder) {
        Message.startMessage(builder);
        Message.addPayloadType(builder, payloadType);
        Message.addPayload(builder, payloadOffset);
        Message.addTimeStamp(builder, Date.now() & 0xFFFFFFFF);
        return Message.endMessage(builder);
    }

}

module.exports = MessageBuilder;