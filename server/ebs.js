const AWS = require('aws-sdk');
AWS.config.region = 'us-east-2';
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const url = require('url');
const _ = require('lodash');
const btoa = require('btoa');
const atob = require('atob');

const SpotifyApi = require('./utils/spotify-api');
const LastFMApi = require('./utils/lastfm-api');
const TwitchApi = require('./utils/twitch-api');
const env = require('./../config/env');
const { appUrl, rfc3339, generateUsersTableGuid , removeEmptyStringElements} = require('./utils/common');

// Middleware.
var { authenticate, verifyJwt } = require('./middleware/authenticate');
var { cors } = require('./middleware/cors');
var { log } = require('./middleware/log');

// Database "models".
var { SpotifyPlaylist, SpotifyProfile, SpotifyTokens, User, LastFM} = require('./models/index');

const app = express();

// Register middleware and render engine.
app.use(bodyParser.json())
   .use(cors);

app.engine('html', require('ejs').renderFile)
   .set('view engine', 'html')
   .set('views', path.join(__dirname, './../resources/views'));

// Only log if we're in debug mode.
if (env.APP_DEBUG && process.env.NODE_ENV !== 'test') {
    app.use(log);
}




// -- Routes -- \\
/**
 * For twitch subscription validation
 * GET
 */
app.get('/track/streamchange' , async(req, res) => {
    var hub = req.query;
    console.log("from twitch to this server" , hub);
    res.send(hub['hub.challenge']);
});

/**
 * Hooks the stream change on twitch
 */
app.post('/track/streamchange' , async(req , res) => {
    console.log(req.body);
    res.status(200).send('OK');
});



/**
 * Gets the twitch channel id and spotify id
 * returns { 'error' : 'true' } if there is no info
 */
 /* /userinfo?key=se0EFr9r3jwierwr)u3 */
app.post('/userinfo' , async(req, res) => {
    let key = req.body.key;
    if(!key)
    {
        res.send({
            error : true,
            msg : 'There is not key'
        });
        return;
    }
    let decodedKey = atob(key);
    let credentials = decodedKey.split(';');
    if(credentials.length != 2)
    {
        res.send({
            error : true,
            msg : 'Wrong key'
        });
        return;
    }
    let twitchChannelId = credentials[0];
    let userGuid = credentials[1];
    let user = await User.findByTwitchChannelId(twitchChannelId);
    if(!user)
    {
        res.send({
            error : true,
            msg : "There is no user"
        });
        return;
    }
    if(user.user_guid != userGuid)
    {
        res.send({
            error : true,
            msg : "Wrong guid"
        });
        return;
    }
    let spotify_profile = await SpotifyProfile.findByTwitchChannelId(twitchChannelId);
    if(!spotify_profile)
    {
        res.send({
            error : true,
            msg : "There is no Last.fm profile"
        });
        return;
    }   
    res.send({
        LastFMId: spotify_profile.name,
        TwitchChannelId: twitchChannelId,
        error: false
    });
    // for test.....
    // res.send({
    //     "LastFMId": "Leighton-Tan",
    //     "TwitchChannelId": "279415624",
    //     "error": false
    //   });
});

/**
 * check the lastfm userid and store
 */
app.post('/lastfm/auth' , authenticate, async (req, res) => {
    let { channel_id } = req.jwtPayload;
    console.log(req.jwtPayload);
    let lastfm_userid = req.body.lastfmuserid;
    let lastfm_user = {};
    if(!lastfm_userid)
    {
        return res.send({ error : "Missing Last.fm user id"});
    }
    lastfm_userid = lastfm_userid.trim();
    try{
        lastfm_user = await LastFMApi.getLastFMUserInfo(lastfm_userid);
        lastfm_user = lastfm_user.user;
    }
    catch(e)
    {
        console.log(e);
        return res.status(400).send({ error : 'Wrong lastfm user id'});
    }

    try {
        const { channel_id } = req.jwtPayload;
        let user = await User.findByTwitchChannelId(channel_id);

        //generate guid and store on users table
        
        if (_.isEmpty(user)) {
            var guid = generateUsersTableGuid();
            await User.create(removeEmptyStringElements({
                user_guid: guid,
                twitch_channel_id: channel_id,
                twitch_user_id: req.jwtPayload.user_id,
            }));

            //add twitch webhook subscribing code
            await TwitchApi.subscribeToStreamChange(req.jwtPayload.user_id);
            
        }

        // spotify_tokens['twitch_channel_id'] = channel_id;
        lastfm_user['twitch_channel_id'] = channel_id;

        // await SpotifyTokens.create(spotify_tokens);
        await LastFM.create(removeEmptyStringElements(lastfm_user));
    }
    catch (e) {
        console.log(e);
        return res.status(500).send({error: 'Error writing information to database.'});
    }

    // Trigger lambda for Spotify poller.
    let date = new Date();
    date.setTime(date.getTime() + ((60 * 59) * 1000)); // Add 59 minutes.
    let lambda = new AWS.Lambda();

     const params = {
        FunctionName: `fc2-${env.APP_STAGE}-launch`,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify({
            twitch_channel_id: req.jwtPayload.channel_id,
            lastfm_userid: lastfm_userid
        })
    };

    lambda.invoke(params, function(err, data) {
        if (err) {
            console.log(err);
            return res.status(400).send({error: err});
        } else {
            return res.status(200).send({error: ""});
        }
    });
});



/**
 * Gets the broadcaster's config for the extension.
 * Returns null if the broadcaster has not auth'd Spotify.
 */

app.get('/config', authenticate, async (req, res) => {
    let { channel_id } = req.jwtPayload;
    try{
        let user = await User.findByTwitchChannelId(channel_id);
        // let spotify_tokens = await SpotifyTokens.findByTwitchChannelId(channel_id);
        let spotify_profile = await SpotifyProfile.findByTwitchChannelId(channel_id);

        let key = channel_id + ";" + user.user_guid;

        key = btoa(key);

        res.send({
            key: key,
            // spotify_tokens: spotify_tokens,
            spotify_profile: spotify_profile
        });
    }
    catch(e)
    {
        res.status(400).send({error : "Error in getting information"});
    }
});

/**
 * Have a user enter their Twitch username to opt-in to using the extension.
 */
app.post('/opt-in', require('./opt-in'));



/**
 * Redirect URI for the Spotify Auth.
 * Validates data from Spotify then stores the user's credentials.
 *
 * Serves a basic HTML page that the extension can use to listen
 * for events in the form of a popup.
 */
app.get('/spotify/auth', async (req, res) => {
    // Get code and state (Twitch JWT) from the query string.
    let { code, error, state } = url.parse(req.url, true).query;
    let jwtPayload, spotify_info, spotify_tokens;

    if (!code && !error) {
        return res.status(400).render('spotify-auth', {error: 'No code or error received from Spotify.'});
    }

    if (error) {
        return res.render('spotify-auth', {error: 'Spotify access denied.'});
    }

    if (!state) {
        return res.status(400).render('spotify-auth', {error: 'No state received from Spotify.'});
    }

    // Validate JWT passed through state.
    try {
        jwtPayload = await verifyJwt(state);
    }
    catch (e) {
        return res.status(400).render('spotify-auth', {error: e.message});
    }

    if (!jwtPayload) {
        return res.status(401).render('spotify-auth', {error: 'Invalid JWT.'});
    }

    // TODO: Fetch additional channel information from the Twitch API as needed.

    // Fetch auth tokens from Spotify API.
    try {
        spotify_tokens = await SpotifyApi.token(code, `${appUrl()}/spotify/auth`);
    }
    catch (e) {
        console.log(e);
        return res.status(400).render('spotify-auth', {error: 'Could not fetch auth tokens from authorization code.'});
    }

    // Fetch Spotify account info and store it.
    try {
        spotify_info = await SpotifyApi.me(spotify_tokens.access_token);
    }
    catch (e) {
        return res.status(401).render('spotify-auth', {error: 'Could not fetch user info.'});
    }

    // Store user information.
    try {
        const { channel_id } = jwtPayload;
        let user = await User.findByTwitchChannelId(channel_id);
        console.log(user);

        // //generate guid and store on users table
        // var guid = generateUsersTableGuid();

        // if (_.isEmpty(user)) {
        //     await User.create(removeEmptyStringElements({
        //         user_guid: guid,
        //         twitch_channel_id: channel_id,
        //         twitch_user_id: jwtPayload.user_id
        //     }));
        // }
        // console.log(guid);
        spotify_tokens['twitch_channel_id'] = channel_id;
        spotify_info['twitch_channel_id'] = channel_id;
        console.log("spotify-tokens" , spotify_tokens);
        console.log("spotify-info" , spotify_info);

        await SpotifyTokens.create(removeEmptyStringElements(spotify_tokens));

        await SpotifyProfile.create(removeEmptyStringElements(spotify_info));
    }
    catch (e) {
        console.log(e);
        return res.status(400).render('spotify-auth', {error: 'Error writing information to database.'});
    }

    // Trigger lambda for Spotify poller.
    let date = new Date();
    date.setTime(date.getTime() + ((60 * 59) * 1000)); // Add 59 minutes.
    let lambda = new AWS.Lambda();

    const params = {
        FunctionName: `fc2-${env.APP_STAGE}-launch`,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify({
            twitch_channel_id: jwtPayload.channel_id,
            access_token: spotify_tokens.access_token,
            refresh_token: spotify_tokens.refresh_token,
            expires_at: rfc3339(date)
        })
    };

    lambda.invoke(params, function(err, data) {
        if (err) {
            console.log(err);
            return res.status(400).render('spotify-auth', {error: err});
        } else {
            return res.render('spotify-auth', {error: undefined});
        }
    });
});

/**
 * Gets information about what the user is currently playing.
 */
// app.get('/spotify/current', authenticate, async (req, res) => {
//     let user = await User.findByTwitchChannelId(req.jwtPayload.channel_id);
//     let nowPlaying, playlist, playlistId, track;

//     if (_.isEmpty(user)) {
//         return res.status(404).send();
//     }

//     let tokens;

//     // Fetch now playing.
//     try {
//         tokens = await SpotifyTokens.findByTwitchChannelId(req.jwtPayload.channel_id);
//         nowPlaying = await SpotifyApi.currently_playing(tokens.access_token);

//         if (!_.isEmpty(nowPlaying)) {
//             track = nowPlaying.item;
//         }
//         else {
//             track = null;
//         }
//     }
//     catch (e) {
//         return res.status(400).send(e.error);
//     }

//     // Fetch current playlist.
//     try {
//         if (!_.isEmpty(nowPlaying)) {
//             // NOTE: Weirdly enough the currently playing doesn't explicitly provide us the ID of the playlist.
//             //       So we extract it out of the URI.
//             playlistId = nowPlaying.context.uri.substr(nowPlaying.context.uri.lastIndexOf(':') + 1);

//             // Fetch playlist.
//             // If this 404's, that means the user is not listening to a track from a playlist.
//             playlist = await SpotifyApi.playlist(tokens.access_token, playlistId);
//         }
//         else {
//             playlist = null;
//         }
//     }
//     catch (e) {
//         playlist = null;
//     }

//     return res.send({
//         playlist,
//         track
//     });
// });

/**
 * Gets the Spotify playlists belonging to the user.
 */
app.get('/spotify/playlists', authenticate, async (req, res) => {
    let user = await User.findByTwitchChannelId(req.jwtPayload.channel_id);

    if (_.isEmpty(user)) {
        return res.status(404).send();
    }

    let playlists = await SpotifyPlaylist.findWhereNotDeleted(req.jwtPayload.channel_id);

    return res.send(playlists);
});

/**
 * Creates a new playlist for the user.
 * This will then ping the ML algorithm to crunch on filling the playlist with tracks.
 */
app.post('/spotify/playlists', authenticate, async (req, res) => {
    const { channel_id } = req.jwtPayload;
    let user = await User.findByTwitchChannelId(channel_id);
    let playlist;

    if (_.isEmpty(user)) {
        return res.status(404).send();
    }

    let playlistName = `${req.body.game} | ${req.body.start_time.hh}:${req.body.start_time.mm} ${req.body.start_time.A}`;
    let tokens, spotifyProfile;

    try {
        tokens = await SpotifyTokens.findByTwitchChannelId(channel_id);
        spotifyProfile = await SpotifyProfile.findByTwitchChannelId(channel_id);
        playlist = await SpotifyApi.create_playlist(tokens.access_token, spotifyProfile.id, playlistName);
    }
    catch (e) {
        return res.status(400).send(e);
    }

    // Add extension playlist data to the API response.
    playlist.twitch_channel_id = channel_id;
    playlist.game = req.body.game;
    playlist.day = req.body.day;
    playlist.start_time = req.body.start_time;
    playlist.length = req.body.length;

    // TODO: At this point the playlist is just empty. This will need to talk to the
    //       ML algorithm to populate the playlist with tracks.

    // Save the playlist to the playlists array.
    try {
        playlist = await SpotifyPlaylist.create(playlist);
    }
    catch (e) {
        return res.status(400).send(e);
    }

    return res.send(playlist);
});

/**
 * Unfollows (deletes) a user's playlist.
 */
app.delete('/spotify/playlists/:playlist_id', authenticate, async (req, res) => {
    const { channel_id } = req.jwtPayload;
    let user = await User.findByTwitchChannelId(channel_id);

    if (_.isEmpty(user)) {
        return res.status(404).send();
    }

    let tokens;

    try {
        tokens = await SpotifyTokens.findByTwitchChannelId(channel_id);
        await SpotifyApi.unfollow_playlist(tokens.access_token, req.params.playlist_id);
    }
    catch (e) {
        console.log('Playlist not found. Removing from user storage anyway.');
    }

    try {
        await SpotifyPlaylist.update(channel_id, req.params.playlist_id, {
            deleted_at: new Date().getTime()
        });
    }
    catch (e) {
        console.log(e);
    }

    return res.send();
});

/**
 * @TEMP Refreshes the Spotify auth token from a button press on the Extension Config.
 * @TODO This needs to happen automatically when a token expires.
 */
app.post('/spotify/refresh', authenticate, async (req, res) => {
    const { channel_id } = req.jwtPayload;
    let user = await User.findByTwitchChannelId(channel_id);

    if (_.isEmpty(user)) {
        return res.status(404).send();
    }

    try {
        let tokens = await SpotifyTokens.findByTwitchChannelId(channel_id);
        let refreshed = await SpotifyApi.refresh_token(tokens.refresh_token);

        await SpotifyTokens.update(channel_id, {
            access_token: refreshed.access_token
        });
    }
    catch (e) {
        return res.status(400).send(e);
    }

    return res.send();
});

/**
 * Revokes Spotify auth for the user.
 */
app.delete('/spotify/revoke', authenticate, async (req, res) => {
    const { channel_id } = req.jwtPayload;
    let user = await User.findByTwitchChannelId(channel_id);

    if (_.isEmpty(user)) {
        return res.status(404).send();
    }

    await SpotifyTokens.destroy(channel_id);
    await SpotifyProfile.destroy(channel_id);

    return res.send();
});

/**
 * disconnect from lastfm user data
 */
app.post('/lastfm/logout' , authenticate , async (req , res) => {
    const { channel_id } = req.jwtPayload;
    let user = await User.findByTwitchChannelId(channel_id);

    if (_.isEmpty(user)) {
        return res.status(404).send();
    }

    await LastFM.destroy(channel_id);

    return res.send();
}); 

/**
 * Gets information about what the user is currently playing.
 */
app.get('/spotify/current', authenticate, async (req, res) => {
    let user = await User.findByTwitchChannelId(req.jwtPayload.channel_id);
    let nowPlaying, playlist, playlistId, track;

    if (_.isEmpty(user)) {
        return res.status(404).send();
    }

    // Fetch now playing.
    try {
        spotifyProfile = await SpotifyProfile.findByTwitchChannelId(req.jwtPayload.channel_id);
        console.log(spotifyProfile);
        var recentTracks = await LastFMApi.getRecentTracks(spotifyProfile.name);
        console.log(recentTracks);
        if(recentTracks.error)
            track = null;
        else if(recentTracks.recenttracks.track)
        {
            if(recentTracks.recenttracks.track)
                if(recentTracks.recenttracks.track[0]['@attr'])
                    if(recentTracks.recenttracks.track[0]['@attr'].nowplaying)
                    {
                        var temp = recentTracks.recenttracks.track[0];
                        track = {};
                        track.Images = {};
                        track.Images[0] = {};
                        track.Images[0].Url = temp.image[0]['#text'];
                        track.Name = temp.name;
                        track.Artist = {};
                        track.Artist.Name = temp.artist['#text'];
                    }    
            else
                track = null;
        }
    }
    catch (e) {
        console.log(e);
        return res.status(400).send(e.error);
    }

    // Fetch current playlist.
    // try {
    //     if (!_.isEmpty(nowPlaying)) {
    //         // NOTE: Weirdly enough the currently playing doesn't explicitly provide us the ID of the playlist.
    //         //       So we extract it out of the URI.
    //         playlistId = nowPlaying.context.uri.substr(nowPlaying.context.uri.lastIndexOf(':') + 1);

    //         // Fetch playlist.
    //         // If this 404's, that means the user is not listening to a track from a playlist.
    //         playlist = await SpotifyApi.playlist(tokens.access_token, playlistId);
    //     }
    //     else {
    //         playlist = null;
    //     }
    // }
    // catch (e) {
    //     playlist = null;
    // }

    return res.send({
        playlist,
        track
    });
});

/**
 * Dummy route for authorizer testing.
 */
app.get('/', authenticate, (req, res) => {
    res.send(env.APP_NAME);
});



module.exports = {
    app,
    env
};
