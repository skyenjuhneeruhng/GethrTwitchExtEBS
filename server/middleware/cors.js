/**
 * Middleware to set the CORS headers.
 */
var cors = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return next();
};

module.exports = {
    cors
};
