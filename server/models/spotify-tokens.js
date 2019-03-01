const db = require('./../db/dynamodb');

var create = (document) => {
    return db.DynamoDB.table(db.GetTable('spotify-tokens'))
    .insert(document);
};

var destroy = (channel_id) => {
    return db.DynamoDB.table(db.GetTable('spotify-tokens'))
    .where('twitch_channel_id').eq(channel_id)
    .delete();
};

var findByTwitchChannelId = (channel_id) => {
    return db.DynamoDB.table(db.GetTable('spotify-tokens'))
    .where('twitch_channel_id').eq(channel_id)
    .get();
};

var update = (channel_id, data) => {
    return db.DynamoDB.table(db.GetTable('spotify-tokens'))
    .where('twitch_channel_id').eq(channel_id)
    .update(data);
};

module.exports = {
    create,
    destroy,
    findByTwitchChannelId,
    update
};
