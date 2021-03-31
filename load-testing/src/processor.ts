import { serializeSignature } from '@celo//base/lib/signatureUtils'
import { hexToBuffer }from '@celo/base'
import { normalizeAddressWith0x }from '@celo/base/lib/address'
import { ContractKit, newKit } from '@celo/contractkit'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { WasmBlsBlindingClient } from '@celo/identity/lib/odis/bls-blinding-client'
import { getBlindedPhoneNumber, getPhoneNumberIdentifierFromSignature } from '@celo/identity/lib/odis/phone-number-identifier'
import { buildLoginTypedData } from '@celo/komencikit/lib/login'
import { compressedPubKey } from '@celo/utils/lib/dataEncryptionKey'
import { LocalWallet } from '@celo/wallet-local'
import { randomHex } from 'web3-utils'
import { getAddressFromDeploy, waitForReceipt } from './utils'


enum Network {
  alfajores = 'alfajores',
  rc1 = 'rc1',
}
const fornoURL: Record<Network, string> = {
  alfajores: 'https://alfajores-forno.celo-testnet.org',
  rc1: 'https://rc1-forno.celo-testnet.org',
}


const WALLET_IMPLEMENTATIONS: Record<Network, Record<string, string>> = {
  [Network.alfajores]: {
    '1.1.0.0-p1': '0x88a2b9B8387A1823D821E406b4e951337fa1D46D',
    '1.1.0.0-p2': '0x786ec5A4F8DCad3A58D5B1A04cc99B019E426065',
    '1.1.0.0-p3': '0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A',
  },
  [Network.rc1]: {
    '1.1.0.0-p2': '0x6511FB5DBfe95859d8759AdAd5503D656E2555d7',
  },
}

const ODIS_PUB_KEYS: Record<Network, string> = {
  alfajores:
    'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA',
  rc1:
    'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA',
}

const wrapped = (fn: (...args: any[]) => Promise<void>) => {
  return async (...args: any[]) => {
    const next = args[args.length -1]
    try {
      // @ts-ignore
      await fn(...args)
      next()
    } catch (e) {
      console.log(e)
      next(e)
    }
  }
}

let _kit: ContractKit | null = null
let _kitWallet: LocalWallet | null = null

export const prepareStartSession = wrapped(async (requestParams, context, ee) => {
  const captchaToken = 'special-captcha-bypass-token'
  if (_kit == null || _kitWallet == null) {
    _kitWallet = new LocalWallet()
    _kit = newKit(fornoURL[context.vars.$environment], _kitWallet)
  }

  context.vars.pkey = randomHex(32)
  context.vars.dek = randomHex(32)
  _kitWallet.addAccount(context.vars.pkey)
  context.vars.wallet = _wallet
  context.vars.contractKit = _kit
  // Setting up variables for the scenario.
  const accounts = _kitWallet.getAccounts()
  context.vars.account = accounts[accounts.length - 1]
  context.vars.externalAccount = normalizeAddressWith0x(context.vars.account)
  context.vars.dekPublicKey = compressedPubKey(hexToBuffer(context.vars.dek))
  context.vars.e164Number = "+40" + Math.floor(Math.random() * 1000000000)
  context.vars.blsBlindingClient = new WasmBlsBlindingClient(ODIS_PUB_KEYS[context.vars.$environment])

  const loginStruct = buildLoginTypedData(context.vars.externalAccount, captchaToken)
  const signature = await context.vars.contractKit.signTypedData(
    context.vars.externalAccount,
    loginStruct
  )
  const serializedSignature = serializeSignature(signature)
  requestParams.json = {
    externalAccount: context.vars.externalAccount,
    captchaResponseToken: captchaToken,
    signature: serializedSignature
  }
})

export const prepareDeployWallet = wrapped(async (requestParams, context, ee) => {
  const walletImplementationAddress = WALLET_IMPLEMENTATIONS[context.vars.$environment]['1.1.0.0-p3']
  requestParams.json = {
    implementationAddress: walletImplementationAddress
  }
})

export const preparePepperRequest = wrapped(async (requestParams, context, ee, next) => {
  const blindedPhoneNumber = await getBlindedPhoneNumber(context.vars.e164Number, context.vars.blsBlindingClient)

  requestParams.json = {
    blindedPhoneNumber: blindedPhoneNumber, 
    clientVersion: "1.1.0.0-p3"
  }
})

export const recordPepperAndIdentifier = wrapped(async (requestParams, response, context, ee) => {
  if(!response.body.combinedSignature) {
    console.log(response.body)
    console.log("Out of quota")
    return
  }
  const phoneNumberHashDetails = await getPhoneNumberIdentifierFromSignature(
    context.vars.e164Number,
    response.body.combinedSignature!,
    context.vars.blsBlindingClient
  )
  context.vars.identifier = phoneNumberHashDetails.phoneHash
  context.vars.pepper = phoneNumberHashDetails.pepper
  console.log({
    identifier: phoneNumberHashDetails.phoneHash,
    pepper: phoneNumberHashDetails.pepper,
  })
})

export const prepareSetAccount = wrapped(async (requestParams, context, ee) => {
  const accounts = await context.vars.contractKit.contracts.getAccounts()
  const proofOfPossession = await accounts.generateProofOfKeyPossessionLocally(
    context.vars.metaTxWalletAddress,
    context.vars.externalAccount,
    context.vars.pkey
  )

  const tx = await accounts.setAccount('', context.vars.dekPublicKey, context.vars.externalAccount, proofOfPossession)
  const wallet = await getWallet(context.vars.contractKit, context.vars.metaTxWalletAddress)

  const nonce = await wallet.nonce()

  const signature = await wallet.signMetaTransaction(tx.txo, nonce)
  const rawMetaTx = toRawTransaction(await wallet.executeMetaTransaction(tx.txo, signature).txo)

  requestParams.json = {
    destination: rawMetaTx.destination,
    data: rawMetaTx.data
  }
})

export const resetRetryCounter = (context, events, done) => {
  context.vars._retryCounter = 0
  return done();
}

export const waitForWallet = wrapped(async (requestParams, response, context, ee, next) => {
  if (response.body.status === 'deployed') {
    context.vars.metaTxWalletAddress = response.body.walletAddress
  } else {
    const addressResp = await getAddressFromDeploy(context.vars.contractKit, context.vars.externalAccount, response.body.txHash)
    if (addressResp.ok === true) {
      context.vars.metaTxWalletAddress = addressResp.result
    } else {
      context.vars._walletError = addressResp.error
      context.vars.metaTxWalletAddress = undefined
    }
  }
})

export const prepareSubsidisedAttestations = wrapped(async (requestParams, context, ee) => {
  const attestations = await context.vars.contractKit.contracts.getAttestations()
  const wallet = await getWallet(context.vars.contractKit, context.vars.metaTxWalletAddress)
  const nonce = await wallet.nonce()

  const attestationsRequested = 3

  const approveTx = await attestations.approveAttestationFee(attestationsRequested)
  const approveTxSig = await wallet.signMetaTransaction(approveTx.txo, nonce)
  const approveMetaTx = await wallet.executeMetaTransaction(approveTx.txo, approveTxSig)

  const requestTx = await attestations.request(context.vars.identifier, attestationsRequested)
  const requestTxSig = await wallet.signMetaTransaction(requestTx.txo, nonce + 1)
  const requestMetaTx = await wallet.executeMetaTransaction(requestTx.txo, requestTxSig)

  requestParams.json = {
    identifier: context.vars.identifier,
    attestationsRequested: attestationsRequested,
    walletAddress: context.vars.metaTxWalletAddress,
    requestTx: toRawTransaction(requestMetaTx.txo),
    approveTx: toRawTransaction(approveMetaTx.txo),
  }
})

export const prepareSelectIssuers = wrapped(async (requestParams, context, ee) => {
  const attestations = await context.vars.contractKit.contracts.getAttestations()
  await attestations.waitForSelectingIssuers(context.vars.identifier, context.vars.metaTxWalletAddress)
  const issuer = await attestations.selectIssuers(context.vars.identifier)
  const wallet = await getWallet(context.vars.contractKit, context.vars.metaTxWalletAddress)
  const nonce = await wallet.nonce()

  const signature = await wallet.signMetaTransaction(issuer.txo, nonce)
  const rawMetaTx = toRawTransaction(await wallet.executeMetaTransaction(issuer.txo, signature).txo)

  requestParams.json = {
    destination: rawMetaTx.destination,
    data: rawMetaTx.data
  }
})

export function logHeaders(requestParams, response, context, ee, next) {
  console.log(response.body)
  return next() // MUST be called for the scenario to continue
}

export const waitForTransaction = wrapped(async (requestParams, response, context, ee) => {
  const receipt = await waitForReceipt(context.vars.contractKit, response.body.txHash)
  if (receipt.ok === false) {
    context.vars.latestTxConfirmed = false
    context.vars._latestTxError = receipt.error
  } else {
    context.vars.latestTxConfirmed = true
  }
})

let _wallet
export async function getWallet(contractKit, address: string) {
  if (_wallet?.address !== address) {
    _wallet = await contractKit.contracts.getMetaTransactionWallet(address)
  }
  return _wallet
}

export function walletNotDeployed(context, next) {
  context.vars._retryCounter += 1
  if (context.vars._retryCounter > 5) {
    throw context.vars._walletError
  }
  return next(typeof context.vars.metaTxWalletAddress !== 'string')
}

export function latestTxNotConfirmed(context, next) {
  context.vars._retryCounter += 1
  if (context.vars._retryCounter > 5) {
    throw context.vars._latestTxError
  }
  return next(context.vars.latestTxConfirmed === false)
}