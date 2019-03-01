/**
 * Simple middleware to log the type of request and path.
 */
var log = (req, res, next) => {
    console.log('Got request', req.path, req.method);

    return next();
};

module.exports = {
    log
};
