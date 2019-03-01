const TwitchApi = require('./utils/twitch-api');
const User = require('./models/user');
const url = require('url');
const _ = require('lodash');

/**
 * Quick and dirty handler to log users from their username.
 */
module.exports = async (req, res) => {
    const { login } = url.parse(req.url, true).query;

    // Fetch user details from the Twitch API.
    let user_details;

    try {
        user_details = await TwitchApi.user(login);
        user_details = user_details.data[0];

        // If data is empty, we couldn't find the user.
        if (_.isEmpty(user_details)) {
            return res.status(404).send({
                message: `User ${login} not found.`,
                login: login
            });
        }
    }
    catch (e) {
        return res.status(500).send({
            message: 'Error contacting the Twitch API!',
            login: login
        });
    }

    // Check to see if the user is already opted in.
    let user = await User.findByTwitchChannelId(user_details.id);

    // If they are, no need to store data.
    if (!_.isEmpty(user)) {
        return res.send({
            message: 'Already opted-in!',
            login: login
        });
    }

    try {
        // Store their info in the database.
        user_details = {
            login: user_details.login,
            display_name: user_details.display_name,
            broadcaster_type: _.isEmpty(user_details.broadcaster_type) ? 'normal' : user_details.broadcaster_type,
            twitch_channel_id: user_details.id,
            twitch_user_id: user_details.id
        };

        await User.create(user_details);

        // Return the response.
        return res.send({
            message: 'Successfully opted-in!',
            login: login,
        });
    }
    catch (e) {
        return res.status(500).send({
            message: 'Error writing data to database.',
            login: login
        });
    }
};
