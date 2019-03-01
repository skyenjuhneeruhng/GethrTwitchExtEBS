// Fetch all environment variables.
const APP_DEBUG = process.env.APP_DEBUG;
const APP_NAME = process.env.APP_NAME || 'Gethr';
const APP_STAGE = process.env.APP_STAGE || 'dev';
const APP_URL = process.env.IS_OFFLINE !== 'true' ? process.env.APP_URL : 'http://localhost:3000';

const TWITCH_EXT_CLIENT_ID = process.env.TWITCH_EXT_CLIENT_ID;
// const TWITCH_EXT_OWNER_ID = process.env.TWITCH_EXT_OWNER_ID;
const TWITCH_EXT_SECRET = process.env.TWITCH_EXT_SECRET;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET;

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET;

if (!TWITCH_EXT_SECRET) {
    console.log('Twitch Extension secret required.\nFill out the env var \'TWITCH_EXT_SECRET\'');
    process.exit(1);
}

if (!TWITCH_EXT_CLIENT_ID) {
    console.log('Twitch Extension client ID required.\nFill out the env var \'TWITCH_EXT_CLIENT_ID\'');
    process.exit(1);
}

/*
if (!TWITCH_EXT_OWNER_ID) {
    console.log('Twitch Extension owner ID required.\nFill out the env var \'TWITCH_EXT_OWNER_ID\'');
    process.exit(1);
}
*/

if (!SPOTIFY_CLIENT_ID) {
    console.log('Spotify Client ID required.\nFill out the env var \'SPOTIFY_CLIENT_ID\'');
    process.exit(1);
}

if (!SPOTIFY_SECRET) {
    console.log('Spotify Client Secret required.\nFill out the env var \'SPOTIFY_SECRET\'');
    process.exit(1);
}

if (!LASTFM_API_KEY) {
    console.log('Last.fm api key required.\nFill out the env var \'LASTFM_API_KEY\'');
    process.exit(1);
}

// if (!LASTFM_API_SECRET) {
//     console.log('Last.fm Secret required.\nFill out the env var \'LASTFM_API_SECRET\'');
//     process.exit(1);
// }

module.exports = {
    APP_DEBUG,
    APP_NAME,
    APP_STAGE,
    APP_URL,

    TWITCH_EXT_CLIENT_ID,
    TWITCH_EXT_SECRET,

    SPOTIFY_CLIENT_ID,
    SPOTIFY_SECRET,

    LASTFM_API_KEY,
    LASTFM_API_SECRET,
};
