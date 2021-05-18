#!/bin/bash

yarn lerna run build --scope @komenci/core \
                     --scope @komenci/logger \
                     --scope @komenci/throttler \
                     --scope @komenci/kit \
                     --scope @komenci/blockchain \
                     --scope @komenci/analytics