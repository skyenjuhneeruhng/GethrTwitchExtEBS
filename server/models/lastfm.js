const db = require('./../db/dynamodb');

var create = (document) => {
    return db.DynamoDB.table(db.GetTable('lastfm'))
    .insert(document);
};

var findByTwitchChannelId = (channel_id) => {
    return db.DynamoDB.table(db.GetTable('lastfm'))
    .where('twitch_channel_id').eq(channel_id)
    .get();
};

module.exports = {
    create,
    findByTwitchChannelId
};
