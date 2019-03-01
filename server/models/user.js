const db = require('./../db/dynamodb');

var create = (document) => {
    return db.DynamoDB.table(db.GetTable('users'))
    .insert(document);
};

var findByTwitchChannelId = (channel_id) => {
    return db.DynamoDB.table(db.GetTable('users'))
    .where('twitch_channel_id').eq(channel_id)
    .get();
};

module.exports = {
    create,
    findByTwitchChannelId
};
