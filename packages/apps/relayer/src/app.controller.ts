import { WalletConfig, walletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { RpcErrorFilter } from '@komenci/logger/dist/filters/rpc-error.filter'
import { makeAsyncThrowable } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import {
  MetaTransactionWalletWrapper,
  toRawTransaction,
} from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Body, Controller, Inject, UseFilters } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { TransactionService } from './chain/transaction.service'
import { GetPhoneNumberSignatureDto } from './dto/GetPhoneNumberSignatureDto'
import { SignPersonalMessageDto } from './dto/SignPersonalMessageDto'
import { SubmitTransactionBatchDto } from './dto/SubmitTransactionBatchDto'
import { SubmitTransactionDto } from './dto/SubmitTransactionDto'
import { OdisService } from './odis/odis.service'
import Web3 from 'web3'

export interface RelayerResponse<T> {
  payload: T
  relayerAddress: string
}

export enum RelayerCmd {
  SignPersonalMessage = "signPersonalMessage",
  GetPhoneNumberIdentifier = "getPhoneNumberIdentifier",
  SubmitTransaction = "submitTransaction",
  SubmitTransactionBatch = "submitTransactionBatch",
}

@Controller()
@UseFilters(RpcErrorFilter)
export class AppController {
  constructor(
    private readonly odisService: OdisService,
    private readonly web3: Web3,
    private readonly contractKit: ContractKit,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    private metaTxWallet: MetaTransactionWalletWrapper,
    private transactionService: TransactionService,
  ) {}

  @MessagePattern({ cmd: RelayerCmd.SignPersonalMessage})
  async signPersonalMessage(
    @Body() input: SignPersonalMessageDto
  ): Promise<RelayerResponse<string>> {
    return this.wrapResponse(
      await this.web3.eth.sign(
        input.data,
        this.walletCfg.address,
      )
    )
  }

  @MessagePattern({ cmd: RelayerCmd.GetPhoneNumberIdentifier})
  async getPhoneNumberIdentifier(
    @Body() input: GetPhoneNumberSignatureDto,
  ): Promise<RelayerResponse<string>> {
    return this.wrapResponse(
      await makeAsyncThrowable(
        this.odisService.getPhoneNumberSignature
      )(input)
    )
  }

  @MessagePattern({ cmd: RelayerCmd.SubmitTransaction})
  async submitTransaction(
    @Body() input: SubmitTransactionDto
  ): Promise<RelayerResponse<string>> {
    return this.wrapResponse(
      await makeAsyncThrowable(
        this.transactionService.submitTransaction
      )(input.transaction, input.context)
    )
  }

  @MessagePattern({ cmd: RelayerCmd.SubmitTransactionBatch })
  async submitTransactionBatch(
    @Body() input: SubmitTransactionBatchDto
  ): Promise<RelayerResponse<string>> {
    return this.wrapResponse(
      await makeAsyncThrowable(
         this.transactionService.submitTransaction,
      )(
        toRawTransaction(
          this.metaTxWallet.executeTransactions(
            input.transactions
          ).txo
        ),
        input.context
      )
    )
  }

  wrapResponse<T>(payload: T): RelayerResponse<T> {
    return {
      payload,
      relayerAddress: this.walletCfg.address
    }
  }
}
