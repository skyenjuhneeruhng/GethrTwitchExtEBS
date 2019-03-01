/**
 * Common utilities to be used throughout the server(less) app.
 */
const env = require('./../../config/env');

/**
 * Builds the app URL from the server host and port.
 *
 * @return {String}
 */
var appUrl = () => {
    return process.env.IS_OFFLINE !== 'true' ? `https://${env.APP_URL}` : env.APP_URL;
};

/**
 * Fetches the current unix timestamp.
 *
 * @return {Number}
 */
var now = () => {
    return Math.round((new Date()).getTime() / 1000);
};

var rfc3339 = (d) => {
    function pad(n){return n<10 ? '0'+n : n}

    return d.getUTCFullYear()+'-'
        + pad(d.getUTCMonth()+1)+'-'
        + pad(d.getUTCDate())+'T'
        + pad(d.getUTCHours())+':'
        + pad(d.getUTCMinutes())+':'
        + pad(d.getUTCSeconds())+'Z'
};

var letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+<>?{},./_=[]!@#$%^&*()';

var generateUsersTableGuid = () => {
    var guid = '';
    for(var i = 0 ; i < 10 ; i ++)
    {
        guid += letters.charAt(parseInt(Math.random() * 100) % letters.length);
    }
    return guid;
}

var removeEmptyStringElements = (obj) => {
      for (var prop in obj) {
        if (typeof obj[prop] === 'object') {// dive deeper in
          removeEmptyStringElements(obj[prop]);
        } else if(obj[prop] === '') {// delete elements that are empty strings
          delete obj[prop];
        }
        else if(obj[prop] === []) {
            delete obj[prop];
        }
      }
      return obj;
}

module.exports = {
    appUrl,
    now,
    rfc3339,
    generateUsersTableGuid,
    removeEmptyStringElements
};
