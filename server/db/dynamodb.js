const AWS = require('aws-sdk');
const env = require('./../../config/env');

const $db = new AWS.DynamoDB();
const ddb = new AWS.DynamoDB.DocumentClient();
const DynamoDB = require('@awspilot/dynamodb')($db);

var GetTable = (table) => {
    return 'gethr-api-' + table + '-' + env.APP_STAGE;
};

module.exports = {
    DynamoDB,
    GetTable
};
