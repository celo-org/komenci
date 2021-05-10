#!/bin/bash

yarn lerna run --parallel \
               --scope @komenci/core \
               --scope @komenci/logger \
               --scope @komenci/throttler \
               --scope @komenci/kit \
               --scope @komenci/blockchain \
               $@