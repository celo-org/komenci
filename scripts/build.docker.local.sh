#!/bin/bash

celo_monorepo_hash=$(git submodule status | awk '{print $1}')
komenci_hash=$(git rev-parse HEAD)

echo "Building komenci version: ${komenci_hash}"

if docker image list | grep komenci | grep $komenci_hash; then
  echo "Skipping build: komenci image found!"
else
  docker build .\
      -t komenci:$komenci_hash \
      -t celotestnet.azurecr.io/komenci/komenci:$komenci_hash \
      --build-arg KOMENCI_VERSION=$komenci_hash
fi

echo "Pushing komenci"
docker push celotestnet.azurecr.io/komenci/komenci:$komenci_hash
