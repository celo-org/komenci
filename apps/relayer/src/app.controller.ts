import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { RpcErrorFilter } from '@app/komenci-logger/filters/rpc-error.filter'
import { makeAsyncThrowable } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import {
  MetaTransactionWalletWrapper,
  toRawTransaction,
} from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Body, Controller, Get, Inject, Req, UseFilters } from '@nestjs/common'
import { MessagePattern, RpcException } from '@nestjs/microservices'
import { TransactionService } from 'apps/relayer/src/chain/transaction.service'
import { SignPersonalMessageDto } from 'apps/relayer/src/dto/SignPersonalMessageDto'
import { SubmitTransactionBatchDto } from 'apps/relayer/src/dto/SubmitTransactionBatchDto'
import { SubmitTransactionDto } from 'apps/relayer/src/dto/SubmitTransactionDto'
import { OdisService } from 'apps/relayer/src/odis/odis.service'
import Web3 from 'web3'
import { DistributedBlindedPepperDto } from '../../onboarding/src/dto/DistributedBlindedPepperDto'

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
    @Body() input: DistributedBlindedPepperDto,
  ): Promise<RelayerResponse<string>> {
    return this.wrapResponse(
      await makeAsyncThrowable(
        this.odisService.getPhoneNumberIdentifier,
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
      )(input.transaction)
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
        )
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
