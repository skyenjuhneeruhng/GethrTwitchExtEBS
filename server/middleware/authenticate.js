/**
 * Middleware to authenticate the request via a valid JWT.
 */
const env = require('./../../config/env');
const jwt = require('jsonwebtoken');

var authenticate = (req, res, next) => {
    let bearerJwt = /^Bearer ([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)$/
        .exec(req.header('Authorization'));

    if (!bearerJwt) {
        return res.status(401).send();
    }

    bearerJwt = bearerJwt[1];

    verifyJwt(bearerJwt)
    .then((decoded) => {
        req.jwtPayload = decoded;

        next();
    })
    .catch((error) => res.status(401).send());
};

/**
 * Verifies the JSON Web Token has properly been signed.
 *
 * @param  {String}  token
 * @return {Promise}
 */
function verifyJwt (token) {
    let secret = new Buffer(env.TWITCH_EXT_SECRET, 'base64');
    const options = { algorithms: ['HS256'], ignoreExpiration: true };

    try {
        decoded = jwt.verify(token, secret, options);
    }
    catch (e) {
        return Promise.reject(e);
    }

    return Promise.resolve(decoded);
}

module.exports = {
    authenticate,
    verifyJwt
};
