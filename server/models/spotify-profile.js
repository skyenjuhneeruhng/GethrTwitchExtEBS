const db = require('./../db/dynamodb');

var create = (document) => {
    return db.DynamoDB.table(db.GetTable('spotify-profiles'))
    .insert(document);
};

var destroy = (channel_id) => {
    return db.DynamoDB.table(db.GetTable('spotify-profiles'))
    .where('twitch_channel_id').eq(channel_id)
    .delete();
};

var findByTwitchChannelId = (channel_id) => {
    return db.DynamoDB.table(db.GetTable('spotify-profiles'))
    .where('twitch_channel_id').eq(channel_id)
    .get();
};

module.exports = {
    create,
    destroy,
    findByTwitchChannelId
};
