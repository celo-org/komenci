#!/bin/bash

yarn lerna run build --scope @komenci/core
yarn lerna run build --scope @komenci/logger
yarn lerna run build --scope @komenci/throttler
yarn lerna run build --scope @komenci/kit
yarn lerna run build --scope @komenci/blockchain