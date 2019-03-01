# Gethr Twitch Extension Backend Service
The Extension Backend Service (EBS) for the Gethr Twitch Extension.

## Requirements
- Node.js 8.10 or higher.
- [Serverless Framework](https://serverless.com/framework), [Serverless Offline](https://www.npmjs.com/package/serverless-offline)

## Running for development

1. Run `cp aws.env.{stage}.json.example aws.env.dev.json` and fill the new file out appropriately.
2. Run `sls offline start` to run locally or `sls deploy` to deploy to the development stage on AWS.

## Running for production

1. Run `cp aws.env.{stage}.json.example aws.env.prod.json` and fill the new file out appropriately.
2. Run `sls deploy --stage prod` to deploy to the production stage on AWS.
