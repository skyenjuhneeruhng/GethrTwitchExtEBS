/**
 * Wrapper around the Twitch API end points to be conveniently used
 * throughout the server app as Promises.
 */
const env = require('./../../config/env');
const request = require('request-promise-native');

/**
 * Get channel info based on the given username.
 *
 * @param  {String}  login
 * @return {Promise}
 */
var user = (login) => {
    let options = {
        url: `https://api.twitch.tv/helix/users?login=${login}`,
        headers: {
            'Client-Id': env.TWITCH_EXT_CLIENT_ID,
            'Content-Type': 'application/json'
        },
        json: true
    };

    return request.get(options);
};

var subscribeToStreamChange = (userid) => {
    var options = {
        url: 'https://api.twitch.tv/helix/webhooks/hub',
        headers: {
            'Client-Id': env.TWITCH_EXT_CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: {
            "hub.callback": "https://" + env.APP_URL + "/track/streamchange",
            "hub.mode": "subscribe",
            "hub.topic": "https://api.twitch.tv/helix/streams?user_id=" + userid,
            "hub.lease_seconds": 864000,
            "hub.secret": "gethr"
        },
        json: true // Automatically stringifies the body to JSON
    };

    return request.post(options);
    
}

module.exports = {
    user,
    subscribeToStreamChange
};
