#!/bin/bash

PATH="$PATH:./node_modules/.bin"

if [ "v1" == "$CC2CB_BUILD_BRANCH" ]; then
  serverless deploy -s prod
else
  serverless deploy
fi

