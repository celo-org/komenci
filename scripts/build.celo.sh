#!/bin/bash

yarn --cwd ./libs/celo/packages/base build
yarn --cwd ./libs/celo/packages/utils build
yarn --cwd ./libs/celo/packages/dev-utils build
yarn --cwd ./libs/celo/packages/contractkit build:gen
yarn --cwd ./libs/celo/packages/contractkit build
yarn --cwd ./libs/celo/packages/phone-number-privacy/common build
