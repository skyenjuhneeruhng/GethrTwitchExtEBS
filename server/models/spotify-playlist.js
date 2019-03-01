const db = require('./../db/dynamodb');

var create = (document) => {
    return db.DynamoDB.table(db.GetTable('spotify-playlists'))
    .insert(document);
};

var findWhereNotDeleted = (channel_id) => {
    return db.DynamoDB.table(db.GetTable('spotify-playlists'))
    .index('twitch_channel_id-index')
    .where('twitch_channel_id').eq(channel_id)
    .having('deleted_at').undefined()
    .query();
};

var findByTwitchChannelId = (channel_id) => {
    return db.DynamoDB.table(db.GetTable('spotify-playlists'))
    .where('twitch_channel_id').eq(channel_id)
    .get();
};

var update = (channel_id, playlist_id, data) => {
    return db.DynamoDB.table(db.GetTable('spotify-playlists'))
    .where('twitch_channel_id').eq(channel_id)
    .where('id').eq(playlist_id)
    .update(data);
};

module.exports = {
    create,
    findWhereNotDeleted,
    findByTwitchChannelId,
    update
};
