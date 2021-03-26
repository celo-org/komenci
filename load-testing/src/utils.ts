import { normalizeAddressWith0x } from '@celo/base/lib/address'
import { Err, Ok } from '@celo/base/lib/result'
import { serializeSignature } from '@celo/base/lib/signatureUtils'
import { ContractKit } from '@celo/contractkit'
import { 
  LoginSignatureError, 
  TxEventNotFound, 
  TxRevertError, 
  TxTimeoutError 
} from '@celo/komencikit/lib/errors'
import { buildLoginTypedData } from '@celo/komencikit/lib/login'
import { sleep } from '@celo/utils/lib/async'
import { EventLog } from 'web3-core'


interface ContractEventLog<T> extends EventLog {
  returnValues: T
}

export async function getLoginSignature(
  contractKit: ContractKit,
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
  const receiptResult = await waitForReceipt(contractKit, txHash)
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
