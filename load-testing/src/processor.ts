import fs = require('fs')
import path = require('path')
import { getLoginSignature, getAddressFromDeploy } from './utils'
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
const wallet = new LocalWallet()
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


const e164Number = "+40723301264"
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
  // const serializedSignature = await getLoginSignature(account, captchaToken)
  // if (!serializedSignature.ok) {
  //   return serializedSignature
  // }


  requestParams.json = {
    externalAccount: externalAccount,
    captchaResponseToken: captchaToken,
    signature: serializedSignature
  }
  return next(); // MUST be called for the scenario to continue
}

async function setDeployWalletBody(requestParams, context, ee, next) {
  // const walletImplementationAddress = WALLET_IMPLEMENTATIONS[environment]
  // console.log(walletImplementationAddress)
  requestParams.json = {
    implementationAddress: "0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A" //walletImplementationAddress
  }
  return next() 
}

async function setDistributedBlindedPeppertBody(requestParams, context, ee, next) {
  // const walletImplementationAddress = WALLET_IMPLEMENTATIONS[environment]
  // console.log(walletImplementationAddress)
  const blindedPhoneNumber = await getBlindedPhoneNumber(e164Number, blsBlindingClient)

  requestParams.json = {
    blindedPhoneNumber: blindedPhoneNumber, 
    clientVersion: "1.1.0.0-p3"
  }
  return next() 
}

async function setRequestSubsidisedAttestationsBody(requestParams, context, ee, next) {

  // const setAccount = await komenciKit.setAccount(walletAddress, '', dekPublicKey, account)

  // const accounts = await this.contractKit.contracts.getAccounts()
  // const proofOfPossession = await accounts.generateProofOfKeyPossession(
  //   metaTxWalletAddress,
  //   walletAddress
  // )
  // const attestations = await this.contractKit.contracts.getAttestations()
  // const wallet = await this.getWallet(metaTxWalletAddress)
  // const nonce = await wallet.nonce()

  // const approveTx = await attestations.approveAttestationFee(attestationsRequested)
  // const approveTxSig = await wallet.signMetaTransaction(approveTx.txo, nonce)
  // const approveMetaTx = wallet.executeMetaTransaction(approveTx.txo, approveTxSig)

  // const requestTx = await attestations.request(identifier, attestationsRequested)
  // const requestTxSig = await wallet.signMetaTransaction(requestTx.txo, nonce + 1)
  // const requestMetaTx = wallet.executeMetaTransaction(requestTx.txo, requestTxSig)

  // requestParams.json = {
  //   identifier: identifier,
  //   attestationsRequested: attestationsRequested,
  //   walletAddress: metaTxWalletAddress,
  //   requestTx: toRawTransaction(requestMetaTx.txo),
  //   approveTx: toRawTransaction(approveMetaTx.txo),
  // }
  return next() 
}

async function afterDistributedBlindedPepper(requestParams, response, context, ee, next) {
  const phoneNumberHashDetails = await getPhoneNumberIdentifierFromSignature(
    e164Number,
    response.body.combinedSignature,
    blsBlindingClient
  )
  // Need to pass to the attestation
  console.log({
    identifier: phoneNumberHashDetails.phoneHash,
    pepper: phoneNumberHashDetails.pepper,
  })
  return next()
}

// For setAccount
async function setSubmitMetatransactionBody(requestParams, context, ee, next){

  const accounts = await contractKit.contracts.getAccounts()
  console.log("Meta", metaTxWalletAddress)
  console.log("External", externalAccount)
  const proofOfPossession = await accounts.generateProofOfKeyPossession(
    metaTxWalletAddress,
    externalAccount
  )
  const tx = accounts.setAccount('', dekPublicKey, externalAccount, proofOfPossession)

  const wallet = await getWallet(metaTxWalletAddress)
  const signature = await wallet.signMetaTransaction(tx.txo)//, nonce)
  const rawMetaTx = toRawTransaction(wallet.executeMetaTransaction(tx.txo, signature).txo)

  console.log("XXXXX")
  console.log(rawMetaTx)
  requestParams.json = {
    rawMetaTx: rawMetaTx
  }
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

function logHeaders(requestParams, response, context, ee, next) {
  console.log(response.body)
  return next() // MUST be called for the scenario to continue
}


let _wallet
async function getWallet(address: string){
  if (_wallet?.address !== address) {
    _wallet = await contractKit.contracts.getMetaTransactionWallet(address)
  }
  return _wallet
}

module.exports = { logHeaders, setStartSessionBody, setDeployWalletBody, setDistributedBlindedPeppertBody , waitTx, afterDistributedBlindedPepper, setRequestSubsidisedAttestationsBody, setSubmitMetatransactionBody}