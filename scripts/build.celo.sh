#!/bin/bash

yarn --cwd ./libs/celo lerna run build \
  --scope @celo/base \
  --scope @celo/utils \
  --scope @celo/dev-utils \
  --scope @celo/connect \
  --scope @celo/wallet-base \
  --scope @celo/wallet-local \
  --scope @celo/wallet-remote \
  --scope @celo/wallet-hsm \
  --scope @celo/wallet-hsm-azure \
  --scope @celo/protocol \
  --scope @celo/identity \
  --scope @celo/contractkit \
  --scope @celo/komencikit \
  --scope @celo/phone-number-privacy-common

