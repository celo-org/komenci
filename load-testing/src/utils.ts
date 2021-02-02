const {serializeSignature} = require('../../libs/celo/packages/base/lib/signatureUtils')
const { buildLoginTypedData } =  require('../../libs/celo/packages/komencikit/lib/login')
const {Err, Ok} = require('../../libs/celo/packages/base/lib/result')
import { EventLog } from 'web3-core'
const {normalizeAddressWith0x} = require('../../libs/celo/packages/base/lib/address')
const {sleep} = require('../../libs/celo/packages/utils/lib/async')
const { TxEventNotFound, TxTimeoutError, TxRevertError, LoginSignatureError } = require('../../libs/celo/packages/komencikit/lib/errors')


interface ContractEventLog<T> extends EventLog {
  returnValues: T
}

export async function getLoginSignature(
  contractKit,
  account: any,
  captchaToken: string
) {
  try {
    const loginStruct = buildLoginTypedData(normalizeAddressWith0x(account), captchaToken)
    const signature = await contractKit.signTypedData(
      account,
      loginStruct
    )

    return Ok(serializeSignature(signature))
  } catch (e) {
    return Err(new LoginSignatureError(e))
  }
}

export async function getAddressFromDeploy(contractKit, externalAccount,  txHash: string) {
  const receiptResult = await this.waitForReceipt(contractKit, txHash)
  if (!receiptResult.ok) {
    return receiptResult
  }
  const receipt = receiptResult.result

  const deployer = await contractKit.contracts.getMetaTransactionWalletDeployer(receipt.to)

  const events = await deployer.getPastEvents(deployer.eventTypes.WalletDeployed, {
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  })

  const deployWalletLog = events.find(
    (
      event: ContractEventLog<{
        owner: string
        wallet: string
        implementation: string
        0: string
        1: string
        2: string
      }>
    ) => normalizeAddressWith0x(event.returnValues.owner) === externalAccount
  )

  if (deployWalletLog === undefined) {
    return Err(new TxEventNotFound(txHash, deployer.eventTypes.WalletDeployed))
  }

  return Ok(deployWalletLog.returnValues.wallet)
}

export async function waitForReceipt(contractKit, txHash: string) {
  let receipt: any | null = null
  let waited = 0
  while (receipt == null && waited < 20000) {
    receipt = await contractKit.web3.eth.getTransactionReceipt(txHash)
    if (receipt == null) {
      await sleep(100)
      waited += 100
    }
  }

  if (receipt == null) {
    return Err(new TxTimeoutError())
  }

  if (!receipt.status) {
    // TODO: Possible to extract reason?
    return Err(new TxRevertError(txHash, ''))
  }

  return Ok(receipt)
}
