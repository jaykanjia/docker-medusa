#!/bin/bash
set -e

# yarn
# yarn build

cd .medusa/server
yarn install
cp ../../.env .env.production
# yarn predeploy
yarn start