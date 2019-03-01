/**
 * Lambda function handler so Express can be used on AWS.
 */
const serverless = require('serverless-http');

const { app } = require('./server/ebs.js');

module.exports.handler = serverless(app);
