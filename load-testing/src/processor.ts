import { getAddressFromDeploy, waitForReceipt } from './utils'
import { buildLoginTypedData } from '@celo/komencikit/lib/login'
import { compressedPubKey } from '@celo/utils/lib/dataEncryptionKey'
import { hexToBuffer }from '@celo/base'
import { LocalWallet } from '@celo/wallet-local'
import { newKit } from '@celo/contractkit'
import { randomHex } from 'web3-utils'
import { serializeSignature } from '@celo//base/lib/signatureUtils'
import { normalizeAddressWith0x }from '@celo/base/lib/address'
import { Err, Ok } from '@celo/base/lib/result'
import { InvalidWallet } from '@celo/komencikit/lib/errors'
import { verifyWallet } from '@celo/komencikit/lib/verifyWallet'
import { WasmBlsBlindingClient } from '@celo/identity/lib/odis/bls-blinding-client'
import { getBlindedPhoneNumber, getPhoneNumberIdentifierFromSignature } from '@celo/identity/lib/odis/phone-number-identifier'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'


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

async function setStartSessionBody(requestParams, context, ee, next) {
  console.log(`Loading test cases for environment: ${context.vars.$environment}`)

  // Setting up variables for the scenario.
  const captchaToken = 'special-captcha-bypass-token'
  context.vars.wallet = new LocalWallet()
  context.vars.contractKit = newKit(fornoURL[context.vars.$environment], context.vars.wallet)
  context.vars.pkey = randomHex(32)
  context.vars.dek = randomHex(32)
  context.vars.wallet.addAccount(context.vars.pkey)
  context.vars.account = context.vars.wallet.getAccounts()[0]
  context.vars.externalAccount = normalizeAddressWith0x(context.vars.account)
  context.vars.dekPublicKey = compressedPubKey(hexToBuffer(context.vars.dek))
  context.vars.e164Number = "+40" + Math.floor(Math.random() * 1000000000)
  context.vars.blsBlindingClient = new WasmBlsBlindingClient(ODIS_PUB_KEYS[context.vars.$environment])

  try {
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
  return next()

  }catch(e) {
    console.log(e)
    return
  }
}

async function setDeployWalletBody(requestParams, context, ee, next) {
  const walletImplementationAddress = WALLET_IMPLEMENTATIONS[context.vars.$environment]['1.1.0.0-p3']
  requestParams.json = {
    implementationAddress: walletImplementationAddress
  }
  return next() 
}

async function setDistributedBlindedPeppertBody(requestParams, context, ee, next) {
  const blindedPhoneNumber = await getBlindedPhoneNumber(context.vars.e164Number, context.vars.blsBlindingClient)

  requestParams.json = {
    blindedPhoneNumber: blindedPhoneNumber, 
    clientVersion: "1.1.0.0-p3"
  }
  return next() 
}



async function afterDistributedBlindedPepper(requestParams, response, context, ee, next) {
  if(!response.body.combinedSignature) {
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
  return next()
}

// For setAccount
async function setSubmitMetatransactionBody(requestParams, context, ee, next) {
  const accounts = await context.vars.contractKit.contracts.getAccounts()
  const proofOfPossession = await accounts.generateProofOfKeyPossession(
    context.vars.metaTxWalletAddress.result,
    context.vars.externalAccount
  )

  const tx = await accounts.setAccount('', context.vars.dekPublicKey, context.vars.externalAccount, proofOfPossession)
  const wallet = await getWallet(context.vars.contractKit, context.vars.metaTxWalletAddress.result)

  const nonce = await wallet.nonce()

  const signature = await wallet.signMetaTransaction(tx.txo, nonce)
  const rawMetaTx = toRawTransaction(await wallet.executeMetaTransaction(tx.txo, signature).txo)

  requestParams.json = {
    destination: rawMetaTx.destination,
    data: rawMetaTx.data
  }
  return next()
}

async function waitTx(requestParams, response, context, ee, next) {
  context.vars.metaTxWalletAddress =
  response.body.status === 'deployed'
      ? Ok(response.body.walletAddress)
      : await getAddressFromDeploy(context.vars.contractKit, context.vars.externalAccount, response.body.txHash)
  
  if (!context.vars.metaTxWalletAddress.ok) {
    return context.vars.metaTxWalletAddress
  }

  const walletStatus = await verifyWallet(
    context.vars.contractKit,
    context.vars.metaTxWalletAddress.result,
    [WALLET_IMPLEMENTATIONS[context.vars.$environment]['1.1.0.0-p3']], // pending to get from variable
    context.vars.externalAccount
  )

  if (walletStatus.ok === false) {
    return Err(new InvalidWallet(walletStatus.error))
  }
  return next() // MUST be called for the scenario to continue
}

async function setRequestSubsidisedAttestationsBody(requestParams, context, ee, next) {

  const attestations = await context.vars.contractKit.contracts.getAttestations()
  const wallet = await getWallet(context.vars.contractKit, context.vars.metaTxWalletAddress.result)
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
    walletAddress: context.vars.metaTxWalletAddress.result,
    requestTx: toRawTransaction(requestMetaTx.txo),
    approveTx: toRawTransaction(approveMetaTx.txo),
  }
  return next() 
}

async function selectIssuer(requestParams, context, ee, next) {
    const attestations = await context.vars.contractKit.contracts.getAttestations()
    await attestations.waitForSelectingIssuers(context.vars.identifier, context.vars.metaTxWalletAddress.result)
    const issuer = await attestations.selectIssuers(context.vars.identifier)
    const wallet = await getWallet(context.vars.contractKit, context.vars.metaTxWalletAddress.result)
    const nonce = await wallet.nonce()

    const signature = await wallet.signMetaTransaction(issuer.txo, nonce)
    const rawMetaTx = toRawTransaction(await wallet.executeMetaTransaction(issuer.txo, signature).txo)

    requestParams.json = {
      destination: rawMetaTx.destination,
      data: rawMetaTx.data
    }
    return next()
}

function logHeaders(requestParams, response, context, ee, next) {
  console.log(response.body)
  return next() // MUST be called for the scenario to continue
}

async function waitEvents(requestParams, response, context, ee, next) {
  const tx = await waitForReceipt(context.vars.contractKit,response.body.txHash)
  if (tx.ok === true) {
    return next()
  } else {
    next(tx.error)
  }
}

async function waitReceipt(requestParams, response, context, ee, next) {
  await waitForReceipt(context.vars.contractKit, response.body.txHash)
  return next()
}


let _wallet
async function getWallet(contractKit, address: string) {
  if (_wallet?.address !== address) {
    _wallet = await contractKit.contracts.getMetaTransactionWallet(address)
  }
  return _wallet
}

module.exports = { logHeaders, setStartSessionBody, setDeployWalletBody, waitTx, setDistributedBlindedPeppertBody , afterDistributedBlindedPepper, setRequestSubsidisedAttestationsBody, setSubmitMetatransactionBody, waitReceipt, selectIssuer, waitEvents }