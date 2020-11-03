import { appConfig, AppConfig } from '@app/onboarding/config/app.config'
import { DistributedBlindedPepperDto } from '@app/onboarding/dto/DistributedBlindedPepperDto'
import { RootError } from '@celo/base/lib/result'
import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { RelayerResponse } from 'apps/relayer/src/app.controller'
import { SignPersonalMessageDto } from 'apps/relayer/src/dto/SignPersonalMessageDto'
import { SubmitTransactionBatchDto } from 'apps/relayer/src/dto/SubmitTransactionBatchDto'
import { SubmitTransactionDto } from 'apps/relayer/src/dto/SubmitTransactionDto'

export enum RelayerErrorTypes {
  RelayerTimeout = "RelayerTimeout",
  RelayerCommunicationError = "RelayerCommunicationError"
}

class RelayerTimeout extends RootError<RelayerErrorTypes.RelayerTimeout> {
  constructor() {
    super(RelayerErrorTypes.RelayerTimeout)
  }
}

class RelayerCommunicationError extends RootError<RelayerErrorTypes.RelayerCommunicationError> {
  constructor(public readonly message) {
    super(RelayerErrorTypes.RelayerCommunicationError)
  }
}

@Injectable()
export class RelayerProxyService {
  constructor(
    @Inject('RELAYER_SERVICE') private client: ClientProxy,
    @Inject(appConfig.KEY) private cfg: AppConfig
  ) {}

  async signPersonalMessage(
    input: SignPersonalMessageDto
  ): Promise<RelayerResponse<string>> {
    return this.withTimeout(
      this.client
        .send({ cmd: `getPhoneNumberIdentifier` }, input)
        .toPromise()
    )
  }

  async getPhoneNumberIdentifier(
    input: DistributedBlindedPepperDto
  ): Promise<RelayerResponse<string>> {
    return this.withTimeout(
      this.client
        .send({ cmd: `getPhoneNumberIdentifier` }, input)
        .toPromise()
    )
  }

  async submitTransaction(
    input: SubmitTransactionDto
  ): Promise<RelayerResponse<string>> {
    return this.withTimeout(
      this.client
        .send({ cmd: `submitTransaction` }, input)
        .toPromise()
    )
  }

  async submitTransactionBatch(
    input: SubmitTransactionBatchDto
  ): Promise<RelayerResponse<string>> {
    return this.withTimeout(
      this.client
        .send({ cmd: `submitTransactionBatch` }, input)
        .toPromise()
    )
  }

  private async withTimeout<T>(call: Promise<T>): Promise<T> {
    try {
      return Promise.race([
        call,
        new Promise<T>((resolve, reject) => {
          setTimeout(
            () => reject(new RelayerTimeout()),
            this.cfg.relayerRpcTimeoutMs
          )
        })
      ])
    } catch (e) {
      if (e.errorType === RelayerErrorTypes.RelayerTimeout) {
        throw(e)
      } else {
        throw(new RelayerCommunicationError(e.message))
      }
    }
  }
}
