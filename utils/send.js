const flatBuffers = require('../node_modules/flatbuffers/js/flatbuffers');
const Message = require('../schemas/generated/javascript/game/message/message').Message;
const { payloadBuilder } = require('./payloadBuilder');

function send(ws,msgId,payload){
    const builder = new flatBuffers.Builder(1024);
    const entry = payloadBuilder[msgId];

    if (!entry)
    {
        console.error(`No PayloadType for msgId ${msgId}`);
        return;
    }

    const payloadOffset = entry.build(builder,payload);
    Message.startMessage(builder);
    Message.addMsgId(builder,msgId);
    Message.addPayloadType(builder,entry.payloadType);
    Message.addPayload(builder,payloadOffset);
    Message.addTimeStamp(builder, Date.now() & 0xFFFFFFFF);
    builder.finish(Message.endMessage(builder));



    ws.send(builder.asUint8Array());
}

module.exports = {send};