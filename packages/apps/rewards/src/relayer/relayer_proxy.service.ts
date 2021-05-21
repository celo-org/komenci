import { Err, Ok, Result } from '@celo/base/lib/result'
import { MetadataError } from '@komenci/core'
import {
  RelayerCmd,
  RelayerResponse
} from '@komenci/relayer/dist/app.controller'
import { RelayerCommandDto } from '@komenci/relayer/dist/dto/RelayerCommandDto'
import { SubmitTransactionBatchDto } from '@komenci/relayer/dist/dto/SubmitTransactionBatchDto'
import { SubmitTransactionDto } from '@komenci/relayer/dist/dto/SubmitTransactionDto'
import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { isRight } from 'fp-ts/Either'
import * as t from 'io-ts'
import { of, race } from 'rxjs'
import { catchError, delay, map } from 'rxjs/operators'
import { AppConfig, appConfig } from '../config/app.config'

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
    this.message = `Relayer encountered an error: ${internalError.errorType} ${internalError.message}`
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
