import { Address, ensureLeading0x, normalizeAddress, bufferToHex, hexToBuffer, eqAddress } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { abi as InitializableProxyABI } from '@komenci/contracts/artefacts/InitializableProxy.json'
import { InitializableProxy } from '@komenci/contracts/types/InitializableProxy'
import { Proxy } from '@komenci/contracts/types/Proxy'
import { abi as ProxyABI } from '@komenci/contracts/artefacts/Proxy.json'
import Web3 from 'web3'
import {
  InvalidBytecode,
  InvalidImplementation,
  InvalidSigner,
  InvalidStorageRoot,
  WalletValidationError,
  InvalidOwner,
} from './errors'

import { SecureTrie } from 'merkle-patricia-tree'
import { encode as rlpEncode } from 'rlp'

/*
 * It is highly unlikely (but not impossible) that we will ever need
 * to use a new proxy implementation for the MTW, therefore we're
 * using this static SHA3 of the stripped bytecode to verify integrity.
 * If this ever needs to change it will be part of a bigger effort.
 *
 * See: `scripts/proxy-bytecode-sha3.js` or run `yarn proxy:sha3`
 */
const PROXY_BYTECODE_SHA3 = '0x69f56de93d0b1eb15364c67a2756afbc0b3112e544f64c4bf2c7bcdf287f0a91'
const INITIALIZABLE_PROXY_BYTECODE_SHA3 = '0xc2286bbf5380e663ae789ee05b878206db4ff6e693919f030ddc4923c5facca3'
const EIP1167_BYTECODE_REGEXP  = /^0x363d3d373d3d3d363d73([a-f0-9]{40})5af43d82803e903d91602b57fd5bf3$/

export const verifyWallet = async (
  contractKit: ContractKit,
  metaTxWalletAddress: Address,
  allowedImplementations: Address[],
  expectedSigner: Address
): Promise<Result<true, WalletValidationError>> => {
  allowedImplementations = allowedImplementations.map(normalizeAddress)
  const code = await contractKit.connection.web3.eth.getCode(metaTxWalletAddress)
  const eip1167Match = EIP1167_BYTECODE_REGEXP.exec(code)

  if (eip1167Match !== null) {
    const result = await verifyEIP1167Proxy(
      contractKit,
      ensureLeading0x(eip1167Match[1]),
      metaTxWalletAddress,
      allowedImplementations
    )
    if (result.ok === false) {
      return result
    }
  } else {
    const result = await verifyLegacyProxy(
      contractKit,
      code,
      metaTxWalletAddress,
      allowedImplementations,
      expectedSigner
    )
    if (result.ok === false) {
      return result
    }
  }

  const wallet = await contractKit.contracts.getMetaTransactionWallet(metaTxWalletAddress)
  const actualSigner = normalizeAddress(await wallet.signer())
  const normalizedExpectedSigner = normalizeAddress(expectedSigner)
  if (actualSigner !== normalizedExpectedSigner) {
    return Err(new InvalidSigner(metaTxWalletAddress, actualSigner, normalizedExpectedSigner))
  }

  return Ok(true)
}

// taken mostly from packages/protocol/lib/proxy-utils.ts to avoid consuming @celo/protocol
const OWNER_POSITION = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'
const IMPLEMENTATION_POSITION = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

async function verifyProxyStorageProof(web3: Web3, proxy: string, owner: string, implementation: string | null) {
  const proof = await web3.eth.getProof(
    web3.utils.toChecksumAddress(proxy),
    [OWNER_POSITION, IMPLEMENTATION_POSITION],
    'latest'
  )

  const trie = new SecureTrie()
  await trie.put(hexToBuffer(OWNER_POSITION), rlpEncode(owner.toLocaleLowerCase()))
  // Uninitialized value are not set in the trie explicitly.
  if (implementation !== null) {
    await trie.put(hexToBuffer(IMPLEMENTATION_POSITION), rlpEncode(implementation.toLocaleLowerCase()))
  }

  return proof.storageHash === bufferToHex(trie.root)
}

const verifyEIP1167Proxy = async (
  contractKit: ContractKit,
  proxyImplementationAddress: string,
  metaTxWalletAddress: Address,
  allowedImplementations: Address[],
): Promise<Result<true, WalletValidationError>> => {
    const proxyByteCode = await contractKit.connection.web3.eth.getCode(proxyImplementationAddress)
    if (contractKit.connection.web3.utils.soliditySha3(stripBzz(proxyByteCode)) !== INITIALIZABLE_PROXY_BYTECODE_SHA3) {
      return Err(new InvalidBytecode(metaTxWalletAddress))
    }

    // verify InitializableProxy storage with sentinel owner and null implementation
    if (!await verifyProxyStorageProof(
      contractKit.connection.web3, 
      proxyImplementationAddress, 
      // from https://github.com/celo-org/celo-monorepo/blob/ce24a3c07b245c8a7a536a9cbf5649946ba5221a/packages/protocol/contracts/common/InitializableProxy.sol#L21
      // Owner is set to 0x1
      "0x1",
      null
     )) {
      return Err(new InvalidStorageRoot(proxyImplementationAddress))
    }

    // Verify that the owner is itself
    const proxy = new contractKit.connection.web3.eth.Contract(
      InitializableProxyABI as any, 
      metaTxWalletAddress
     ) as unknown as InitializableProxy
    const owner = await proxy.methods._getOwner().call()
    if (!eqAddress(owner, metaTxWalletAddress)) {
      return Err(new InvalidOwner(metaTxWalletAddress))
    }

    const implementation = normalizeAddress(await proxy.methods._getImplementation().call())
    if (allowedImplementations.indexOf(implementation) === -1) {
      return Err(new InvalidImplementation(metaTxWalletAddress, implementation, allowedImplementations))
    }
    return Ok(true)
}

const verifyLegacyProxy = async (
  contractKit: ContractKit,
  code: string,
  metaTxWalletAddress: Address,
  allowedImplementations: Address[],
  expectedSigner: Address
): Promise<Result<true, WalletValidationError>> => {
  if (contractKit.connection.web3.utils.soliditySha3(stripBzz(code)) !== PROXY_BYTECODE_SHA3) {
    return Err(new InvalidBytecode(metaTxWalletAddress))
  }

  const proxy = new contractKit.connection.web3.eth.Contract(
    ProxyABI as any, 
    metaTxWalletAddress
    ) as unknown as Proxy
  const owner = await proxy.methods._getOwner().call()
  // In the legacy system the owner of the proxy is the signer
  // instead of being the proxy itself
  if (!eqAddress(owner, expectedSigner)) {
    return Err(new InvalidOwner(metaTxWalletAddress))
  }

  const implementation = normalizeAddress(await proxy.methods._getImplementation().call())
  if (allowedImplementations.indexOf(implementation) === -1) {
    return Err(new InvalidImplementation(metaTxWalletAddress, implementation, allowedImplementations))
  }
  return Ok(true)
}


function stripBzz(bytecode: string): string {
  // The actual deployed bytecode always differs because of the BZZ prefix
  // https://www.shawntabrizi.com/ethereum/verify-ethereum-contracts-using-web3-js-and-solc/
  return bytecode.split('a265627a7a72315820')[0]
}
