#!/bin/bash

celo_monorepo_hash=$(git submodule status | awk '{print $1}')
komenci_hash=$(git rev-parse HEAD)

echo "Building komenci for:"
echo "   celo-monorepo @ ${celo_monorepo_hash}"
echo "   komenci @ ${komenci_hash}"

if docker image list | grep celo-monorepo-build-base | grep $celo_monorepo_hash; then
  echo "Skipping build: celo-monorepo image found!"
else
  docker build -f Dockerfile.monorepo . -t celo-monorepo-build-base:$celo_monorepo_hash
fi

if docker image list | grep komenci | grep $komenci_hash; then
  echo "Skipping build: komenci image found!"
else
  docker build .\
      -t komenci:$komenci_hash \
      -t celotestnet.azurecr.io/komenci/komenci:$komenci_hash \
      --build-arg MONOREPO_BUILD_VERSION=$celo_monorepo_hash \
      --build-arg KOMENCI_VERSION=$komenci_hash
fi

echo "Pushing komenci"
docker push celotestnet.azurecr.io/komenci/komenci:$komenci_hash
