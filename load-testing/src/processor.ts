import { time } from 'console'
import fs = require('fs')
import path = require('path')
import { getLoginSignature, getAddressFromDeploy, waitForReceipt } from './utils'
const Web3 = require('web3')
const { buildLoginTypedData } =  require('../../libs/celo/packages/komencikit/lib/login')
const { compressedPubKey } = require('../../libs/celo/packages/utils/lib/dataEncryptionKey')
const { base64ToHex, hexToBuffer } = require('../../libs/celo/packages/base')
const { LocalWallet } = require('../../libs/celo/packages/contractkit/lib/wallets/local-wallet')
const { newKitFromWeb3 } = require('../../libs/celo/packages/contractkit/lib/kit')
const { serializeSignature } = require('../../libs/celo/packages/base/lib/signatureUtils')
const { normalizeAddressWith0x } = require('../../libs/celo/packages/base/lib/address')
const { Err, Ok } = require('../../libs/celo/packages/base/lib/result')
const { InvalidWallet } = require('../../libs/celo/packages/komencikit/lib/errors')
const { verifyWallet } = require('../../libs/celo/packages/komencikit/lib/verifyWallet')
const { WasmBlsBlindingClient } = require('../../libs/celo/packages/contractkit/lib/identity/odis/bls-blinding-client')
const { getBlindedPhoneNumber, getPhoneNumberIdentifierFromSignature } = require('../../libs/celo/packages/contractkit/lib/identity/odis/phone-number-identifier')
const { toRawTransaction } = require('../../libs/celo/packages/contractkit/lib/wrappers/MetaTransactionWallet')


let args = {};
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

const provider = new Web3.providers.HttpProvider(fornoURL[Network.alfajores])
const web3 = new Web3(provider)
const wallet = new LocalWallet()
const contractKit = newKitFromWeb3(web3, wallet)
let environment
const captchaToken = 'special-captcha-bypass-token'
const pkey = Web3.utils.randomHex(32)
const dek = Web3.utils.randomHex(32)
wallet.addAccount(pkey)
const account = wallet.getAccounts()[0]
let externalAccount = normalizeAddressWith0x(account)
const dekPublicKey = compressedPubKey(hexToBuffer(dek))

let metaTxWalletAddress
let identifier


let e164Number
const blsBlindingClient = new WasmBlsBlindingClient("kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA")

async function setStartSessionBody(requestParams, context, ee, next) {
  environment = context.vars.$environment
  console.log(`Loading test cases for environment: ${environment}`)
  // console.log(context.vars.$loopCount)

  const loginStruct = buildLoginTypedData(externalAccount, captchaToken)
  const signature = await contractKit.signTypedData(
    externalAccount,
    loginStruct
  )
  const serializedSignature = serializeSignature(signature)
  requestParams.json = {
    externalAccount: externalAccount,
    captchaResponseToken: captchaToken,
    signature: serializedSignature
  }
  return next()
}

async function setDeployWalletBody(requestParams, context, ee, next) {
  // const walletImplementationAddress = WALLET_IMPLEMENTATIONS[environment]
  requestParams.json = {
    implementationAddress: "0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A" //walletImplementationAddress
  }
  return next() 
}

async function setDistributedBlindedPeppertBody(requestParams, context, ee, next) {
  // const walletImplementationAddress = WALLET_IMPLEMENTATIONS[environment]
  // console.log(walletImplementationAddress)
  e164Number = "+40" + Math.floor(Math.random() * 1000000000)
  console.log(e164Number)
  const blindedPhoneNumber = await getBlindedPhoneNumber(e164Number, blsBlindingClient)

  requestParams.json = {
    blindedPhoneNumber: blindedPhoneNumber, 
    clientVersion: "1.1.0.0-p3"
  }
  return next() 
}



async function afterDistributedBlindedPepper(requestParams, response, context, ee, next) {
  if(!response.body.combinedSignature){
    console.log("Out of quota")
    return
  }
  const phoneNumberHashDetails = await getPhoneNumberIdentifierFromSignature(
    e164Number,
    response.body.combinedSignature!,
    blsBlindingClient
  )
  identifier = phoneNumberHashDetails.phoneHash
  console.log({
    identifier: phoneNumberHashDetails.phoneHash,
    pepper: phoneNumberHashDetails.pepper,
  })
  return next()
}

// For setAccount
async function setSubmitMetatransactionBody(requestParams, context, ee, next){
  const accounts = await contractKit.contracts.getAccounts()
  const proofOfPossession = await accounts.generateProofOfKeyPossession(
    metaTxWalletAddress.result,
    externalAccount
  )

  const tx = await accounts.setAccount('', dekPublicKey, externalAccount, proofOfPossession)
  const wallet = await getWallet(metaTxWalletAddress.result)

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

  metaTxWalletAddress =
  response.body.status === 'deployed'
      ? Ok(response.body.walletAddress)
      : await getAddressFromDeploy(response.body.txHash)

  if (!metaTxWalletAddress.ok) {
    return metaTxWalletAddress
  }

  const walletStatus = await verifyWallet(
    contractKit,
    metaTxWalletAddress.result,
    ['0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A'], // pending to get from variable
    externalAccount
  )

  if (!walletStatus.ok) {
    return Err(new InvalidWallet(walletStatus.error))
  }
  return next() // MUST be called for the scenario to continue
}

async function setRequestSubsidisedAttestationsBody(requestParams, context, ee, next) {

  const attestations = await contractKit.contracts.getAttestations()
  const wallet = await getWallet(metaTxWalletAddress.result)
  const nonce = await wallet.nonce()

  const attestationsRequested = 3

  const approveTx = await attestations.approveAttestationFee(attestationsRequested)
  const approveTxSig = await wallet.signMetaTransaction(approveTx.txo, nonce)
  const approveMetaTx = await wallet.executeMetaTransaction(approveTx.txo, approveTxSig)

  const requestTx = await attestations.request(identifier, attestationsRequested)
  const requestTxSig = await wallet.signMetaTransaction(requestTx.txo, nonce + 1)
  const requestMetaTx = await wallet.executeMetaTransaction(requestTx.txo, requestTxSig)

  requestParams.json = {
    identifier: identifier,
    attestationsRequested: attestationsRequested,
    walletAddress: metaTxWalletAddress.result,
    requestTx: toRawTransaction(requestMetaTx.txo),
    approveTx: toRawTransaction(approveMetaTx.txo),
  }
  return next() 
}

async function selectIssuer(requestParams, context, ee, next) {
    const attestations = await contractKit.contracts.getAttestations()
    await attestations.waitForSelectingIssuers(identifier, metaTxWalletAddress.result)
    const issuer = await attestations.selectIssuers(identifier)
    const wallet = await getWallet(metaTxWalletAddress.result)
    const nonce = await wallet.nonce()

    const signature = await wallet.signMetaTransaction(issuer.txo, nonce)
    const rawMetaTx = toRawTransaction(await wallet.executeMetaTransaction(issuer.txo, signature).txo)

    requestParams.json = {
      destination: rawMetaTx.destination,
      data: rawMetaTx.data
    }
    return next()
  return next() 
    return next()
}

function logHeaders(requestParams, response, context, ee, next) {
  console.log(response.body)
  return next() // MUST be called for the scenario to continue
}

async function getActionableAttestations(requestParams, response, context, ee, next) {
  const attestations = await contractKit.contracts.getAttestations()
  const attestationsToComplete = await attestations.getActionableAttestations(identifier, metaTxWalletAddress.result)
  return next()
}

async function waitEvents(requestParams, response, context, ee, next) {
  const tx = await waitForReceipt(response.body.txHash)
  const attestations = await contractKit.contracts.getAttestations()
  const events = await attestations.getPastEvents(attestations.eventTypes.AttestationsRequested, {
    fromBlock: tx.result.blockNumber,
    toBlock: tx.result.blockNumber,
  })
  return next()
}

async function waitReceipt(requestParams, response, context, ee, next) {
  await waitForReceipt(response.body.txHash)
  return next()
}


let _wallet
async function getWallet(address: string){
  if (_wallet?.address !== address) {
    _wallet = await contractKit.contracts.getMetaTransactionWallet(address)
  }
  return _wallet
}

module.exports = { logHeaders, setStartSessionBody, setDeployWalletBody, setDistributedBlindedPeppertBody , waitTx, afterDistributedBlindedPepper, setRequestSubsidisedAttestationsBody, setSubmitMetatransactionBody, waitReceipt, selectIssuer, waitEvents, getActionableAttestations }