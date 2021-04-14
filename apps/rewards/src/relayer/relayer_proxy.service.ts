import { MetadataError } from '@app/komenci-logger/errors'
import { appConfig, AppConfig } from '@app/onboarding/config/app.config'
import { Session } from '@app/onboarding/session/session.entity'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { Inject, Injectable, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { ClientProxy } from '@nestjs/microservices'
import { RelayerCmd, RelayerResponse } from 'apps/relayer/src/app.controller'
import { GetPhoneNumberSignatureDto } from 'apps/relayer/src/dto/GetPhoneNumberSignatureDto'
import { RelayerCommandDto } from 'apps/relayer/src/dto/RelayerCommandDto'
import { SignPersonalMessageDto } from 'apps/relayer/src/dto/SignPersonalMessageDto'
import { SubmitTransactionBatchDto } from 'apps/relayer/src/dto/SubmitTransactionBatchDto'
import { SubmitTransactionDto } from 'apps/relayer/src/dto/SubmitTransactionDto'
import { isRight } from 'fp-ts/Either'
import * as t from 'io-ts'
import { of, race } from 'rxjs'
import { catchError, delay, map } from 'rxjs/operators'

export enum RelayerErrorTypes {
  RelayerTimeout = 'RelayerTimeout',
  RelayerCommunicationError = 'RelayerCommunicationError',
  RelayerInternalError = 'RelayerInternalError'
}

const InternalErrorPayload = t.type({
  errorType: t.string,
  message: t.string,
  metadata: t.unknown
})

type InternalErrorPayload = t.TypeOf<typeof InternalErrorPayload>

class RelayerTimeout extends MetadataError<RelayerErrorTypes.RelayerTimeout> {
  metadataProps = ['cmd']

  constructor(readonly cmd: string) {
    super(RelayerErrorTypes.RelayerTimeout)
  }
}

class RelayerCommunicationError extends MetadataError<
  RelayerErrorTypes.RelayerCommunicationError
> {
  metadataProps = ['cmd']

  constructor(readonly message: string, readonly cmd: string) {
    super(RelayerErrorTypes.RelayerCommunicationError)
  }
}

class RelayerInternalError extends MetadataError<
  RelayerErrorTypes.RelayerInternalError
> {
  metadataProps = ['internalError']

  constructor(readonly internalError: InternalErrorPayload) {
    super(RelayerErrorTypes.RelayerInternalError)
    this.message = `Relayer encountered an error`
  }
}

type RelayerError =
  | RelayerTimeout
  | RelayerCommunicationError
  | RelayerInternalError
type RelayerResult<TResp> = Result<RelayerResponse<TResp>, RelayerError>

@Injectable()
export class RelayerProxyService {
  constructor(
    @Inject('RELAYER_SERVICE') private client: ClientProxy,
    @Inject(appConfig.KEY) private cfg: AppConfig
  ) {}

  async submitTransaction(
    input: SubmitTransactionDto,
    traceId: string
  ): Promise<RelayerResult<string>> {
    return this.execute(RelayerCmd.SubmitTransaction, input, traceId)
  }

  async submitTransactionBatch(
    input: SubmitTransactionBatchDto,
    traceId: string
  ): Promise<RelayerResult<string>> {
    return this.execute(RelayerCmd.SubmitTransactionBatch, input, traceId)
  }

  private execute<TResp, TInput extends RelayerCommandDto>(
    cmd: RelayerCmd,
    input: TInput,
    traceId: string
  ): Promise<RelayerResult<TResp>> {
    const inputWithContext: TInput = {
      ...input,
      context: {
        traceId,
        labels: []
      }
    }

    return race<RelayerResult<TResp>>(
      of('timeout').pipe(
        delay(this.cfg.relayerRpcTimeoutMs),
        map(_ => Err(new RelayerTimeout(cmd)))
      ),
      this.client.send<RelayerResponse<TResp>>({ cmd }, inputWithContext).pipe(
        map(resp => Ok(resp)),
        catchError(err => {
          const res = InternalErrorPayload.decode(err)
          if (isRight(res)) {
            return of(Err(new RelayerInternalError(res.right)))
          } else {
            return of(Err(new RelayerCommunicationError(err.message, cmd)))
          }
        })
      )
    ).toPromise()
  }
}
