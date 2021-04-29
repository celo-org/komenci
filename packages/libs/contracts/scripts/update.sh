#!/bin/bash

if [[ -z "$CELO_MONOREPO_PATH" ]]; then
    echo "Must provide CELO_MONOREPO_PATH in environment" 1>&2
    exit 1
fi

contracts=(MetaTransactionWallet MetaTransactionWalletDeployer Proxy Signatures Migrations)
protocol_path="$CELO_MONOREPO_PATH/packages/protocol"

for contract in ${contracts[@]}; do
    artefact_path="$protocol_path/build/contracts/${contract}.json"
    if [ ! -f "$artefact_path" ]; then
        echo "${contract}.json not found at $artefact_path"
        echo "You might need to run 'yarn build' in ${protocol_path}"
        exit 1
    fi

    echo "${contract}.json copied to ./artefacts/${contract}.json"
    cp $artefact_path ./artefacts/$contract.json
done

echo "Don't forget to bump the version and publish if needed."