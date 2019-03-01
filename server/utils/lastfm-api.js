/**
 * Wrapper around the Spotify API end points to be conveniently used
 * throughout the server app as Promises.
 */
const env = require('./../../config/env');
const request = require('request-promise-native');

// TODO: Automatically token refreshes when the access_token expires.

/**
 * Create a new playlist for the user.
 *
 * @param  {String}  user_id
 * @return {Promise}
 */
var getLastFMUserInfo = (user_id) => {
    let options = {
        url: `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=` + user_id + `&api_key=` + env.LASTFM_API_KEY + `&format=json`,
        json: true
    };
    return request.get(options);
};

var getRecentTracks = (username) => {
    let options = {
        url : `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=` + username + `&api_key=` + env.LASTFM_API_KEY + `&format=json`,
        json: true
    }
    return request.get(options);
}

module.exports = {
    getLastFMUserInfo,
    getRecentTracks
};
