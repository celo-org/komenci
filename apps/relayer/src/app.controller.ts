import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { RpcErrorFilter } from '@app/komenci-logger/filters/rpc-error.filter'
import { makeAsyncThrowable } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import {
  MetaTransactionWalletWrapper,
  toRawTransaction,
} from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Body, Controller, Inject, UseFilters } from '@nestjs/common'
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

@Controller()
@UseFilters(new RpcErrorFilter())
export class AppController {
  constructor(
    private readonly odisService: OdisService,
    private readonly web3: Web3,
    private readonly contractKit: ContractKit,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    private metaTxWallet: MetaTransactionWalletWrapper,
    private transactionService: TransactionService,
  ) {}

  @MessagePattern({ cmd: 'signPersonalMessage' })
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

  @MessagePattern({ cmd: 'getPhoneNumberIdentifier' })
  async getPhoneNumberIdentifier(
    @Body() input: DistributedBlindedPepperDto,
  ): Promise<RelayerResponse<string>> {
    return this.wrapResponse(
      await makeAsyncThrowable(
        this.odisService.getPhoneNumberIdentifier,
        (error: Error) => new RpcException(error.message)
      )(input)
    )
  }

  @MessagePattern({ cmd: 'submitTransaction' })
  async submitTransaction(
    @Body() input: SubmitTransactionDto
  ): Promise<RelayerResponse<string>> {
    return this.wrapResponse(
      await makeAsyncThrowable(
        this.transactionService.submitTransaction,
        (error: Error) => new RpcException(error.message)
      )(input.transaction)
    )
  }

  @MessagePattern({ cmd: 'submitTransactionBatch' })
  async submitTransactionBatch(
    @Body() input: SubmitTransactionBatchDto
  ): Promise<RelayerResponse<string>> {
    return this.wrapResponse(
      await makeAsyncThrowable(
         this.transactionService.submitTransaction,
        (error: Error) => new RpcException(error.message)
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
