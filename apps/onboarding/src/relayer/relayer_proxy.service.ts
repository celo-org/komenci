import { MetadataError } from '@app/komenci-logger/errors'
import { appConfig, AppConfig } from '@app/onboarding/config/app.config'
import { DistributedBlindedPepperDto } from '@app/onboarding/dto/DistributedBlindedPepperDto'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { RelayerCmd, RelayerResponse } from 'apps/relayer/src/app.controller'
import { SignPersonalMessageDto } from 'apps/relayer/src/dto/SignPersonalMessageDto'
import { SubmitTransactionBatchDto } from 'apps/relayer/src/dto/SubmitTransactionBatchDto'
import { SubmitTransactionDto } from 'apps/relayer/src/dto/SubmitTransactionDto'
import { isRight } from 'fp-ts/Either'
import * as t from 'io-ts'
import { of, race } from 'rxjs'
import { catchError, delay, map } from 'rxjs/operators'

export enum RelayerErrorTypes {
  RelayerTimeout = "RelayerTimeout",
  RelayerCommunicationError = "RelayerCommunicationError",
  RelayerInternalError = "RelayerInternalError"
}

class RelayerTimeout extends MetadataError<RelayerErrorTypes.RelayerTimeout> {
  constructor(meta: {cmd: RelayerCmd}) {
    super(RelayerErrorTypes.RelayerTimeout, meta)
  }
}

class RelayerCommunicationError extends MetadataError<RelayerErrorTypes.RelayerCommunicationError> {
  constructor(meta: {message, cmd}) {
    super(RelayerErrorTypes.RelayerCommunicationError, meta)
  }
}

class RelayerInternalError extends MetadataError<RelayerErrorTypes.RelayerInternalError> {
  constructor(meta: {errorType: string, message: string, metadata: any}) {
    super(RelayerErrorTypes.RelayerInternalError, meta)
  }
}

type RelayerError = RelayerTimeout | RelayerCommunicationError | RelayerInternalError
type RelayerResult<TResp> = Result<RelayerResponse<TResp>, RelayerError>

@Injectable()
export class RelayerProxyService {
  constructor(
    @Inject('RELAYER_SERVICE') private client: ClientProxy,
    @Inject(appConfig.KEY) private cfg: AppConfig
  ) {}

  async signPersonalMessage(
    input: SignPersonalMessageDto
  ): Promise<RelayerResult<string>> {
    return this.execute(RelayerCmd.SignPersonalMessage, input)
  }

  async getPhoneNumberIdentifier(
    input: DistributedBlindedPepperDto
  ): Promise<RelayerResult<string>> {
    return this.execute(RelayerCmd.GetPhoneNumberIdentifier, input)
  }

  async submitTransaction(
    input: SubmitTransactionDto
  ): Promise<RelayerResult<string>> {
    return this.execute<string>(RelayerCmd.SubmitTransaction, input)
  }


  async submitTransactionBatch(
    input: SubmitTransactionBatchDto
  ): Promise<RelayerResult<string>> {
    return this.execute(RelayerCmd.SubmitTransactionBatch, input)
  }

  private execute<TResp, TInput = any>(
    cmd: RelayerCmd,
    input: TInput,
  ): Promise<RelayerResult<TResp>> {
    return race<RelayerResult<TResp>>(
      of('timeout').pipe(
        delay(this.cfg.relayerRpcTimeoutMs),
        map(_ => Err(new RelayerTimeout({cmd})))
      ),
      this.client.send<RelayerResponse<TResp>>({cmd}, input).pipe(
        map((resp) => Ok(resp)),
        catchError(err => {
          const res = RelayerErrorPayload.decode(err)
          if (isRight(res)) {
            return of(Err(new RelayerInternalError(res.right)))
          } else {
            return of(Err(new RelayerCommunicationError({
              message: err.message,
              cmd
            })))

          }
        })
      )
    ).toPromise()
  }
}

const RelayerErrorPayload = t.type({
  errorType: t.string,
  message: t.string,
  metadata: t.unknown
})

type RelayerErrorPayload = t.TypeOf<typeof RelayerErrorPayload>

