import { Address, normalizeAddressWith0x, serializeSignature, sleep } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import {
  MetaTransactionWalletWrapper,
  toRawTransaction,
} from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { BlsBlindingClient } from '@celo/identity/lib/odis/bls-blinding-client'
import {
  getBlindedPhoneNumber,
  getPhoneNumberIdentifierFromSignature,
} from '@celo/identity/lib/odis/phone-number-identifier'
import { abi as ProxyCloneFactoryABI } from '@komenci/contracts/artefacts/ProxyCloneFactory.json'
import { ProxyCloneCreated } from '@komenci/contracts/types/ProxyCloneFactory'
import {
  checkService,
  checkSession,
  CheckSessionResp,
  deployWallet,
  getDistributedBlindedPepper,
  GetDistributedBlindedPepperResp,
  requestSubsidisedAttestations,
  startSession,
  StartSessionPayload,
  StartSessionResp,
  submitMetaTransaction,
} from './actions'
import { KomenciClient } from './client'
import {
  AuthenticationFailed,
  FetchError,
  FetchErrorTypes,
  InvalidWallet,
  KomenciDown,
  KomenciKitErrorTypes,
  LoginSignatureError,
  TxError,
  TxErrorTypes,
  TxEventNotFound,
  TxRevertError,
  TxTimeoutError,
} from './errors'
import { buildLoginTypedData } from './login'
import { retry } from './retry'
import { verifyWallet } from './verifyWallet'
const parseReceiptEvents = require('web3-parse-receipt-events')

const TAG = 'KomenciKit'

interface KomenciOptions {
  url: string
  token?: string
  txRetryTimeoutMs: number
  txPollingIntervalMs: number
}

const DEFAULT_OPTIONS: Pick<KomenciOptions, 'txRetryTimeoutMs' | 'txPollingIntervalMs'> = {
  txRetryTimeoutMs: 20000,
  txPollingIntervalMs: 100,
}

export type KomenciOptionsInput = Omit<KomenciOptions, keyof typeof DEFAULT_OPTIONS> &
  Partial<KomenciOptions>

export class KomenciKit {
  private client: KomenciClient
  private options: KomenciOptions
  private externalAccount: string
  private _wallet?: MetaTransactionWalletWrapper

  constructor(
    private contractKit: ContractKit,
    externalAccount: string,
    options: KomenciOptionsInput
  ) {
    this.externalAccount = normalizeAddressWith0x(externalAccount)
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    }

    this.client = new KomenciClient(this.options.url, this.options.token)
  }

  /**
   * checkService: uses the /v1/health endpoint to check the service health
   * Valora can use this to assess if it should initiate the fee-less flow or not
   *
   * @return Result<true, KomenciDown>
   */
  checkService = async (): Promise<Result<true, KomenciDown>> => {
    const resp = await this.client.exec(checkService())
    if (resp.ok === true && resp.result.status === 'OK') {
      return Ok(true)
    }

    return Err(new KomenciDown())
  }

  /**
   * checkSession: uses the /v1/checkSession endpoint to check the current session
   * It returns the current quota usage and optionally a wallet address
   * if one was deployed during the session
   *
   * @return Result<CheckSessionResp, FetchError>
   */
  checkSession = async (): Promise<Result<CheckSessionResp, FetchError>> => {
    return this.client.exec(checkSession())
  }

  /**
   * startSession: uses the /v1/startSession endpoint to start a Komenci session
   * It results in a token that is saved in the client automatically and
   * will be used on subsequent requests.
   *
   * @param captchaToken - an unspent captcha token
   * @return Result<token, error>
   */
  startSession = async (
    captchaToken: string
  ): Promise<Result<StartSessionResp, FetchError | AuthenticationFailed | LoginSignatureError>> => {
    const signatureResp = await this.getLoginSignature(captchaToken)
    if (signatureResp.ok === false) {
      return signatureResp
    }

    const payload: StartSessionPayload = {
      externalAccount: this.externalAccount,
      captchaResponseToken: captchaToken,
      signature: signatureResp.result,
    }

    const resp = await this.client.exec(startSession(payload))

    if (resp.ok === true) {
      this.client.setToken(resp.result.token)
      if (resp.result.callbackUrl) {
        this.client.setCallbackUrl(resp.result.callbackUrl)
      }
      return Ok(resp.result)
    } else if (resp.error.errorType === FetchErrorTypes.Unauthorised) {
      return Err(new AuthenticationFailed())
    }

    return resp
  }

  /**
   * getDistributedBlindedPepper: uses the /v1/distributedBlindedPepper endpoint to
   * request the identifier and pepper associated with a phone number in a fee-less scenario
   *
   * @param e164Number - phone number
   * @param clientVersion
   * @param blsBlindingClient - Either WasmBlsBlindingClient or ReactBlsBlindingClient (for mobile client)
   * @returns the identifier and the pepper
   */
  @retry({
    tries: 3,
    bailOnErrorTypes: [
      FetchErrorTypes.Unauthorised,
      FetchErrorTypes.ServiceUnavailable,
      FetchErrorTypes.QuotaExceededError,
    ],
    onRetry: (_args, error, attempt) => {
      console.debug(`${TAG}/getDistributedBlindPepper attempt#${attempt} error: `, error)
    },
  })
  public async getDistributedBlindedPepper(
    e164Number: string,
    clientVersion: string,
    blsBlindingClient: BlsBlindingClient
  ): Promise<Result<GetDistributedBlindedPepperResp, FetchError>> {
    // Blind the phone number
    const blindedPhoneNumber = await getBlindedPhoneNumber(e164Number, blsBlindingClient)

    // Call Komenci to get the blinded pepper
    const resp = await this.client.exec(
      getDistributedBlindedPepper({ blindedPhoneNumber, clientVersion })
    )

    if (resp.ok === true) {
      // Unblind the result to get the pepper and resulting identifier
      const phoneNumberHashDetails = await getPhoneNumberIdentifierFromSignature(
        e164Number,
        resp.result.combinedSignature,
        blsBlindingClient
      )
      return Ok({
        identifier: phoneNumberHashDetails.phoneHash,
        pepper: phoneNumberHashDetails.pepper,
      })
    }

    return resp
  }

  /**
   * deployWallet: uses the /v1/deployWallet endpoint to deploy a MetaTransactionWallet Proxy
   * pointing it to the implementation passed as an argument
   * The function takes care of waiting for retrying, waiting for receipt and log parsing
   *
   * @param implementationAddress the implementation address Valora requires
   * @returns the meta-tx wallet address
   */
  @retry({
    tries: 3,
    bailOnErrorTypes: [
      FetchErrorTypes.Unauthorised,
      FetchErrorTypes.ServiceUnavailable,
      TxErrorTypes.Revert,
      KomenciKitErrorTypes.InvalidWallet,
    ],
    onRetry: (_args, error, attempt) => {
      console.debug(`${TAG}/deployWallet attempt#${attempt} error: `, error)
    },
  })
  public async deployWallet(
    implementationAddress: string
  ): Promise<Result<string, FetchError | TxError | InvalidWallet>> {
    const resp = await this.client.exec(deployWallet({ implementationAddress }))
    if (resp.ok === false) {
      return resp
    }

    const metaTxWalletAddress =
      resp.result.status === 'deployed'
        ? Ok(resp.result.walletAddress)
        : await this.getAddressFromDeploy(
            resp.result.txHash,
            resp.result.deployerAddress
          )

    if (!metaTxWalletAddress.ok) {
      return metaTxWalletAddress
    }

    const walletStatus = await verifyWallet(
      this.contractKit,
      metaTxWalletAddress.result,
      [implementationAddress],
      this.externalAccount
    )

    if (walletStatus.ok === false) {
      return Err(new InvalidWallet(walletStatus.error))
    }

    return Ok(metaTxWalletAddress.result)
  }

  /**
   * requestAttestations: uses the /v1/requestSubsidisedAttestations endpoint
   * in order to request attestations.
   * It constructs and passes in two meta transactions (approve, request)
   * which are executed in batch in Komenci.
   *
   * @param identifier - phone number identifier
   * @param metaTxWalletAddress - MetaTransactionWallet address requesting attestations
   * @param attestationsRequested - the number of attestations
   * @return CeloTxReceipt of the batch transaction
   */
  @retry({
    tries: 3,
    bailOnErrorTypes: [
      FetchErrorTypes.Unauthorised,
      FetchErrorTypes.ServiceUnavailable,
      FetchErrorTypes.QuotaExceededError,
      TxErrorTypes.Revert,
    ],
    onRetry: (_args, error, attempt) => {
      console.debug(`${TAG}/requestAttestations attempt#${attempt} error: `, error)
    },
  })
  public async requestAttestations(
    metaTxWalletAddress: string,
    identifier: string,
    attestationsRequested: number
  ): Promise<Result<CeloTxReceipt, FetchError | TxError>> {
    const attestations = await this.contractKit.contracts.getAttestations()
    const wallet = await this.getWallet(metaTxWalletAddress)
    const nonce = await wallet.nonce()

    const approveTx = await attestations.approveAttestationFee(attestationsRequested)
    const approveTxSig = await wallet.signMetaTransaction(approveTx.txo, nonce)
    const approveMetaTx = wallet.executeMetaTransaction(approveTx.txo, approveTxSig)

    const requestTx = await attestations.request(identifier, attestationsRequested)
    const requestTxSig = await wallet.signMetaTransaction(requestTx.txo, nonce + 1)
    const requestMetaTx = wallet.executeMetaTransaction(requestTx.txo, requestTxSig)

    const resp = await this.client.exec(
      requestSubsidisedAttestations({
        identifier,
        attestationsRequested,
        walletAddress: metaTxWalletAddress,
        requestTx: toRawTransaction(requestMetaTx.txo),
        approveTx: toRawTransaction(approveMetaTx.txo),
      })
    )

    if (resp.ok === false) {
      return resp
    }

    const txHash = resp.result.txHash
    return this.waitForReceipt(txHash)
  }

  /**
   * @deprecated This call is now bundled in the requestAttestations call
   *
   * approveAttestations: wraps the `submitMetaTransaction` action in order
   * to execute cUSD.approve(attestations, fee)
   *
   * @param metaTxWalletAddress - The MetaTxWallet selecting issuers
   * @param identifier - the phone number identifier
   */
  public approveAttestations = async (
    metaTxWalletAddress: string,
    attestationsRequested: number
  ): Promise<Result<CeloTxReceipt, FetchError | TxError>> => {
    const attestations = await this.contractKit.contracts.getAttestations()
    const approveTx = await attestations.approveAttestationFee(attestationsRequested)
    return this.submitMetaTransaction(metaTxWalletAddress, approveTx)
  }

  /**
   * selectIssuers: wraps the `submitMetaTransaction` action in order
   * to execute Attestations.selectIssuers(identifier)
   *
   * @param metaTxWalletAddress - The MetaTxWallet selecting issuers
   * @param identifier - the phone number identifier
   */
  public selectIssuers = async (
    metaTxWalletAddress: string,
    identifier: string
  ): Promise<Result<CeloTxReceipt, FetchError | TxError>> => {
    const attestations = await this.contractKit.contracts.getAttestations()
    await attestations.waitForSelectingIssuers(identifier, metaTxWalletAddress)
    return this.submitMetaTransaction(metaTxWalletAddress, attestations.selectIssuers(identifier))
  }

  /**
   * completeAttestation: wraps the `submitMetaTransaction` action in order
   * to execute Attestations.complete(identifier, account, issuer, code)
   *
   * @param metaTxWalletAddress - MetaTxWallet address requesting attestations
   * @param identifier - the phone number identifier
   * @param issuer - the issuer ID
   * @param code - the code
   */
  public completeAttestation = async (
    metaTxWalletAddress: string,
    identifier: string,
    issuer: Address,
    code: string
  ): Promise<Result<CeloTxReceipt, FetchError | TxError>> => {
    const attestations = await this.contractKit.contracts.getAttestations()
    return this.submitMetaTransaction(
      metaTxWalletAddress,
      await attestations.complete(identifier, metaTxWalletAddress, issuer, code)
    )
  }

  /**
   * setAccount: wraps the `submitMetaTransaction` action in order
   * to execute Account.setAccount(...)
   *
   * @param metaTxWalletAddress The MetaTxWallet account owner
   * @param name A string to set as the name of the account
   * @param dataEncryptionKey secp256k1 public key for data encryption. Preferably compressed.
   * @param walletAddress The wallet address to set for the account
   * @param proofOfPossession Signature from the wallet address key over the sender's address
   */
  public setAccount = async (
    metaTxWalletAddress: string,
    name: string,
    dataEncryptionKey: string,
    walletAddress: Address
  ): Promise<Result<CeloTxReceipt, FetchError | TxError>> => {
    const accounts = await this.contractKit.contracts.getAccounts()
    const proofOfPossession = await accounts.generateProofOfKeyPossession(
      metaTxWalletAddress,
      walletAddress
    )

    return this.submitMetaTransaction(
      metaTxWalletAddress,
      accounts.setAccount(name, dataEncryptionKey, walletAddress, proofOfPossession)
    )
  }

  /**
   * submitMetaTransaction: uses the /v1/submitMetaTransaction endpoint
   * It receives a wallet address and transaction (as a CeloTransactionObject)
   * and creates a signature and passes everything to Komenci for execution
   *
   * @param metaTxWalletAddress - the MTW that will execute the transaction
   * @param tx - the transaction to be executed
   * @param nonce - optional nonce to be used for signing the meta-tx
   */
  @retry({
    tries: 3,
    bailOnErrorTypes: [
      FetchErrorTypes.Unauthorised,
      FetchErrorTypes.ServiceUnavailable,
      FetchErrorTypes.QuotaExceededError,
      TxErrorTypes.Revert,
    ],
    onRetry: (_args, error, attempt) => {
      console.debug(`${TAG}/submitMetaTransaction attempt#${attempt} error: `, error)
    },
  })
  public async submitMetaTransaction(
    metaTxWalletAddress: string,
    tx: CeloTransactionObject<any>,
    nonce?: number
  ): Promise<Result<CeloTxReceipt, FetchError | TxError>> {
    const wallet = await this.getWallet(metaTxWalletAddress)
    const signature = await wallet.signMetaTransaction(tx.txo, nonce)
    const rawMetaTx = toRawTransaction(wallet.executeMetaTransaction(tx.txo, signature).txo)

    const resp = await this.client.exec(submitMetaTransaction(rawMetaTx))
    if (resp.ok === false) {
      return resp
    }

    const txHash = resp.result.txHash
    console.debug(`${TAG}/submitMetaTransaction Waiting for transaction receipt: ${txHash}`)
    return this.waitForReceipt(txHash)
  }

  /**
   * Utility function used to wait for a transaction to finalise and return the receipt
   *
   * @param txHash - the hash of the transaction to watch
   * @private
   */
  private async waitForReceipt(txHash: string): Promise<Result<CeloTxReceipt, TxError>> {
    let receipt: CeloTxReceipt | null = null
    let waited = 0
    while (receipt == null && waited < this.options.txRetryTimeoutMs) {
      receipt = await this.contractKit.connection.getTransactionReceipt(txHash)
      if (receipt == null) {
        await sleep(this.options.txPollingIntervalMs)
        waited += this.options.txPollingIntervalMs
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

  /**
   * Utility function used to instantiate a MetaTransactionWalletWrapper cached by address
   *
   * @param txHash - the hash of the transaction to watch
   * @private
   */
  private async getWallet(address: string): Promise<MetaTransactionWalletWrapper> {
    if (this._wallet?.address !== address) {
      this._wallet = await this.contractKit.contracts.getMetaTransactionWallet(address)
    }
    return this._wallet
  }

  /**
   * Used to create a signature for a login message that allows the server to verify that the
   * externalAccount passed in is actually owned by the caller.
   * It uses the captchaToken as a nonce
   *
   * @param captchaToken
   * @returns the signature of the login message
   * @private
   */
  private async getLoginSignature(
    captchaToken: string
  ): Promise<Result<string, LoginSignatureError>> {
    try {
      const loginStruct = buildLoginTypedData(this.externalAccount, captchaToken)
      const signature = await this.contractKit.connection.signTypedData(
        this.externalAccount,
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
  private async getAddressFromDeploy(
    txHash: string,
    deployerAddress: string
  ): Promise<Result<string, TxError>> {
    const receiptResult = await this.waitForReceipt(txHash)
    if (receiptResult.ok === false) {
      return receiptResult
    }

    const receipt = receiptResult.result
    const receiptWithEvents = parseReceiptEvents(ProxyCloneFactoryABI, deployerAddress, receipt)
    const deployProxyLog = Object.values(receiptWithEvents.events).find(
      (log: any) => log.event === "ProxyCloneCreated"
    ) as (ProxyCloneCreated | undefined)

    if (deployProxyLog === undefined) {
      return Err(new TxEventNotFound(txHash, "ProxyCloneCreated"))
    } 
    return Ok(deployProxyLog.returnValues.proxyClone)
  }
}
