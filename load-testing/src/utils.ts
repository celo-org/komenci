const {serializeSignature} = require('../../libs/celo/packages/base/lib/signatureUtils')
import { buildLoginTypedData } from '../../libs/celo/packages/komencikit/lib/login'
const {Err, Ok} = require('../../libs/celo/packages/base/lib/result')
import { EventLog } from 'web3-core';
const {normalizeAddressWith0x} = require('../../libs/celo/packages/base/lib/address')
const {sleep} = require('../../libs/celo/packages/utils/lib/async')
const { TxEventNotFound, TxTimeoutError, TxRevertError, LoginSignatureError } = require('../../libs/celo/packages/komencikit/lib/errors')
const Web3 = require('web3')
const { LocalWallet } = require('../../libs/celo/packages/contractkit/lib/wallets/local-wallet')
const newKitFromWeb3 = require('../../libs/celo/packages/contractkit/lib/kit').newKitFromWeb3

interface ContractEventLog<T> extends EventLog {
  returnValues: T;
}


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


    export async function getLoginSignature(
      account: any,
      captchaToken: string
    ){
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

    /**
   * Wait for the deploy tx and extract the wallet from events
   * @param txHash the transaction hash of the wallet deploy tx
   * @private
   */
  export async function getAddressFromDeploy(txHash: string){
    const receiptResult = await this.waitForReceipt(txHash)
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
      ) => normalizeAddressWith0x(event.returnValues.owner) === this.externalAccount
    )

    if (deployWalletLog === undefined) {
      return Err(new TxEventNotFound(txHash, deployer.eventTypes.WalletDeployed))
    }

    return Ok(deployWalletLog.returnValues.wallet)
  }

  export async function waitForReceipt(txHash: string) {
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


  export async function setAccount(
    metaTxWalletAddress: string,
    name: string,
    dataEncryptionKey: string,
    walletAddress: any
  ){
    const accounts = await contractKit.contracts.getAccounts()
    const proofOfPossession = await accounts.generateProofOfKeyPossession(
      metaTxWalletAddress,
      walletAddress
    )

    return this.submitMetaTransaction(
      metaTxWalletAddress,
      accounts.setAccount(name, dataEncryptionKey, walletAddress, proofOfPossession)
    )
  }


  // export async function submitMetaTransaction(
  //   metaTxWalletAddress: string,
  //   tx: CeloTransactionObject<any>,
  //   nonce?: number
  // ){
  //   const wallet = await this.getWallet(metaTxWalletAddress)
  //   const signature = await wallet.signMetaTransaction(tx.txo, nonce)
  //   const rawMetaTx = toRawTransaction(wallet.executeMetaTransaction(tx.txo, signature).txo)

  //   const resp = await this.client.exec(submitMetaTransaction(rawMetaTx))
  //   if (!resp.ok) {
  //     return resp
  //   }

  //   const txHash = resp.result.txHash
  //   console.debug(`${TAG}/submitMetaTransaction Waiting for transaction receipt: ${txHash}`)
  //   return this.waitForReceipt(txHash)
  // }